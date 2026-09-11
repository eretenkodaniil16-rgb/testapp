import type { QuestionImage } from "@/types/domain";

export function QuestionImageView({ image }: { image?: QuestionImage }) {
  if (!image) return null;

  const crop = image.crop;
  if (!crop) {
    return (
      <figure className="question-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} loading="lazy" />
      </figure>
    );
  }

  return (
    <figure className="question-figure">
      <svg
        viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
        role="img"
        aria-label={image.alt}
        preserveAspectRatio="xMidYMid meet"
      >
        <image
          href={image.src}
          x="0"
          y="0"
          width={crop.sheetWidth}
          height={crop.sheetHeight}
          preserveAspectRatio="none"
        />
      </svg>
      <figcaption>{image.alt}</figcaption>
    </figure>
  );
}
