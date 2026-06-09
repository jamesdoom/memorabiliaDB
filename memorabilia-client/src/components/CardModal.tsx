// memorabilia-client\src\components\CardModal.tsx

import { updateCard, updateCardStatus, uploadImage } from "../api";
import type { Card } from "../types/card";

type Props = {
  card: Card;
  setSelectedCard: (card: Card | null) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  isFlipped: boolean;
  setIsFlipped: (v: boolean | ((prev: boolean) => boolean)) => void;
  loadCards: () => void;
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
  return (
    <div className="modalOverlay" onClick={() => setSelectedCard(null)}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        {/* CLOSE */}
        <button className="modalClose" onClick={() => setSelectedCard(null)}>
          ✕
        </button>

        {/* IMAGE + ACTIONS */}
        <div className="modalTop">
          {/* IMAGE */}
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

          {/* ✅ CLEAN BUTTON ROW */}
          <div className="modalActionsRow">
            <button
              className="primaryButton"
              onClick={() => setIsFlipped((prev) => !prev)}
            >
              🔄 Flip
            </button>

            <label className="uploadButton cleanUpload">
              📸 Upload
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploading(true);

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
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>

            {card.status !== "NEW" && (
              <button
                className="secondaryButton"
                onClick={async () => {
                  await updateCardStatus(card.id, "NEW");
                  await loadCards();
                  setSelectedCard(null);
                }}
              >
                ↩ Undo
              </button>
            )}
          </div>

          {/* SPINNER */}
          {uploading && (
            <div className="uploadSpinnerContainer">
              <div className="uploadSpinner"></div>
            </div>
          )}
        </div>

        {/* INFO */}
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

          <p className="modalQuantity">
            <strong>Quantity:</strong> {card.quantity}
          </p>
        </div>
      </div>
    </div>
  );
}
