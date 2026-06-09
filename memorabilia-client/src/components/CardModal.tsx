import { useState } from "react";
import {
  updateCard,
  updateCardStatus,
  updateCardValuation,
  uploadImage,
} from "../api";
import type { Card } from "../types/card";

type Props = {
  card: Card;
  setSelectedCard: (card: Card | null) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  isFlipped: boolean;
  setIsFlipped: (v: boolean | ((prev: boolean) => boolean)) => void;
  loadCards: () => Promise<void>;
};

export default function CardModal({
  card,
  setSelectedCard,
  uploading,
  setUploading,
  isFlipped,
  setIsFlipped,
  loadCards,
}: Props) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [editingValuation, setEditingValuation] = useState(false);
  const [savingValuation, setSavingValuation] = useState(false);
  const [valuationForm, setValuationForm] = useState({
    goodConditionValue: card.goodConditionValue?.toString() ?? "",
    perfectConditionValue: card.perfectConditionValue?.toString() ?? "",
    valueSource: card.valueSource ?? "",
    valueSourceUrl: card.valueSourceUrl ?? "",
    valueConfidence: card.valueConfidence?.toString() ?? "",
    valueNotes: card.valueNotes ?? "",
  });
  const busy = uploading || undoing || savingValuation;
  const lastValuedAt = card.lastValuedAt
    ? new Date(card.lastValuedAt).toLocaleDateString()
    : null;

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

  function parseOptionalNumber(value: string) {
    return value.trim() === "" ? null : Number(value);
  }

  return (
    <div className="modalOverlay" onClick={() => setSelectedCard(null)}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={() => setSelectedCard(null)}>
          X
        </button>

        <div className="modalTop">
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
              className={`uploadButton cleanUpload ${busy ? "disabled" : ""}`}
            >
              Upload
              <input
                type="file"
                accept="image/*"
                disabled={busy}
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
                disabled={busy}
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
          </div>

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
              disabled={busy}
              onClick={() => {
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
        </div>
      </div>
    </div>
  );
}
