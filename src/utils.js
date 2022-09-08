import fonts from "./fonts.json";

export function interpolateColor(c0, c1, f) {
  c0 = c0.match(/.{1,2}/g).map((oct) => parseInt(oct, 16) * (1 - f));
  c1 = c1.match(/.{1,2}/g).map((oct) => parseInt(oct, 16) * f);
  let ci = [0, 1, 2].map((i) => Math.min(Math.round(c0[i] + c1[i]), 255));
  return ci
    .reduce((a, v) => (a << 8) + v, 0)
    .toString(16)
    .padStart(6, "0");
}

export function getPercentageBetweenMinMax(x, min, max) {
  return (x - min) / (max - min);
}

export function download(dataurl, filename) {
  const link = document.createElement("a");
  link.href = dataurl;
  link.download = filename;
  link.click();
}

const fontSet = new Set(fonts);

export async function listFonts() {
  await document.fonts.ready;

  const fontAvailable = new Set();

  for (const font of fontSet.values()) {
    if (document.fonts.check(`12px "${font}"`)) {
      fontAvailable.add(font);
    }
  }

  return [...fontAvailable.values()].sort();
}
