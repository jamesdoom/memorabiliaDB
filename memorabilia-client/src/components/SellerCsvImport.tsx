import { useMemo, useRef, useState } from "react";
import { importSellerTransactions } from "../api";
import type {
  SellerTransactionImportInput,
  SellerTransactionType,
} from "../types/card";

type SellerCsvImportProps = {
  onImported: () => Promise<void>;
};

type ParsedRow = {
  rowNumber: number;
  transaction: SellerTransactionImportInput | null;
  errors: string[];
};

const REQUIRED_COLUMNS = ["type", "occurredAt"];
const VALID_TYPES = new Set([
  "PURCHASE",
  "SALE",
  "REFUND",
  "RETURN",
  "ADJUSTMENT",
]);

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseMoneyToCents(value: string | undefined) {
  if (!value) return 0;

  const normalized = value.replace(/[$,]/g, "").trim();
  if (!normalized) return 0;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.round(parsed * 100);
}

function parsePositiveInt(value: string | undefined) {
  if (!value) return 1;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;

  return parsed;
}

function getOptionalValue(
  row: Record<string, string>,
  key: string,
): string | null {
  const value = row[key]?.trim();
  return value ? value : null;
}

function parseTransactionsCsv(text: string, sourceFile: string): ParsedRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [
      {
        rowNumber: 1,
        transaction: null,
        errors: ["CSV needs a header row and at least one transaction row."],
      },
    ];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column),
  );

  if (missingColumns.length > 0) {
    return [
      {
        rowNumber: 1,
        transaction: null,
        errors: [`Missing required columns: ${missingColumns.join(", ")}.`],
      },
    ];
  }

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const row = headers.reduce<Record<string, string>>((acc, header, i) => {
      acc[header] = values[i] ?? "";
      return acc;
    }, {});
    const errors: string[] = [];
    const type = row.type?.toUpperCase();
    const parsedAmountCents = row.amountCents
      ? Number(row.amountCents)
      : parseMoneyToCents(row.amount);
    const parsedCostBasisCents = row.costBasisCents
      ? Number(row.costBasisCents)
      : parseMoneyToCents(row.costBasis);
    const marketplaceFees = parseMoneyToCents(row.marketplaceFees);
    const shippingCost = parseMoneyToCents(row.shippingCost);
    const gradingCost = parseMoneyToCents(row.gradingCost);
    const suppliesCost = parseMoneyToCents(row.suppliesCost);
    const quantity = parsePositiveInt(row.quantity);
    const lotCardCount = row.lotCardCount?.trim()
      ? Number(row.lotCardCount)
      : null;
    const occurredAt = row.occurredAt?.trim();

    if (!VALID_TYPES.has(type ?? "")) {
      errors.push("type must be PURCHASE, SALE, REFUND, RETURN, or ADJUSTMENT");
    }

    if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) {
      errors.push("occurredAt must be a valid date");
    }

    if (
      parsedAmountCents === null ||
      !Number.isInteger(parsedAmountCents) ||
      parsedAmountCents < 0
    ) {
      errors.push("amount or amountCents must be a valid non-negative amount");
    }
    if (
      parsedCostBasisCents === null ||
      !Number.isInteger(parsedCostBasisCents) ||
      parsedCostBasisCents < 0
    ) {
      errors.push(
        "costBasis or costBasisCents must be a valid non-negative amount",
      );
    }

    if (marketplaceFees === null) errors.push("marketplaceFees is invalid");
    if (shippingCost === null) errors.push("shippingCost is invalid");
    if (gradingCost === null) errors.push("gradingCost is invalid");
    if (suppliesCost === null) errors.push("suppliesCost is invalid");
    if (quantity === null) errors.push("quantity must be a positive integer");
    if (
      lotCardCount !== null &&
      (!Number.isInteger(lotCardCount) || lotCardCount < 1)
    ) {
      errors.push("lotCardCount must be a positive integer");
    }

    const amountCents = parsedAmountCents ?? 0;
    const costBasisCents = parsedCostBasisCents ?? 0;

    return {
      rowNumber: index + 2,
      transaction:
        errors.length === 0
          ? {
              type: type as SellerTransactionType,
              occurredAt,
              amountCents,
              costBasisCents,
              cardId: getOptionalValue(row, "cardId"),
              cardSlug: getOptionalValue(row, "cardSlug"),
              quantity: quantity as number,
              lotName: getOptionalValue(row, "lotName"),
              lotCardCount,
              marketplace: getOptionalValue(row, "marketplace"),
              orderId: getOptionalValue(row, "orderId"),
              marketplaceFees: marketplaceFees as number,
              shippingCost: shippingCost as number,
              gradingCost: gradingCost as number,
              suppliesCost: suppliesCost as number,
              notes: getOptionalValue(row, "notes"),
              sourceFile,
            }
          : null,
      errors,
    };
  });
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function SellerCsvImport({ onImported }: SellerCsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validTransactions = useMemo(
    () =>
      rows
        .map((row) => row.transaction)
        .filter(
          (transaction): transaction is SellerTransactionImportInput =>
            transaction !== null,
        ),
    [rows],
  );

  const invalidRows = rows.filter((row) => row.errors.length > 0);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage(null);
    setError(null);

    if (!file) return;

    const text = await file.text();
    setFileName(file.name);
    setRows(parseTransactionsCsv(text, file.name));
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await importSellerTransactions(validTransactions);
      setMessage(`Imported ${result.imported} transaction records.`);
      setRows([]);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await onImported();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import transactions",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="sellerImport" aria-labelledby="seller-import-title">
      <div className="sellerImportHeader">
        <div>
          <p className="sellerEyebrow">CSV Import</p>
          <h2 id="seller-import-title">Purchases And Sales</h2>
        </div>
        <label className="secondaryButton sellerFilePicker">
          Choose CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {fileName && (
        <p className="sellerMuted">
          {fileName}: {validTransactions.length} ready, {invalidRows.length}{" "}
          needs review
        </p>
      )}

      {message && <p className="sellerSuccess">{message}</p>}
      {error && <p className="sellerError">{error}</p>}

      {invalidRows.length > 0 && (
        <div className="sellerImportIssues" role="alert">
          {invalidRows.slice(0, 3).map((row) => (
            <p key={row.rowNumber}>
              Row {row.rowNumber}: {row.errors.join(", ")}
            </p>
          ))}
        </div>
      )}

      {validTransactions.length > 0 && (
        <>
          <div className="sellerPreview">
            {validTransactions.slice(0, 3).map((transaction, index) => (
              <div key={`${transaction.occurredAt}-${index}`}>
                <span>{transaction.type}</span>
                <strong>{formatCurrency(transaction.amountCents)}</strong>
                <small>
                  {transaction.occurredAt}
                  {transaction.marketplace
                    ? ` at ${transaction.marketplace}`
                    : ""}
                </small>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="primaryButton sellerImportButton"
            disabled={importing || invalidRows.length > 0}
            onClick={handleImport}
          >
            {importing ? "Importing..." : "Import Transactions"}
          </button>
        </>
      )}
    </section>
  );
}

export default SellerCsvImport;
