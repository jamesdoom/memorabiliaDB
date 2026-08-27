import { useEffect, useState } from "react";
import type {
  SellerTransaction,
  SellerTransactionImportInput,
  SellerTransactionType,
} from "../types/card";

type SellerTransactionFormProps = {
  initialTransaction?: SellerTransaction;
  defaultType?: SellerTransactionType;
  defaultCardId?: string;
  compact?: boolean;
  onCancel?: () => void;
  onSubmit: (input: SellerTransactionImportInput) => Promise<void>;
};

const defaultForm = {
  type: "SALE" as SellerTransactionType,
  occurredAt: new Date().toISOString().slice(0, 10),
  amount: "",
  costBasis: "",
  cardSlug: "",
  quantity: "1",
  lotName: "",
  lotCardCount: "",
  marketplace: "",
  orderId: "",
  marketplaceFees: "",
  shippingCost: "",
  gradingCost: "",
  suppliesCost: "",
  notes: "",
};

const marketplaceFeePresets = [
  { label: "No preset", marketplace: "", rate: 0 },
  { label: "eBay 13.25%", marketplace: "eBay", rate: 0.1325 },
  { label: "COMC 10%", marketplace: "COMC", rate: 0.1 },
  { label: "Whatnot 11%", marketplace: "Whatnot", rate: 0.11 },
  { label: "Mercari 10%", marketplace: "Mercari", rate: 0.1 },
];

function centsToDollars(cents: number | null | undefined) {
  if (!cents) return "";
  return (cents / 100).toFixed(2);
}

function moneyToCents(value: string) {
  const normalized = value.replace(/[$,]/g, "").trim();
  if (!normalized) return 0;
  return Math.round(Number(normalized) * 100);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildInitialForm(
  transaction?: SellerTransaction,
  defaultType?: SellerTransactionType,
) {
  if (!transaction) {
    return {
      ...defaultForm,
      type: defaultType ?? defaultForm.type,
    };
  }

  return {
    type: transaction.type,
    occurredAt: transaction.occurredAt.slice(0, 10),
    amount: centsToDollars(transaction.amountCents),
    costBasis: centsToDollars(transaction.costBasisCents),
    cardSlug: transaction.card?.slug ?? "",
    quantity: transaction.quantity.toString(),
    lotName: transaction.lotName ?? "",
    lotCardCount: transaction.lotCardCount?.toString() ?? "",
    marketplace: transaction.marketplace ?? "",
    orderId: transaction.orderId ?? "",
    marketplaceFees: centsToDollars(transaction.marketplaceFees),
    shippingCost: centsToDollars(transaction.shippingCost),
    gradingCost: centsToDollars(transaction.gradingCost),
    suppliesCost: centsToDollars(transaction.suppliesCost),
    notes: transaction.notes ?? "",
  };
}

function SellerTransactionForm({
  initialTransaction,
  defaultType,
  defaultCardId,
  compact = false,
  onCancel,
  onSubmit,
}: SellerTransactionFormProps) {
  const [form, setForm] = useState(() =>
    buildInitialForm(initialTransaction, defaultType),
  );
  const [feePreset, setFeePreset] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialTransaction && defaultType) {
      setForm((current) => ({
        ...current,
        type: defaultType,
      }));
    }
  }, [defaultType, initialTransaction]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        type: form.type,
        occurredAt: form.occurredAt,
        amountCents: moneyToCents(form.amount),
        costBasisCents: moneyToCents(form.costBasis),
        cardId: defaultCardId ?? initialTransaction?.cardId ?? null,
        cardSlug: defaultCardId ? null : optionalText(form.cardSlug),
        quantity: Number(form.quantity),
        lotName: optionalText(form.lotName),
        lotCardCount: form.lotCardCount.trim()
          ? Number(form.lotCardCount)
          : null,
        marketplace: optionalText(form.marketplace),
        orderId: optionalText(form.orderId),
        marketplaceFees: moneyToCents(form.marketplaceFees),
        shippingCost: moneyToCents(form.shippingCost),
        gradingCost: moneyToCents(form.gradingCost),
        suppliesCost: moneyToCents(form.suppliesCost),
        notes: optionalText(form.notes),
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save transaction",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={`transactionForm ${compact ? "compact" : ""}`}
      onSubmit={handleSubmit}
    >
      <div className="detailsGrid">
        <label>
          Type
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as SellerTransactionType,
              }))
            }
          >
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
            <option value="REFUND">Refund</option>
            <option value="RETURN">Return</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            required
            value={form.occurredAt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                occurredAt: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Cost basis
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.costBasis}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                costBasis: event.target.value,
              }))
            }
          />
        </label>

        {!defaultCardId && (
          <label>
            Card slug
            <input
              type="text"
              value={form.cardSlug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cardSlug: event.target.value,
                }))
              }
            />
          </label>
        )}

        <label>
          Quantity
          <input
            type="number"
            min="1"
            required
            value={form.quantity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                quantity: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Lot name
          <input
            type="text"
            value={form.lotName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lotName: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Lot card count
          <input
            type="number"
            min="1"
            value={form.lotCardCount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lotCardCount: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Marketplace
          <input
            type="text"
            value={form.marketplace}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                marketplace: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Fee preset
          <select
            value={feePreset}
            onChange={(event) => {
              setFeePreset(event.target.value);
              const preset = marketplaceFeePresets[Number(event.target.value)];
              if (!preset || preset.rate === 0) return;

              setForm((current) => ({
                ...current,
                marketplace: preset.marketplace,
                marketplaceFees: (
                  (moneyToCents(current.amount) * preset.rate) /
                  100
                ).toFixed(2),
              }));
            }}
          >
            {marketplaceFeePresets.map((preset, index) => (
              <option key={preset.label} value={index}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Order ID
          <input
            type="text"
            value={form.orderId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                orderId: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Marketplace fees
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.marketplaceFees}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                marketplaceFees: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Shipping
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.shippingCost}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingCost: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Grading
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.gradingCost}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                gradingCost: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Supplies
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.suppliesCost}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                suppliesCost: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label>
        Notes
        <textarea
          rows={compact ? 2 : 3}
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
        />
      </label>

      {error && (
        <p className="modalError" role="alert">
          {error}
        </p>
      )}

      <div className="detailsActions">
        {onCancel && (
          <button
            type="button"
            className="secondaryButton"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="primaryButton" disabled={saving}>
          {saving ? "Saving..." : initialTransaction ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}

export default SellerTransactionForm;
