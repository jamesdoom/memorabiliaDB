import { useState } from "react";
import { createCard } from "../api";
import type { Card } from "../types/card";

type Props = {
  onClose: () => void;
  onCreated: (card: Card) => Promise<void>;
};

const initialForm = {
  playerName: "",
  sport: "",
  title: "",
  year: "",
  manufacturer: "",
  cardNumber: "",
  series: "",
  serialNumber: "",
  quantity: "1",
  location: "",
  rookie: false,
  goodConditionValue: "",
  perfectConditionValue: "",
  valueConfidence: "",
};

function optionalNumber(value: string) {
  return value.trim() === "" ? null : Number(value);
}

export default function AddCardModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="modalOverlay" onClick={() => !saving && onClose()}>
      <div
        className="modalContent addCardModal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modalClose"
          disabled={saving}
          onClick={onClose}
          aria-label="Close add card form"
        >
          X
        </button>

        <div className="addCardHeading">
          <h2>Add Card</h2>
        </div>

        <form
          className="detailsForm addCardForm"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError(null);

            try {
              const goodConditionValue = optionalNumber(
                form.goodConditionValue,
              );
              const perfectConditionValue = optionalNumber(
                form.perfectConditionValue,
              );
              const hasValuation =
                goodConditionValue !== null || perfectConditionValue !== null;

              const createdCard = await createCard({
                playerName: form.playerName.trim(),
                sport: form.sport.trim(),
                title: form.title.trim(),
                year: Number(form.year),
                manufacturer: form.manufacturer.trim(),
                cardNumber: form.cardNumber.trim() || null,
                series: form.series.trim() || null,
                serialNumber: form.serialNumber.trim() || null,
                quantity: Number(form.quantity),
                location: form.location.trim() || null,
                rookie: form.rookie,
                goodConditionValue,
                perfectConditionValue,
                valueSource: hasValuation ? "Manual estimate" : null,
                valueConfidence: hasValuation
                  ? optionalNumber(form.valueConfidence)
                  : null,
                lastValuedAt: hasValuation ? new Date().toISOString() : null,
              });

              await onCreated(createdCard);
            } catch (caughtError) {
              console.error("Failed to create card:", caughtError);
              setError(
                caughtError instanceof Error
                  ? caughtError.message
                  : "Failed to create card",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="detailsGrid">
            <label>
              Player
              <input
                type="text"
                required
                value={form.playerName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    playerName: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Sport
              <input
                type="text"
                required
                value={form.sport}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sport: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Title
              <input
                type="text"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
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
                value={form.year}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Manufacturer
              <input
                type="text"
                required
                value={form.manufacturer}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    manufacturer: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Card number
              <input
                type="text"
                value={form.cardNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cardNumber: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Series
              <input
                type="text"
                value={form.series}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    series: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Serial number
              <input
                type="text"
                value={form.serialNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    serialNumber: event.target.value,
                  }))
                }
              />
            </label>

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
              Location
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="detailsCheckbox">
            <input
              type="checkbox"
              checked={form.rookie}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rookie: event.target.checked,
                }))
              }
            />
            Rookie card
          </label>

          <div className="addCardSection">
            <h3>Starting Valuation</h3>
            <div className="detailsGrid">
              <label>
                Raw value
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.goodConditionValue}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      goodConditionValue: event.target.value,
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
                  value={form.perfectConditionValue}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      perfectConditionValue: event.target.value,
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
                  value={form.valueConfidence}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      valueConfidence: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="modalError" role="alert">
              {error}
            </p>
          )}

          <div className="detailsActions">
            <button
              type="button"
              className="secondaryButton"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="primaryButton" disabled={saving}>
              {saving ? "Adding..." : "Add card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
