import { readFile } from "node:fs/promises";

const atlasPath = "public/content/images/general-surgery/rating2-atlas.webp";
const image = await readFile(atlasPath);
function assert(condition, message) {
  if (!condition) throw new Error(`[rating2-figures] ${message}`);
}
assert(image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP", "asset is not WEBP");
assert(image.byteLength > 10_000, "asset unexpectedly small");

const source = [
  ["blood-components-transfusion", 3, Array.from({ length: 9 }, (_, i) => i + 41)],
  ["hemorrhage-blood-loss", 2, [69, 70, 71, 72]],
];
let checked = 0;
for (const [topic, version, numbers] of source) {
  const file = `public/content/packages/general-surgery-${topic}.v${version}.json`;
  const pkg = JSON.parse(await readFile(file, "utf8"));
  for (const n of numbers) {
    const q = pkg.questions.find((item) => item.sourceQuestionNumber === n);
    assert(Boolean(q), `missing question ${topic}#${n}`);
    assert(q.image?.src?.endsWith("/rating2-atlas.webp"), `missing atlas link ${topic}#${n}`);
    const c = q.image.crop;
    assert(Boolean(c), `missing crop ${topic}#${n}`);
    const ix = n >= 69 ? n - 69 : n - 41 + 4;
    assert(
      c.sheetWidth === 840 && c.sheetHeight === 668 &&
      c.width === 210 && c.height === 167 &&
      c.x === (ix % 4) * 210 && c.y === Math.floor(ix / 4) * 167,
      `incorrect crop ${topic}#${n}`
    );
    checked += 1;
  }
}
assert(checked === 13, `expected 13 figures, got ${checked}`);
console.log(`[rating2-figures] OK: ${checked} source figures, ${image.byteLength} bytes`);
