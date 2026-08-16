import { PNG } from 'pngjs';

// Computes cheap, deterministic pixel statistics from a rendered screenshot so
// requirement checks can look at the actual picture, not just the source. All
// stats are sampled (every `step`-th pixel) to stay fast on large frames.
export const analyzeScreenshot = (pngBuffer, step = 4) => {
  const img = PNG.sync.read(pngBuffer);
  const { width, height, data } = img;

  const skyRowMax = Math.floor(height * 0.15); // top 15% ≈ sky band
  let skyR = 0, skyG = 0, skyB = 0, skyN = 0;
  let bright = 0, total = 0;
  let lumaSum = 0, lumaSqSum = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      total++;
      lumaSum += luma;
      lumaSqSum += luma * luma;
      if (luma > 230) bright++;
      if (y < skyRowMax) { skyR += r; skyG += g; skyB += b; skyN++; }
    }
  }

  const mean = lumaSum / total;
  const variance = Math.max(0, lumaSqSum / total - mean * mean);
  const sky = skyN ? [Math.round(skyR / skyN), Math.round(skyG / skyN), Math.round(skyB / skyN)] : [0, 0, 0];

  return {
    sky,
    // Warm sky: red clearly above blue with enough brightness (golden hour).
    warm: sky[0] > sky[2] + 12 && (sky[0] + sky[1] + sky[2]) / 3 > 55,
    brightFraction: +(bright / total).toFixed(5),
    lumaMean: +mean.toFixed(1),
    lumaStdDev: +Math.sqrt(variance).toFixed(1),
    sampled: total,
  };
};
