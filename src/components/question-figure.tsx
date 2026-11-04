"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { QuestionImage } from "@/types/domain";

/**
 * Displays the original educational figure, optionally cropped from a shared
 * immutable image atlas. Cropping is presentation-only; source images are
 * never redrawn or interpreted to select an answer.
 */
export function QuestionFigure({ image }: { image?: QuestionImage }) {
  const [failed, setFailed] = useState(false);
  if (!image?.src) return null;

  if (failed) {
    return <p className="question-figure-unavailable" role="status">Иллюстрация пока недоступна.</p>;
  }

  const crop = image.crop;
  const validCrop = crop &&
    [crop.x, crop.y, crop.width, crop.height, crop.sheetWidth, crop.sheetHeight].every(Number.isFinite) &&
    crop.width > 0 && crop.height > 0 &&
    crop.x >= 0 && crop.y >= 0 &&
    crop.x + crop.width <= crop.sheetWidth &&
    crop.y + crop.height <= crop.sheetHeight;

  const imageStyle: CSSProperties | undefined = validCrop && crop ? {
    position: "absolute",
    width: `${(crop.sheetWidth / crop.width) * 100}%`,
    height: "auto",
    maxWidth: "none",
    left: `-${(crop.x / crop.width) * 100}%`,
    top: `-${(crop.y / crop.height) * 100}%`,
  } : undefined;

  return (
    <figure className="question-figure">
      <div className="question-figure-frame" style={validCrop && crop ? { aspectRatio: `${crop.width} / ${crop.height}` } : undefined}>
        {/* Native img supports the existing static GitHub image URLs without Next.js image optimisation. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="question-figure-image"
          style={imageStyle}
          onError={() => setFailed(true)}
        />
      </div>
      <figcaption>Иллюстрация из исходного учебного материала</figcaption>
    </figure>
  );
}
