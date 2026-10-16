export const defaults = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  rotation: 0,
  crop: "original",
};
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () =>
      reject(new Error("图片无法读取，请尝试 JPG、PNG 或 WebP 格式"));
    i.src = url;
  });
}
export function adjustPixels(data, o) {
  const b = o.brightness * 1.25,
    c = 1 + o.contrast / 100,
    s = 1 + o.saturation / 100,
    w = o.warmth * 0.45;
  for (let i = 0; i < data.length; i += 4) {
    let r = (data[i] - 128) * c + 128 + b + w,
      g = (data[i + 1] - 128) * c + 128 + b,
      bl = (data[i + 2] - 128) * c + 128 + b - w;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    data[i] = l + (r - l) * s;
    data[i + 1] = l + (g - l) * s;
    data[i + 2] = l + (bl - l) * s;
  }
  return data;
}
export async function renderImage(url, o = defaults, max = 1800) {
  const img = await loadImage(url),
    c = document.createElement("canvas");
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  let sw = img.width,
    sh = img.height;
  if (o.crop !== "original") {
    const ratio = o.crop === "square" ? 1 : 3 / 4;
    if (sw / sh > ratio) sw = sh * ratio;
    else sh = sw / ratio;
  }
  const rot = ((o.rotation % 360) + 360) % 360,
    swap = rot === 90 || rot === 270;
  c.width = Math.round((swap ? sh : sw) * scale);
  c.height = Math.round((swap ? sw : sh) * scale);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(
    img,
    (img.width - sw) / 2,
    (img.height - sh) / 2,
    sw,
    sh,
    (-sw * scale) / 2,
    (-sh * scale) / 2,
    sw * scale,
    sh * scale,
  );
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  adjustPixels(pixels.data, o);
  ctx.putImageData(pixels, 0, 0);
  return c;
}
export async function analyze(url) {
  const image = await loadImage(url),
    c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, 96, 96);
  return analyzePixels(ctx.getImageData(0, 0, 96, 96).data, 96, 96);
}
export function analyzePixels(p, w, h) {
  let sum = 0,
    sum2 = 0,
    sat = 0,
    red = 0,
    blue = 0,
    edge = 0,
    left = 0,
    right = 0;
  for (let i = 0; i < p.length; i += 4) {
    const l = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
    sum += l;
    sum2 += l * l;
    sat +=
      Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]);
    red += p[i];
    blue += p[i + 2];
    const x = (i / 4) % w;
    if (x < w / 2) left += l;
    else right += l;
    if (x > 0)
      edge += Math.abs(
        l - (0.2126 * p[i - 4] + 0.7152 * p[i - 3] + 0.0722 * p[i - 2]),
      );
  }
  const n = w * h,
    mean = sum / n,
    contrast = Math.sqrt(sum2 / n - mean * mean),
    saturation = sat / n,
    temperature = (blue - red) / n;
  const clamp = (x) => Math.round(Math.max(15, Math.min(96, x)));
  const scores = [
    { name: "明暗平衡", value: clamp(96 - Math.abs(mean - 135) * 0.55) },
    { name: "明暗层次", value: clamp(45 + contrast * 0.65) },
    { name: "色彩强度", value: clamp(92 - Math.abs(saturation - 48) * 0.65) },
    { name: "细节边缘", value: clamp(38 + (edge / n) * 5) },
    { name: "左右亮度", value: clamp(95 - Math.abs(left - right) / n) },
  ];
  const issues = [];
  if (mean < 112)
    issues.push({
      id: "exposure",
      title: "画面偏暗，提亮中间调",
      detail: "平均亮度偏低，适度提亮可以让暗部更易辨认。",
      adjust: { brightness: 22 },
    });
  if (mean > 165)
    issues.push({
      id: "exposure",
      title: "高光偏亮，适度降低曝光",
      detail: "画面平均亮度较高，降低曝光可缓和亮部。",
      adjust: { brightness: -16 },
    });
  if (saturation > 55)
    issues.push({
      id: "color",
      title: "收敛色彩，让画面更自然",
      detail: "像素通道差异较大，可适度降低饱和度。",
      adjust: { saturation: -18 },
    });
  if (saturation < 25)
    issues.push({
      id: "color",
      title: "适度增加色彩表现",
      detail: "整体色彩较弱，可以少量提高饱和度。",
      adjust: { saturation: 15 },
    });
  if (temperature > 7)
    issues.push({
      id: "warmth",
      title: "补一点暖意，平衡冷色",
      detail: "蓝色通道整体强于红色，少量暖调可改变氛围。",
      adjust: { warmth: 16 },
    });
  if (contrast < 42)
    issues.push({
      id: "contrast",
      title: "增加明暗层次",
      detail: "亮度分布较集中，可适当提高对比度。",
      adjust: { contrast: 14 },
    });
  return {
    scores,
    total: Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length),
    issues,
    mean,
    saturation,
    temperature,
    highlight:
      contrast > 45
        ? "画面有丰富的明暗层次，适合保留自然光影。"
        : "画面影调柔和，适合细腻、自然的表达。",
  };
}
