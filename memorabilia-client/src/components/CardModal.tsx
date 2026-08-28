import { useEffect, useState } from "react";
import {
  deleteCard,
  createSellerTransaction,
  fetchGradingBatches,
  updateCard,
  updateCardDetails,
  updateCardStatus,
  updateCardValuation,
  uploadImage,
} from "../api";
import type {
  Card,
  GradingSubmissionBatch,
  InventoryLocationType,
} from "../types/card";
import SellerTransactionForm from "./SellerTransactionForm";
import { portfolioReadOnlyMessage } from "../access";

type Props = {
  card: Card;
  setSelectedCard: (card: Card | null) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  isFlipped: boolean;
  setIsFlipped: (v: boolean | ((prev: boolean) => boolean)) => void;
  loadCards: () => Promise<void>;
  onDeleted: () => Promise<void>;
  readOnly?: boolean;
};

export default function CardModal({
  card,
  setSelectedCard,
  uploading,
  setUploading,
  isFlipped,
  setIsFlipped,
  loadCards,
  onDeleted,
  readOnly = false,
}: Props) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [editingValuation, setEditingValuation] = useState(false);
  const [savingValuation, setSavingValuation] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [gradingBatches, setGradingBatches] = useState<
    GradingSubmissionBatch[]
  >([]);
  const [detailsForm, setDetailsForm] = useState({
    playerName: card.playerName,
    sport: card.sport,
    title: card.title,
    year: card.year.toString(),
    manufacturer: card.manufacturer,
    cardNumber: card.cardNumber ?? "",
    series: card.series ?? "",
    rookie: card.rookie,
    serialNumber: card.serialNumber ?? "",
    quantity: card.quantity.toString(),
    status: card.status,
    location: card.location ?? "",
    locationType: card.locationType ?? "",
    locationDetail: card.locationDetail ?? "",
    consignmentPartner: card.consignmentPartner ?? "",
    gradingSubmissionBatch: card.gradingSubmissionBatch ?? "",
    gradingSubmissionBatchId: card.gradingSubmissionBatchId ?? "",
    gradingCompany: card.gradingCompany ?? "",
    gradingServiceLevel: card.gradingServiceLevel ?? "",
    gradingSubmittedAt: card.gradingSubmittedAt?.slice(0, 10) ?? "",
    gradingReturnedAt: card.gradingReturnedAt?.slice(0, 10) ?? "",
    gradingFee: card.gradingFeeCents
      ? (card.gradingFeeCents / 100).toFixed(2)
      : "",
    gradingCertNumber: card.gradingCertNumber ?? "",
    finalGrade: card.finalGrade ?? "",
    expectedGradedValue: card.expectedGradedValueCents
      ? (card.expectedGradedValueCents / 100).toFixed(2)
      : "",
    gradingConfidence: card.gradingConfidence?.toString() ?? "",
    listingMarketplace: card.listingMarketplace ?? "",
    listingUrl: card.listingUrl ?? "",
    askingPrice: card.askingPriceCents
      ? (card.askingPriceCents / 100).toFixed(2)
      : "",
    listedAt: card.listedAt?.slice(0, 10) ?? "",
    soldAt: card.soldAt?.slice(0, 10) ?? "",
  });
  const [valuationForm, setValuationForm] = useState({
    goodConditionValue: card.goodConditionValue?.toString() ?? "",
    perfectConditionValue: card.perfectConditionValue?.toString() ?? "",
    valueSource: card.valueSource ?? "",
    valueSourceUrl: card.valueSourceUrl ?? "",
    valueConfidence: card.valueConfidence?.toString() ?? "",
    valueNotes: card.valueNotes ?? "",
  });
  const busy =
    uploading || undoing || savingDetails || savingValuation || deleting;
  const writeDisabled = busy || readOnly;
  const lastValuedAt = card.lastValuedAt
    ? new Date(card.lastValuedAt).toLocaleDateString()
    : null;

  useEffect(() => {
    let active = true;

    if (!editingDetails) return;

    fetchGradingBatches()
      .then((batches) => {
        if (active) setGradingBatches(batches);
      })
      .catch((error) => {
        console.error("Failed to load grading batches:", error);
        if (active) setActionError("Failed to load grading batches.");
      });

    return () => {
      active = false;
    };
  }, [editingDetails]);

  function resetValuationForm() {
    setValuationForm({
      goodConditionValue: card.goodConditionValue?.toString() ?? "",
      perfectConditionValue: card.perfectConditionValue?.toString() ?? "",
      valueSource: card.valueSource ?? "",
      valueSourceUrl: card.valueSourceUrl ?? "",
      valueConfidence: card.valueConfidence?.toString() ?? "",
      valueNotes: card.valueNotes ?? "",
    });
  }

  function resetDetailsForm() {
    setDetailsForm({
      playerName: card.playerName,
      sport: card.sport,
      title: card.title,
      year: card.year.toString(),
      manufacturer: card.manufacturer,
      cardNumber: card.cardNumber ?? "",
      series: card.series ?? "",
      rookie: card.rookie,
      serialNumber: card.serialNumber ?? "",
      quantity: card.quantity.toString(),
      status: card.status,
      location: card.location ?? "",
      locationType: card.locationType ?? "",
      locationDetail: card.locationDetail ?? "",
      consignmentPartner: card.consignmentPartner ?? "",
      gradingSubmissionBatch: card.gradingSubmissionBatch ?? "",
      gradingSubmissionBatchId: card.gradingSubmissionBatchId ?? "",
      gradingCompany: card.gradingCompany ?? "",
      gradingServiceLevel: card.gradingServiceLevel ?? "",
      gradingSubmittedAt: card.gradingSubmittedAt?.slice(0, 10) ?? "",
      gradingReturnedAt: card.gradingReturnedAt?.slice(0, 10) ?? "",
      gradingFee: card.gradingFeeCents
        ? (card.gradingFeeCents / 100).toFixed(2)
        : "",
      gradingCertNumber: card.gradingCertNumber ?? "",
      finalGrade: card.finalGrade ?? "",
      expectedGradedValue: card.expectedGradedValueCents
        ? (card.expectedGradedValueCents / 100).toFixed(2)
        : "",
      gradingConfidence: card.gradingConfidence?.toString() ?? "",
      listingMarketplace: card.listingMarketplace ?? "",
      listingUrl: card.listingUrl ?? "",
      askingPrice: card.askingPriceCents
        ? (card.askingPriceCents / 100).toFixed(2)
        : "",
      listedAt: card.listedAt?.slice(0, 10) ?? "",
      soldAt: card.soldAt?.slice(0, 10) ?? "",
    });
  }

  function parseOptionalNumber(value: string) {
    return value.trim() === "" ? null : Number(value);
  }

  function parseRequiredNumber(value: string) {
    return Number(value);
  }

  function moneyToCents(value: string) {
    const normalized = value.replace(/[$,]/g, "").trim();
    if (!normalized) return null;
    return Math.round(Number(normalized) * 100);
  }

  function optionalDate(value: string) {
    return value ? new Date(value).toISOString() : null;
  }

  return (
    <div
      className="modalOverlay"
      onClick={() => !busy && setSelectedCard(null)}
    >
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button
          className="modalClose"
          disabled={busy}
          onClick={() => setSelectedCard(null)}
        >
          X
        </button>

        <div className="modalTop">
          {readOnly && (
            <div className="portfolioReadOnlyBanner modalReadOnlyBanner" role="note">
              <strong>Portfolio demo</strong>
              <span>{portfolioReadOnlyMessage}</span>
            </div>
          )}

          <div className="cardFlipContainer">
            <div className={`cardFlipper ${isFlipped ? "flipped" : ""}`}>
              <div className="cardFront">
                {card.imageFrontUrl ? (
                  <img src={card.imageFrontUrl} alt={card.title} />
                ) : (
                  <div className="noBack">No Front Image</div>
                )}
              </div>

              <div className="cardBack">
                {card.imageBackUrl ? (
                  <img src={card.imageBackUrl} alt="Card back" />
                ) : (
                  <div className="noBack">No Back Image</div>
                )}
              </div>
            </div>
          </div>

          <div className="modalActionsRow">
            <button
              className="primaryButton"
              disabled={busy}
              onClick={() => setIsFlipped((prev) => !prev)}
            >
              Flip
            </button>

            <label
              className={`uploadButton cleanUpload ${writeDisabled ? "disabled" : ""}`}
              title={readOnly ? portfolioReadOnlyMessage : undefined}
            >
              {readOnly ? "Upload Locked" : "Upload"}
              <input
                type="file"
                accept="image/*"
                disabled={writeDisabled}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploading(true);
                  setActionError(null);

                  try {
                    const imageUrl = await uploadImage(file);
                    const updatedCard = await updateCard(
                      card.id,
                      isFlipped
                        ? { imageBackUrl: imageUrl }
                        : { imageFrontUrl: imageUrl },
                    );

                    setSelectedCard(updatedCard);
                    await loadCards();
                  } catch (error) {
                    console.error("Failed to upload card image:", error);
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Failed to upload image",
                    );
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>

            {card.status !== "NEW" && (
              <button
                className="secondaryButton"
                disabled={writeDisabled}
                title={readOnly ? portfolioReadOnlyMessage : undefined}
                onClick={async () => {
                  setUndoing(true);
                  setActionError(null);

                  try {
                    await updateCardStatus(card.id, "NEW");
                    await loadCards();
                    setSelectedCard(null);
                  } catch (error) {
                    console.error("Failed to undo status:", error);
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Failed to update status",
                    );
                  } finally {
                    setUndoing(false);
                  }
                }}
              >
                {undoing ? "Saving..." : "Undo"}
              </button>
            )}
          </div>

          {uploading && (
            <div className="uploadSpinnerContainer">
              <div className="uploadSpinner"></div>
            </div>
          )}

          {actionError && (
            <p className="modalError" role="alert">
              {actionError}
            </p>
          )}
        </div>

        <div className="modalInfo">
          <h2 className="modalTitle">{card.playerName}</h2>
          <p className="modalSubtitle">{card.title}</p>

          <div className="modalMeta">
            <p>
              <strong>Year:</strong> {card.year}
            </p>
            <p>
              <strong>Manufacturer:</strong> {card.manufacturer}
            </p>
            <p>
              <strong>Sport:</strong> {card.sport}
            </p>
            {card.cardNumber && (
              <p>
                <strong>Card number:</strong> {card.cardNumber}
              </p>
            )}
            {card.series && (
              <p>
                <strong>Series:</strong> {card.series}
              </p>
            )}
            {card.location && (
              <p>
                <strong>Location:</strong> {card.location}
              </p>
            )}
            {card.locationType && (
              <p>
                <strong>Location workflow:</strong>{" "}
                {card.locationType.replaceAll("_", " ")}
              </p>
            )}
            {card.locationDetail && (
              <p>
                <strong>Location detail:</strong> {card.locationDetail}
              </p>
            )}
            {card.consignmentPartner && (
              <p>
                <strong>Consignment:</strong> {card.consignmentPartner}
              </p>
            )}
            {card.gradingSubmissionBatch && (
              <p>
                <strong>Grading batch:</strong> {card.gradingSubmissionBatch}
              </p>
            )}
            {card.gradingCompany && (
              <p>
                <strong>Grading company:</strong> {card.gradingCompany}
              </p>
            )}
            {card.finalGrade && (
              <p>
                <strong>Final grade:</strong> {card.finalGrade}
              </p>
            )}
            {card.gradingCertNumber && (
              <p>
                <strong>Cert number:</strong> {card.gradingCertNumber}
              </p>
            )}
            {card.expectedGradedValueCents !== null && (
              <p>
                <strong>Expected graded value:</strong> $
                {(card.expectedGradedValueCents / 100).toFixed(2)}
              </p>
            )}
            {card.inventoryAgeDays !== null && (
              <p>
                <strong>Inventory age:</strong> {card.inventoryAgeDays} days
              </p>
            )}
            {card.priceReductionRecommendation && (
              <p>
                <strong>Price reduction:</strong> Reduce{" "}
                {card.priceReductionRecommendation.reductionPercent}% to $
                {(
                  card.priceReductionRecommendation.recommendedPriceCents / 100
                ).toFixed(2)}
              </p>
            )}
            {card.listingMarketplace && (
              <p>
                <strong>Listed on:</strong> {card.listingMarketplace}
              </p>
            )}
            {card.askingPriceCents !== null && (
              <p>
                <strong>Asking price:</strong> $
                {(card.askingPriceCents / 100).toFixed(2)}
              </p>
            )}
            {card.listingUrl && (
              <p>
                <strong>Listing URL:</strong>{" "}
                <a href={card.listingUrl} target="_blank" rel="noreferrer">
                  Open listing
                </a>
              </p>
            )}
            {card.listedAt && (
              <p>
                <strong>Listed date:</strong>{" "}
                {new Date(card.listedAt).toLocaleDateString()}
              </p>
            )}
            {card.soldAt && (
              <p>
                <strong>Sold date:</strong>{" "}
                {new Date(card.soldAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="detailsHeader">
            <h3>Card Details</h3>
            <button
              type="button"
              className="secondaryButton"
              disabled={writeDisabled}
              title={readOnly ? portfolioReadOnlyMessage : undefined}
              onClick={() => {
                if (readOnly) return;
                resetDetailsForm();
                setActionError(null);
                setEditingDetails((current) => !current);
              }}
            >
              {editingDetails ? "Cancel" : "Edit"}
            </button>
          </div>

          {editingDetails && (
            <form
              className="detailsForm"
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingDetails(true);
                setActionError(null);

                try {
                  const updatedCard = await updateCardDetails(card.id, {
                    playerName: detailsForm.playerName.trim(),
                    sport: detailsForm.sport.trim(),
                    title: detailsForm.title.trim(),
                    year: parseRequiredNumber(detailsForm.year),
                    manufacturer: detailsForm.manufacturer.trim(),
                    cardNumber: detailsForm.cardNumber.trim() || null,
                    series: detailsForm.series.trim() || null,
                    rookie: detailsForm.rookie,
                    serialNumber: detailsForm.serialNumber.trim() || null,
                    quantity: parseRequiredNumber(detailsForm.quantity),
                    status: detailsForm.status,
                    location: detailsForm.location.trim() || null,
                    locationType:
                      (detailsForm.locationType as InventoryLocationType) ||
                      null,
                    locationDetail: detailsForm.locationDetail.trim() || null,
                    consignmentPartner:
                      detailsForm.consignmentPartner.trim() || null,
                    gradingSubmissionBatch:
                      detailsForm.gradingSubmissionBatch.trim() || null,
                    gradingSubmissionBatchId:
                      detailsForm.gradingSubmissionBatchId.trim() || null,
                    gradingCompany:
                      (detailsForm.gradingCompany as Card["gradingCompany"]) ||
                      null,
                    gradingServiceLevel:
                      detailsForm.gradingServiceLevel.trim() || null,
                    gradingSubmittedAt: optionalDate(
                      detailsForm.gradingSubmittedAt,
                    ),
                    gradingReturnedAt: optionalDate(
                      detailsForm.gradingReturnedAt,
                    ),
                    gradingFeeCents: moneyToCents(detailsForm.gradingFee),
                    gradingCertNumber:
                      detailsForm.gradingCertNumber.trim() || null,
                    finalGrade: detailsForm.finalGrade.trim() || null,
                    expectedGradedValueCents: moneyToCents(
                      detailsForm.expectedGradedValue,
                    ),
                    gradingConfidence: parseOptionalNumber(
                      detailsForm.gradingConfidence,
                    ),
                    listingMarketplace:
                      detailsForm.listingMarketplace.trim() || null,
                    listingUrl: detailsForm.listingUrl.trim() || null,
                    askingPriceCents: moneyToCents(detailsForm.askingPrice),
                    listedAt: optionalDate(detailsForm.listedAt),
                    soldAt: optionalDate(detailsForm.soldAt),
                  });

                  setSelectedCard(updatedCard);
                  setEditingDetails(false);
                  await loadCards();
                } catch (error) {
                  console.error("Failed to update card details:", error);
                  setActionError(
                    error instanceof Error
                      ? error.message
                      : "Failed to update card details",
                  );
                } finally {
                  setSavingDetails(false);
                }
              }}
            >
              <div className="detailsGrid">
                <label>
                  Player
                  <input
                    type="text"
                    required
                    value={detailsForm.playerName}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        playerName: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Sport
                  <input
                    type="text"
                    required
                    value={detailsForm.sport}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        sport: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Title
                  <input
                    type="text"
                    required
                    value={detailsForm.title}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Year
                  <input
                    type="number"
                    min="1800"
                    required
                    value={detailsForm.year}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        year: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Manufacturer
                  <input
                    type="text"
                    required
                    value={detailsForm.manufacturer}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        manufacturer: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Card number
                  <input
                    type="text"
                    value={detailsForm.cardNumber}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        cardNumber: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Series
                  <input
                    type="text"
                    value={detailsForm.series}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        series: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Serial number
                  <input
                    type="text"
                    value={detailsForm.serialNumber}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        serialNumber: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={detailsForm.status}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        status: e.target.value as Card["status"],
                      }))
                    }
                  >
                    <option value="NEW">New</option>
                    <option value="READY_TO_LIST">Ready to list</option>
                    <option value="LISTED">Listed</option>
                    <option value="SOLD">Sold</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="GRADED">Graded</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    required
                    value={detailsForm.quantity}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        quantity: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Location note
                  <input
                    type="text"
                    value={detailsForm.location}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        location: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Location workflow
                  <select
                    value={detailsForm.locationType}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        locationType: e.target.value,
                      }))
                    }
                  >
                    <option value="">Unset</option>
                    <option value="BOX">Box</option>
                    <option value="SHELF">Shelf</option>
                    <option value="BINDER">Binder</option>
                    <option value="CONSIGNMENT">Consignment</option>
                    <option value="GRADING_SUBMISSION">Grading batch</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label>
                  Box, shelf, or binder
                  <input
                    type="text"
                    value={detailsForm.locationDetail}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        locationDetail: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Consignment partner
                  <input
                    type="text"
                    value={detailsForm.consignmentPartner}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        consignmentPartner: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Batch note
                  <input
                    type="text"
                    value={detailsForm.gradingSubmissionBatch}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingSubmissionBatch: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Submission batch
                  <select
                    value={detailsForm.gradingSubmissionBatchId}
                    onChange={(e) =>
                      setDetailsForm((current) => {
                        const selectedBatch = gradingBatches.find(
                          (batch) => batch.id === e.target.value,
                        );

                        return {
                          ...current,
                          gradingSubmissionBatchId: e.target.value,
                          gradingSubmissionBatch: selectedBatch
                            ? selectedBatch.name
                            : current.gradingSubmissionBatch,
                          gradingCompany:
                            selectedBatch?.company ?? current.gradingCompany,
                          gradingServiceLevel:
                            selectedBatch?.serviceLevel ??
                            current.gradingServiceLevel,
                          gradingSubmittedAt:
                            selectedBatch?.submittedAt?.slice(0, 10) ??
                            current.gradingSubmittedAt,
                          locationType: e.target.value
                            ? "GRADING_SUBMISSION"
                            : current.locationType,
                        };
                      })
                    }
                  >
                    <option value="">Unset</option>
                    {gradingBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} - {batch.company}
                        {batch.serviceLevel ? ` ${batch.serviceLevel}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Grading company
                  <select
                    value={detailsForm.gradingCompany}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingCompany: e.target.value,
                      }))
                    }
                  >
                    <option value="">Unset</option>
                    <option value="PSA">PSA</option>
                    <option value="SGC">SGC</option>
                    <option value="BECKETT">Beckett</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label>
                  Service level
                  <input
                    type="text"
                    value={detailsForm.gradingServiceLevel}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingServiceLevel: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Grading fee
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={detailsForm.gradingFee}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingFee: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Expected graded value
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={detailsForm.expectedGradedValue}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        expectedGradedValue: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Grading confidence
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={detailsForm.gradingConfidence}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingConfidence: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Submitted date
                  <input
                    type="date"
                    value={detailsForm.gradingSubmittedAt}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingSubmittedAt: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Return date
                  <input
                    type="date"
                    value={detailsForm.gradingReturnedAt}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingReturnedAt: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Final grade
                  <input
                    type="text"
                    value={detailsForm.finalGrade}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        finalGrade: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Cert number
                  <input
                    type="text"
                    value={detailsForm.gradingCertNumber}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        gradingCertNumber: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Listing marketplace
                  <input
                    type="text"
                    value={detailsForm.listingMarketplace}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        listingMarketplace: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Asking price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={detailsForm.askingPrice}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        askingPrice: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Listed date
                  <input
                    type="date"
                    value={detailsForm.listedAt}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        listedAt: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Sold date
                  <input
                    type="date"
                    value={detailsForm.soldAt}
                    onChange={(e) =>
                      setDetailsForm((current) => ({
                        ...current,
                        soldAt: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Listing URL
                <input
                  type="url"
                  value={detailsForm.listingUrl}
                  onChange={(e) =>
                    setDetailsForm((current) => ({
                      ...current,
                      listingUrl: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="detailsCheckbox">
                <input
                  type="checkbox"
                  checked={detailsForm.rookie}
                  onChange={(e) =>
                    setDetailsForm((current) => ({
                      ...current,
                      rookie: e.target.checked,
                    }))
                  }
                />
                Rookie card
              </label>

              <div className="detailsActions">
                <button
                  type="button"
                  className="secondaryButton"
                  disabled={busy}
                  onClick={() => {
                    resetDetailsForm();
                    setEditingDetails(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primaryButton" disabled={busy}>
                  {savingDetails ? "Saving..." : "Save details"}
                </button>
              </div>
            </form>
          )}

          <div className="detailsHeader">
            <h3>Seller Ledger</h3>
            <button
              type="button"
              className="secondaryButton"
              disabled={writeDisabled}
              title={readOnly ? portfolioReadOnlyMessage : undefined}
              onClick={() => {
                if (readOnly) return;
                setActionError(null);
                setAddingTransaction((current) => !current);
              }}
            >
              {addingTransaction ? "Cancel" : "Add Purchase/Sale"}
            </button>
          </div>

          {addingTransaction && (
            <SellerTransactionForm
              compact
              defaultCardId={card.id}
              onCancel={() => setAddingTransaction(false)}
              onSubmit={async (input) => {
                await createSellerTransaction(input);
                setAddingTransaction(false);
                await loadCards();
              }}
            />
          )}

          <div className="modalValues">
            {card.goodConditionValue !== null && (
              <div>
                <span>Good Value</span>
                <strong className="good">
                  ${card.goodConditionValue.toLocaleString()}
                </strong>
              </div>
            )}

            {card.perfectConditionValue !== null && (
              <div>
                <span>Perfect Value</span>
                <strong className="perfect">
                  ${card.perfectConditionValue.toLocaleString()}
                </strong>
              </div>
            )}
          </div>

          <div className="valuationHeader">
            <h3>Valuation</h3>
            <button
              type="button"
              className="secondaryButton"
              disabled={writeDisabled}
              title={readOnly ? portfolioReadOnlyMessage : undefined}
              onClick={() => {
                if (readOnly) return;
                resetValuationForm();
                setActionError(null);
                setEditingValuation((current) => !current);
              }}
            >
              {editingValuation ? "Cancel" : "Edit"}
            </button>
          </div>

          {editingValuation && (
            <form
              className="valuationForm"
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingValuation(true);
                setActionError(null);

                try {
                  const updatedCard = await updateCardValuation(card.id, {
                    provider: "manual",
                    goodConditionValue: parseOptionalNumber(
                      valuationForm.goodConditionValue,
                    ),
                    perfectConditionValue: parseOptionalNumber(
                      valuationForm.perfectConditionValue,
                    ),
                    valueSource: valuationForm.valueSource.trim() || null,
                    valueSourceUrl: valuationForm.valueSourceUrl.trim() || null,
                    valueConfidence: parseOptionalNumber(
                      valuationForm.valueConfidence,
                    ),
                    valueNotes: valuationForm.valueNotes.trim() || null,
                  });

                  setSelectedCard(updatedCard);
                  setEditingValuation(false);
                  await loadCards();
                } catch (error) {
                  console.error("Failed to update valuation:", error);
                  setActionError(
                    error instanceof Error
                      ? error.message
                      : "Failed to update valuation",
                  );
                } finally {
                  setSavingValuation(false);
                }
              }}
            >
              <div className="valuationGrid">
                <label>
                  Raw value
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={valuationForm.goodConditionValue}
                    onChange={(e) =>
                      setValuationForm((current) => ({
                        ...current,
                        goodConditionValue: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Perfect value
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={valuationForm.perfectConditionValue}
                    onChange={(e) =>
                      setValuationForm((current) => ({
                        ...current,
                        perfectConditionValue: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Confidence
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={valuationForm.valueConfidence}
                    onChange={(e) =>
                      setValuationForm((current) => ({
                        ...current,
                        valueConfidence: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Source
                  <input
                    type="text"
                    value={valuationForm.valueSource}
                    onChange={(e) =>
                      setValuationForm((current) => ({
                        ...current,
                        valueSource: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Source URL
                <input
                  type="url"
                  value={valuationForm.valueSourceUrl}
                  onChange={(e) =>
                    setValuationForm((current) => ({
                      ...current,
                      valueSourceUrl: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Notes
                <textarea
                  rows={3}
                  value={valuationForm.valueNotes}
                  onChange={(e) =>
                    setValuationForm((current) => ({
                      ...current,
                      valueNotes: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="valuationActions">
                <button
                  type="button"
                  className="secondaryButton"
                  disabled={busy}
                  onClick={() => {
                    resetValuationForm();
                    setEditingValuation(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primaryButton" disabled={busy}>
                  {savingValuation ? "Saving..." : "Save valuation"}
                </button>
              </div>
            </form>
          )}

          <p className="modalQuantity">
            <strong>Quantity:</strong> {card.quantity}
          </p>

          {(card.valueSource || lastValuedAt || card.valueNotes) && (
            <div className="modalValuationMeta">
              {card.valueSource && (
                <p>
                  <strong>Value source:</strong>{" "}
                  {card.valueSourceUrl ? (
                    <a
                      href={card.valueSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {card.valueSource}
                    </a>
                  ) : (
                    card.valueSource
                  )}
                </p>
              )}
              {card.valueConfidence !== null && (
                <p>
                  <strong>Confidence:</strong> {card.valueConfidence}%
                </p>
              )}
              {lastValuedAt && (
                <p>
                  <strong>Last valued:</strong> {lastValuedAt}
                </p>
              )}
              {card.valueNotes && (
                <p>
                  <strong>Notes:</strong> {card.valueNotes}
                </p>
              )}
            </div>
          )}

          <div className="dangerZone">
            <div>
              <h3>Delete Card</h3>
              <p>Permanently remove this card from the inventory.</p>
            </div>

            {!confirmingDelete ? (
              <button
                type="button"
                className="dangerButton"
                disabled={writeDisabled}
                title={readOnly ? portfolioReadOnlyMessage : undefined}
                onClick={() => {
                  if (readOnly) return;
                  setActionError(null);
                  setConfirmingDelete(true);
                }}
              >
                Delete card
              </button>
            ) : (
              <div className="deleteConfirmation">
                <p>
                  Delete <strong>{card.playerName}</strong>? This cannot be
                  undone.
                </p>
                <div>
                  <button
                    type="button"
                    className="secondaryButton"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="dangerButton"
                    disabled={busy}
                    onClick={async () => {
                      setDeleting(true);
                      setActionError(null);

                      try {
                        await deleteCard(card.id);
                        await onDeleted();
                      } catch (error) {
                        console.error("Failed to delete card:", error);
                        setActionError(
                          error instanceof Error
                            ? error.message
                            : "Failed to delete card",
                        );
                      } finally {
                        setDeleting(false);
                      }
                    }}
                  >
                    {deleting ? "Deleting..." : "Delete permanently"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
