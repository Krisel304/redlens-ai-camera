import test from "node:test";
import assert from "node:assert/strict";
import { adjustPixels, analyzePixels, defaults } from "../src/image.js";
test("editing changes real pixel data and neutral settings preserve it", () => {
  const p = new Uint8ClampedArray([36, 31, 16, 255]);
  assert.deepEqual(adjustPixels(p.slice(), defaults), p);
  const out = adjustPixels(p.slice(), { ...defaults, brightness: 30 });
  assert.ok(out[0] > p[0]);
  assert.equal(out[3], 255);
});
test("analysis responds to dark, bright and cool inputs", () => {
  function solid(r, g, b) {
    return new Uint8ClampedArray(
      Array.from({ length: 64 }, () => [r, g, b, 255]).flat(),
    );
  }
  const dark = analyzePixels(solid(20, 20, 20), 8, 8),
    bright = analyzePixels(solid(235, 235, 235), 8, 8),
    cool = analyzePixels(solid(80, 100, 170), 8, 8);
  assert.ok(dark.issues.find((x) => x.adjust.brightness > 0));
  assert.ok(bright.issues.find((x) => x.adjust.brightness < 0));
  assert.ok(cool.issues.find((x) => x.adjust.warmth > 0));
  assert.notDeepEqual(dark.scores, bright.scores);
});
