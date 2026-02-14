let cnv;
let shapes = [];
let currentSeed = null;

// Global configuration (foundational/default project settings)
const BACKGROUND_COLOR = "#031f60";
const PALETTE = ["#072d75", "#083c8a", "#0158ad", "#3598f8"];
const CORNER_SHAPE_PATH_D =
  "M360 360V224C360 100.5 259.5 0 136 0H0v160h136c35.3 0 64 28.7 64 64v136h160Z";
const CORNER_SHAPE = {
  path: new Path2D(CORNER_SHAPE_PATH_D),
  viewBoxSize: 360,
};
const STROKE_WIDTH_RATIOS = [0.0037, 0.0148];
const EXPORT_SIZE = {
  width: 8000,
  height: 4500,
};
const DEFAULT_SEED = 991712126;

// UI control configuration (defaults + bounds)
const UI_CENTRE_PERCENT_DEFAULT = 50;
const UI_BLEND_PERCENT_DEFAULT = 0;
const UI_DENSITY_MAX = 50;
const UI_AMOUNT_PERCENT_DEFAULT = 0;
const UI_EDGE_PERCENT_DEFAULT = 50;
const UI_FLIP_X_PERCENT_DEFAULT = 0;
const UI_FLIP_Y_PERCENT_DEFAULT = 0;
const UI_LIGHT_PERCENT_DEFAULT = 50;
const UI_OPACITY_PERCENT_DEFAULT = 75;
const UI_OUTLINE_PERCENT_DEFAULT = 0;
const UI_WEIGHT_PERCENT_DEFAULT = 50;
const UI_SIZE_PERCENT_DEFAULT = 75;
const UI_SPREAD_PERCENT_DEFAULT = 50;

// Internal tuning constants (engine behavior / performance guards)
const ENABLE_SAME_COLOR_OVERLAP_CHECK = true;
const MAX_GENERATION_ATTEMPTS = 9000;
const MIN_STROKE_WIDTH = 1;
const MIN_THICK_STROKE_WIDTH = 2;

// Default values for runtime UI controls
const runtimeConfig = {
  amountPercent: UI_AMOUNT_PERCENT_DEFAULT,
  centrePercent: UI_CENTRE_PERCENT_DEFAULT,
  blendPercent: UI_BLEND_PERCENT_DEFAULT,
  edgePercent: UI_EDGE_PERCENT_DEFAULT,
  lightPercent: UI_LIGHT_PERCENT_DEFAULT,
  strokeOnlyProbability: UI_OUTLINE_PERCENT_DEFAULT / 100,
  weightProbability: UI_WEIGHT_PERCENT_DEFAULT / 100,
  flipXProbability: UI_FLIP_X_PERCENT_DEFAULT / 100,
  flipYProbability: UI_FLIP_Y_PERCENT_DEFAULT / 100,
  overlapAlpha: UI_OPACITY_PERCENT_DEFAULT / 100,
  sizePercent: UI_SIZE_PERCENT_DEFAULT,
  spreadPercent: UI_SPREAD_PERCENT_DEFAULT,
};
const URL_PARAMS = {
  seed: "s",
  amountPct: "am",
  centrePct: "ct",
  edgePct: "ed",
  flipXPct: "fx",
  flipYPct: "fy",
  sizePct: "sz",
  spreadPct: "sp",
  blendPct: "bl",
  lightPct: "lg",
  opacityPct: "op",
  outlinePct: "ot",
  weightPct: "wg",
};

function shapesOverlap(a, b) {
  // Approximate overlap using circular bounds based on nominal size.
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  const minDistance = (a.size + b.size) * 0.5;
  return distance < minDistance;
}

function rgbaFromHex(hex, alpha) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawCompositionToContext(
  ctx,
  renderWidth,
  renderHeight,
  positionScale = 1,
  sizeScale = 1,
  offsetX = 0,
  offsetY = 0,
) {
  ctx.save();
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, renderWidth, renderHeight);

  shapes.forEach((s, index) => {
    const hasLowerOverlap = shapes
      .slice(0, index)
      .some(
        (lowerShape) =>
          lowerShape.styleMode !== "stroke" && shapesOverlap(s, lowerShape),
      );
    const alpha = hasLowerOverlap ? runtimeConfig.overlapAlpha : 1;
    const drawX = offsetX + s.x * positionScale;
    const drawY = offsetY + s.y * positionScale;
    const drawSize = s.size * sizeScale;

    const scale = drawSize / CORNER_SHAPE.viewBoxSize;
    const viewBoxHalf = CORNER_SHAPE.viewBoxSize * 0.5;
    const signX = s.flipX ? -1 : 1;
    const signY = s.flipY ? -1 : 1;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(scale * signX, scale * signY);
    ctx.translate(-viewBoxHalf, -viewBoxHalf);

    if (s.styleMode === "stroke") {
      const ratio = s.strokeWidthRatio ?? STROKE_WIDTH_RATIOS[0];
      const minStrokeWidth =
        ratio === STROKE_WIDTH_RATIOS[1]
          ? MIN_THICK_STROKE_WIDTH
          : MIN_STROKE_WIDTH;
      const strokeWidth = Math.max(
        minStrokeWidth * sizeScale,
        drawSize * ratio,
      );
      ctx.strokeStyle = rgbaFromHex(s.color, alpha);
      ctx.lineWidth = strokeWidth / scale;
      ctx.stroke(CORNER_SHAPE.path);
    } else {
      ctx.fillStyle = rgbaFromHex(s.color, alpha);
      ctx.fill(CORNER_SHAPE.path);
    }
    ctx.restore();
  });

  ctx.restore();
}

function exportCurrentComposition(filename) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = EXPORT_SIZE.width;
  exportCanvas.height = EXPORT_SIZE.height;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  const scaleX = EXPORT_SIZE.width / width;
  const scaleY = EXPORT_SIZE.height / height;
  const uniformScale = Math.min(scaleX, scaleY);
  const offsetX = (EXPORT_SIZE.width - width * uniformScale) * 0.5;
  const offsetY = (EXPORT_SIZE.height - height * uniformScale) * 0.5;

  drawCompositionToContext(
    exportCtx,
    EXPORT_SIZE.width,
    EXPORT_SIZE.height,
    uniformScale,
    uniformScale,
    offsetX,
    offsetY,
  );

  exportCanvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(`${filename}.png`, blob);
  }, "image/png");
}

function downloadBlob(filenameWithExtension, blob) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filenameWithExtension;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

function buildSvgExportMarkup(renderWidth, renderHeight) {
  const svgParts = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${renderWidth}" height="${renderHeight}" viewBox="0 0 ${renderWidth} ${renderHeight}">`,
  );
  svgParts.push(
    `<rect width="${renderWidth}" height="${renderHeight}" fill="${BACKGROUND_COLOR}" />`,
  );

  shapes.forEach((shape, index) => {
    const hasLowerOverlap = shapes
      .slice(0, index)
      .some(
        (lowerShape) =>
          lowerShape.styleMode !== "stroke" && shapesOverlap(shape, lowerShape),
      );
    const alpha = hasLowerOverlap ? runtimeConfig.overlapAlpha : 1;

    const scale = shape.size / CORNER_SHAPE.viewBoxSize;
    const viewBoxHalf = CORNER_SHAPE.viewBoxSize * 0.5;
    const signX = shape.flipX ? -1 : 1;
    const signY = shape.flipY ? -1 : 1;
    const transform = `translate(${shape.x} ${shape.y}) scale(${scale * signX} ${scale * signY}) translate(${-viewBoxHalf} ${-viewBoxHalf})`;

    if (shape.styleMode === "stroke") {
      const ratio = shape.strokeWidthRatio ?? STROKE_WIDTH_RATIOS[0];
      const minStrokeWidth =
        ratio === STROKE_WIDTH_RATIOS[1]
          ? MIN_THICK_STROKE_WIDTH
          : MIN_STROKE_WIDTH;
      const strokeWidth = Math.max(minStrokeWidth, shape.size * ratio);
      const localStrokeWidth = strokeWidth / scale;
      svgParts.push(
        `<path d="${CORNER_SHAPE_PATH_D}" fill="none" stroke="${rgbaFromHex(shape.color, alpha)}" stroke-width="${localStrokeWidth}" transform="${transform}" />`,
      );
      return;
    }

    svgParts.push(
      `<path d="${CORNER_SHAPE_PATH_D}" fill="${rgbaFromHex(shape.color, alpha)}" transform="${transform}" />`,
    );
  });

  svgParts.push("</svg>");
  return svgParts.join("");
}

function exportCurrentCompositionSvg(filename) {
  const svgMarkup = buildSvgExportMarkup(width, height);
  const blob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  downloadBlob(`${filename}.svg`, blob);
}

function buildExportFilename(seed) {
  const safeSeed = Number.isFinite(seed) ? Math.floor(seed) : "random";
  const centrePct = Math.round(runtimeConfig.centrePercent);
  const amountPct = Math.round(runtimeConfig.amountPercent);
  const blendPct = Math.round(runtimeConfig.blendPercent);
  const edgePct = Math.round(runtimeConfig.edgePercent);
  const flipXPct = Math.round(runtimeConfig.flipXProbability * 100);
  const flipYPct = Math.round(runtimeConfig.flipYProbability * 100);
  const lightPct = Math.round(runtimeConfig.lightPercent);
  const opacityPct = Math.round(runtimeConfig.overlapAlpha * 100);
  const outlinePct = Math.round(runtimeConfig.strokeOnlyProbability * 100);
  const weightPct = Math.round(runtimeConfig.weightProbability * 100);
  const sizePct = Math.round(runtimeConfig.sizePercent);
  const spreadPct = Math.round(runtimeConfig.spreadPercent);

  return [
    `facet-s${safeSeed}`,
    `${URL_PARAMS.amountPct}${amountPct}`,
    `${URL_PARAMS.centrePct}${centrePct}`,
    `${URL_PARAMS.edgePct}${edgePct}`,
    `${URL_PARAMS.flipXPct}${flipXPct}`,
    `${URL_PARAMS.flipYPct}${flipYPct}`,
    `${URL_PARAMS.sizePct}${sizePct}`,
    `${URL_PARAMS.spreadPct}${spreadPct}`,
    `${URL_PARAMS.blendPct}${blendPct}`,
    `${URL_PARAMS.lightPct}${lightPct}`,
    `${URL_PARAMS.opacityPct}${opacityPct}`,
    `${URL_PARAMS.outlinePct}${outlinePct}`,
    `${URL_PARAMS.weightPct}${weightPct}`,
  ].join("-");
}

function parseSeed(value) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return null;
  return Math.floor(parsed);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSizeControlFromPercent(sizePercent) {
  const clampedPercent = clamp(sizePercent, 0, 100);
  if (clampedPercent <= 75) {
    const t = clampedPercent / 75;
    return lerp(0.1, 1.0, t);
  }
  const t = (clampedPercent - 75) / 25;
  return lerp(1.0, 2.0, t);
}

function getSpreadFromPercent(spreadPercent) {
  const t = clamp(spreadPercent, 0, 100) / 100;
  return lerp(0, 1, t);
}

function getSizeRatioRange(sizePercent, spreadPercent) {
  const spread = getSpreadFromPercent(spreadPercent);
  const minRatio = 0.1;
  const maxRatio = 2.0;
  const sizeControl = getSizeControlFromPercent(sizePercent);
  return {
    min: clamp(sizeControl - spread, minRatio, maxRatio),
    max: clamp(sizeControl + spread, minRatio, maxRatio),
  };
}

function getShapeCountFromPercent(amountPercent) {
  const p = clamp(amountPercent, 0, 100) / 100;
  return Math.round(1 + p * (UI_DENSITY_MAX - 1));
}

function getCenterPlacementBias(centrePercent) {
  const t = clamp(centrePercent, 0, 100) / 100;
  return lerp(0.1, 0.56, t);
}

function getEdgeOverflowFactors(edgePercent) {
  const t = clamp(edgePercent, 0, 100) / 100;
  return {
    negative: lerp(0.1, 1.1, t),
    positive: lerp(0, 0.4, t),
  };
}

function getPaletteWeights(lightPercent) {
  const t = clamp(lightPercent, 0, 100) / 100;
  const count = PALETTE.length;
  const uniformWeight = 1 / count;
  const earlyWeights = PALETTE.map((_, index) => 1 / (index + 1));
  const earlyTotal = earlyWeights.reduce((sum, value) => sum + value, 0);
  const lateWeights = PALETTE.map((_, index) => index + 1);
  const lateTotal = lateWeights.reduce((sum, value) => sum + value, 0);

  if (t <= 0.5) {
    const phase = t / 0.5;
    return earlyWeights.map((value) => {
      const earlyBiasedWeight = value / earlyTotal;
      return lerp(earlyBiasedWeight, uniformWeight, phase);
    });
  }

  const phase = (t - 0.5) / 0.5;
  return lateWeights.map((value) => {
    const lateBiasedWeight = value / lateTotal;
    return lerp(uniformWeight, lateBiasedWeight, phase);
  });
}

function pickPaletteColor(weights) {
  const threshold = random();
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += weights[i];
    if (threshold <= sum) return PALETTE[i];
  }
  return PALETTE[PALETTE.length - 1];
}

function shouldDisableOpacityControl() {
  return (
    runtimeConfig.strokeOnlyProbability >= 1 || runtimeConfig.amountPercent <= 0
  );
}

function shouldDisableBlendControl() {
  return runtimeConfig.amountPercent <= 0;
}

function updateRuntimeControlDisplay() {
  const centreValue = document.getElementById("centreValue");
  const blendValue = document.getElementById("blendValue");
  const lightValue = document.getElementById("lightValue");
  const amountValue = document.getElementById("amountValue");
  const edgeValue = document.getElementById("edgeValue");
  const flipXValue = document.getElementById("flipXValue");
  const flipYValue = document.getElementById("flipYValue");
  const outlineValue = document.getElementById("outlineValue");
  const opacityValue = document.getElementById("opacityValue");
  const sizeValue = document.getElementById("sizeValue");
  const weightValue = document.getElementById("weightValue");
  const spreadValue = document.getElementById("spreadValue");

  if (centreValue) {
    centreValue.textContent = String(Math.round(runtimeConfig.centrePercent));
  }
  if (blendValue) {
    blendValue.textContent = String(Math.round(runtimeConfig.blendPercent));
  }
  if (lightValue) {
    lightValue.textContent = String(Math.round(runtimeConfig.lightPercent));
  }
  if (amountValue) {
    amountValue.textContent = String(Math.round(runtimeConfig.amountPercent));
  }
  if (edgeValue) {
    edgeValue.textContent = String(Math.round(runtimeConfig.edgePercent));
  }
  if (outlineValue) {
    outlineValue.textContent = String(
      Math.round(runtimeConfig.strokeOnlyProbability * 100),
    );
  }
  if (flipXValue) {
    flipXValue.textContent = String(
      Math.round(runtimeConfig.flipXProbability * 100),
    );
  }
  if (flipYValue) {
    flipYValue.textContent = String(
      Math.round(runtimeConfig.flipYProbability * 100),
    );
  }
  if (opacityValue) {
    opacityValue.textContent = String(
      Math.round(runtimeConfig.overlapAlpha * 100),
    );
  }
  if (sizeValue) {
    sizeValue.textContent = String(Math.round(runtimeConfig.sizePercent));
  }
  if (weightValue) {
    weightValue.textContent = String(
      Math.round(runtimeConfig.weightProbability * 100),
    );
  }
  if (spreadValue) {
    spreadValue.textContent = String(Math.round(runtimeConfig.spreadPercent));
  }
}

function syncRuntimeControlsToInputs() {
  const centreInput = document.getElementById("centreInput");
  const blendInput = document.getElementById("blendInput");
  const lightInput = document.getElementById("lightInput");
  const amountInput = document.getElementById("amountInput");
  const edgeInput = document.getElementById("edgeInput");
  const flipXInput = document.getElementById("flipXInput");
  const flipYInput = document.getElementById("flipYInput");
  const outlineInput = document.getElementById("outlineInput");
  const opacityInput = document.getElementById("opacityInput");
  const sizeInput = document.getElementById("sizeInput");
  const weightInput = document.getElementById("weightInput");
  const spreadInput = document.getElementById("spreadInput");

  if (centreInput) {
    centreInput.value = String(Math.round(runtimeConfig.centrePercent));
  }
  if (blendInput) {
    blendInput.value = String(Math.round(runtimeConfig.blendPercent));
  }
  if (lightInput) {
    lightInput.value = String(Math.round(runtimeConfig.lightPercent));
  }
  if (amountInput) {
    amountInput.value = String(Math.round(runtimeConfig.amountPercent));
  }
  if (edgeInput) {
    edgeInput.value = String(Math.round(runtimeConfig.edgePercent));
  }
  if (outlineInput) {
    outlineInput.value = String(
      Math.round(runtimeConfig.strokeOnlyProbability * 100),
    );
  }
  if (flipXInput) {
    flipXInput.value = String(Math.round(runtimeConfig.flipXProbability * 100));
  }
  if (flipYInput) {
    flipYInput.value = String(Math.round(runtimeConfig.flipYProbability * 100));
  }
  if (opacityInput) {
    opacityInput.value = String(Math.round(runtimeConfig.overlapAlpha * 100));
    opacityInput.disabled = shouldDisableOpacityControl();
  }
  if (blendInput) {
    blendInput.disabled = shouldDisableBlendControl();
  }
  if (sizeInput) {
    sizeInput.value = String(runtimeConfig.sizePercent);
  }
  if (weightInput) {
    weightInput.value = String(
      Math.round(runtimeConfig.weightProbability * 100),
    );
    weightInput.disabled = runtimeConfig.strokeOnlyProbability <= 0;
  }
  if (spreadInput) {
    spreadInput.value = String(runtimeConfig.spreadPercent);
  }
}

function bindRuntimeControls() {
  const centreInput = document.getElementById("centreInput");
  const blendInput = document.getElementById("blendInput");
  const lightInput = document.getElementById("lightInput");
  const amountInput = document.getElementById("amountInput");
  const edgeInput = document.getElementById("edgeInput");
  const flipXInput = document.getElementById("flipXInput");
  const flipYInput = document.getElementById("flipYInput");
  const outlineInput = document.getElementById("outlineInput");
  const opacityInput = document.getElementById("opacityInput");
  const sizeInput = document.getElementById("sizeInput");
  const weightInput = document.getElementById("weightInput");
  const spreadInput = document.getElementById("spreadInput");
  const resetBtn = document.getElementById("resetBtn");
  const randomBtn = document.getElementById("randomBtn");

  if (
    !centreInput ||
    !blendInput ||
    !lightInput ||
    !amountInput ||
    !edgeInput ||
    !flipXInput ||
    !flipYInput ||
    !outlineInput ||
    !opacityInput ||
    !sizeInput ||
    !weightInput ||
    !spreadInput ||
    !resetBtn ||
    !randomBtn
  ) {
    return;
  }

  syncRuntimeControlsToInputs();
  updateRuntimeControlDisplay();

  centreInput.addEventListener("input", () => {
    const nextValue = Number(centreInput.value);
    runtimeConfig.centrePercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  blendInput.addEventListener("input", () => {
    const nextValue = Number(blendInput.value);
    runtimeConfig.blendPercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  lightInput.addEventListener("input", () => {
    const nextValue = Number(lightInput.value);
    runtimeConfig.lightPercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  amountInput.addEventListener("input", () => {
    const nextValue = Number(amountInput.value);
    runtimeConfig.amountPercent = clamp(nextValue, 0, 100);
    opacityInput.disabled = shouldDisableOpacityControl();
    blendInput.disabled = shouldDisableBlendControl();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  edgeInput.addEventListener("input", () => {
    const nextValue = Number(edgeInput.value);
    runtimeConfig.edgePercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  outlineInput.addEventListener("input", () => {
    const nextValue = Number(outlineInput.value) / 100;
    runtimeConfig.strokeOnlyProbability = clamp(nextValue, 0, 1);
    weightInput.disabled = runtimeConfig.strokeOnlyProbability <= 0;
    opacityInput.disabled = shouldDisableOpacityControl();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  flipXInput.addEventListener("input", () => {
    const nextValue = Number(flipXInput.value) / 100;
    runtimeConfig.flipXProbability = clamp(nextValue, 0, 1);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  flipYInput.addEventListener("input", () => {
    const nextValue = Number(flipYInput.value) / 100;
    runtimeConfig.flipYProbability = clamp(nextValue, 0, 1);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  opacityInput.addEventListener("input", () => {
    const nextValue = Number(opacityInput.value) / 100;
    runtimeConfig.overlapAlpha = clamp(nextValue, 0, 1);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  sizeInput.addEventListener("input", () => {
    const nextValue = Number(sizeInput.value);
    runtimeConfig.sizePercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  weightInput.addEventListener("input", () => {
    const nextValue = Number(weightInput.value) / 100;
    runtimeConfig.weightProbability = clamp(nextValue, 0, 1);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  spreadInput.addEventListener("input", () => {
    const nextValue = Number(spreadInput.value);
    runtimeConfig.spreadPercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  resetBtn.addEventListener("click", () => {
    runtimeConfig.centrePercent = UI_CENTRE_PERCENT_DEFAULT;
    runtimeConfig.blendPercent = UI_BLEND_PERCENT_DEFAULT;
    runtimeConfig.amountPercent = UI_AMOUNT_PERCENT_DEFAULT;
    runtimeConfig.edgePercent = UI_EDGE_PERCENT_DEFAULT;
    runtimeConfig.lightPercent = UI_LIGHT_PERCENT_DEFAULT;
    runtimeConfig.strokeOnlyProbability = UI_OUTLINE_PERCENT_DEFAULT / 100;
    runtimeConfig.flipXProbability = UI_FLIP_X_PERCENT_DEFAULT / 100;
    runtimeConfig.flipYProbability = UI_FLIP_Y_PERCENT_DEFAULT / 100;
    runtimeConfig.overlapAlpha = UI_OPACITY_PERCENT_DEFAULT / 100;
    runtimeConfig.weightProbability = UI_WEIGHT_PERCENT_DEFAULT / 100;
    runtimeConfig.sizePercent = UI_SIZE_PERCENT_DEFAULT;
    runtimeConfig.spreadPercent = UI_SPREAD_PERCENT_DEFAULT;
    syncRuntimeControlsToInputs();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  randomBtn.addEventListener("click", () => {
    runtimeConfig.centrePercent = Math.round(Math.random() * 100);
    runtimeConfig.blendPercent = Math.round(Math.random() * 100);
    runtimeConfig.amountPercent = Math.round(Math.random() * 100);
    runtimeConfig.edgePercent = Math.round(Math.random() * 100);
    runtimeConfig.lightPercent = Math.round(Math.random() * 100);
    runtimeConfig.flipXProbability = Math.random();
    runtimeConfig.flipYProbability = Math.random();
    runtimeConfig.overlapAlpha = Math.random();
    runtimeConfig.strokeOnlyProbability = Math.random();
    runtimeConfig.weightProbability = Math.random();
    runtimeConfig.sizePercent = Math.round(Math.random() * 100);
    runtimeConfig.spreadPercent = Math.round(Math.random() * 100);
    syncRuntimeControlsToInputs();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });
}

function readSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return parseSeed(params.get(URL_PARAMS.seed));
}

function readRuntimeConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const centrePctRaw = params.get(URL_PARAMS.centrePct);
  if (centrePctRaw !== null) {
    const centrePct = Number(centrePctRaw);
    if (Number.isFinite(centrePct) && !Number.isNaN(centrePct)) {
      runtimeConfig.centrePercent = clamp(centrePct, 0, 100);
    }
  }

  const amountPctRaw = params.get(URL_PARAMS.amountPct);
  if (amountPctRaw !== null) {
    const amountPct = Number(amountPctRaw);
    if (Number.isFinite(amountPct) && !Number.isNaN(amountPct)) {
      runtimeConfig.amountPercent = clamp(amountPct, 0, 100);
    }
  }

  const edgePctRaw = params.get(URL_PARAMS.edgePct);
  if (edgePctRaw !== null) {
    const edgePct = Number(edgePctRaw);
    if (Number.isFinite(edgePct) && !Number.isNaN(edgePct)) {
      runtimeConfig.edgePercent = clamp(edgePct, 0, 100);
    }
  }

  const strokePctRaw = params.get(URL_PARAMS.outlinePct);
  if (strokePctRaw !== null) {
    const strokePct = Number(strokePctRaw);
    if (Number.isFinite(strokePct) && !Number.isNaN(strokePct)) {
      runtimeConfig.strokeOnlyProbability = clamp(strokePct / 100, 0, 1);
    }
  }

  const weightPctRaw = params.get(URL_PARAMS.weightPct);
  if (weightPctRaw !== null) {
    const weightPct = Number(weightPctRaw);
    if (Number.isFinite(weightPct) && !Number.isNaN(weightPct)) {
      runtimeConfig.weightProbability = clamp(weightPct / 100, 0, 1);
    }
  }

  const flipXPctRaw = params.get(URL_PARAMS.flipXPct);
  if (flipXPctRaw !== null) {
    const flipXPct = Number(flipXPctRaw);
    if (Number.isFinite(flipXPct) && !Number.isNaN(flipXPct)) {
      runtimeConfig.flipXProbability = clamp(flipXPct / 100, 0, 1);
    }
  }

  const flipYPctRaw = params.get(URL_PARAMS.flipYPct);
  if (flipYPctRaw !== null) {
    const flipYPct = Number(flipYPctRaw);
    if (Number.isFinite(flipYPct) && !Number.isNaN(flipYPct)) {
      runtimeConfig.flipYProbability = clamp(flipYPct / 100, 0, 1);
    }
  }

  const sizePctRaw = params.get(URL_PARAMS.sizePct);
  if (sizePctRaw !== null) {
    const sizePercent = Number(sizePctRaw);
    if (Number.isFinite(sizePercent) && !Number.isNaN(sizePercent)) {
      runtimeConfig.sizePercent = clamp(sizePercent, 0, 100);
    }
  }

  const spreadPctRaw = params.get(URL_PARAMS.spreadPct);
  if (spreadPctRaw !== null) {
    const spreadPercent = Number(spreadPctRaw);
    if (Number.isFinite(spreadPercent) && !Number.isNaN(spreadPercent)) {
      runtimeConfig.spreadPercent = clamp(spreadPercent, 0, 100);
    }
  }

  const overlapPctRaw = params.get(URL_PARAMS.opacityPct);
  if (overlapPctRaw !== null) {
    const overlapPct = Number(overlapPctRaw);
    if (Number.isFinite(overlapPct) && !Number.isNaN(overlapPct)) {
      runtimeConfig.overlapAlpha = clamp(overlapPct / 100, 0, 1);
    }
  }

  const blendPctRaw = params.get(URL_PARAMS.blendPct);
  if (blendPctRaw !== null) {
    const blendPct = Number(blendPctRaw);
    if (Number.isFinite(blendPct) && !Number.isNaN(blendPct)) {
      runtimeConfig.blendPercent = clamp(blendPct, 0, 100);
    }
  }

  const lightPctRaw = params.get(URL_PARAMS.lightPct);
  if (lightPctRaw !== null) {
    const lightPct = Number(lightPctRaw);
    if (Number.isFinite(lightPct) && !Number.isNaN(lightPct)) {
      runtimeConfig.lightPercent = clamp(lightPct, 0, 100);
    }
  }
}

function writeUrlState(seed) {
  const url = new URL(window.location.href);
  const orderedParams = new URLSearchParams();

  if (Number.isFinite(seed)) {
    orderedParams.set(URL_PARAMS.seed, String(Math.floor(seed)));
  }

  // Keep URL ordering aligned to UI control order.
  orderedParams.set(
    URL_PARAMS.amountPct,
    String(Math.round(runtimeConfig.amountPercent)),
  );
  orderedParams.set(
    URL_PARAMS.centrePct,
    String(Math.round(runtimeConfig.centrePercent)),
  );
  orderedParams.set(
    URL_PARAMS.edgePct,
    String(Math.round(runtimeConfig.edgePercent)),
  );
  orderedParams.set(
    URL_PARAMS.flipXPct,
    String(Math.round(runtimeConfig.flipXProbability * 100)),
  );
  orderedParams.set(
    URL_PARAMS.flipYPct,
    String(Math.round(runtimeConfig.flipYProbability * 100)),
  );
  orderedParams.set(
    URL_PARAMS.sizePct,
    String(Math.round(runtimeConfig.sizePercent)),
  );
  orderedParams.set(
    URL_PARAMS.spreadPct,
    String(Math.round(runtimeConfig.spreadPercent)),
  );
  orderedParams.set(
    URL_PARAMS.blendPct,
    String(Math.round(runtimeConfig.blendPercent)),
  );
  orderedParams.set(
    URL_PARAMS.lightPct,
    String(Math.round(runtimeConfig.lightPercent)),
  );
  orderedParams.set(
    URL_PARAMS.opacityPct,
    String(Math.round(runtimeConfig.overlapAlpha * 100)),
  );
  orderedParams.set(
    URL_PARAMS.outlinePct,
    String(Math.round(runtimeConfig.strokeOnlyProbability * 100)),
  );
  orderedParams.set(
    URL_PARAMS.weightPct,
    String(Math.round(runtimeConfig.weightProbability * 100)),
  );

  url.search = orderedParams.toString();
  window.history.replaceState(null, "", url);
}

function setup() {
  const container = document.getElementById("sketchContainer");
  cnv = createCanvas(800, 450);
  cnv.parent(container);
  noLoop();

  // wire controls
  const genBtn = document.getElementById("generateBtn");
  const downloadPngBtn = document.getElementById("downloadPngBtn");
  const downloadSvgBtn = document.getElementById("downloadSvgBtn");
  readRuntimeConfigFromUrl();
  bindRuntimeControls();

  genBtn.addEventListener("click", () => {
    const seed = Math.floor(Math.random() * 1e9);
    writeUrlState(seed);
    generateFromSeed(seed);
  });

  if (downloadPngBtn) {
    downloadPngBtn.addEventListener("click", () => {
      const filename = buildExportFilename(currentSeed);
      exportCurrentComposition(filename);
    });
  }

  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener("click", () => {
      const filename = buildExportFilename(currentSeed);
      exportCurrentCompositionSvg(filename);
    });
  }

  // initial generate
  const initialSeed = readSeedFromUrl() ?? DEFAULT_SEED;
  writeUrlState(initialSeed);
  generateFromSeed(initialSeed);
}

function draw() {
  drawCompositionToContext(drawingContext, width, height);
}

function overlapsSameColor(candidate, existingShapes) {
  return existingShapes.some((shape) => {
    if (shape.color !== candidate.color) return false;
    return shapesOverlap(shape, candidate);
  });
}

function applyLayeringOrder(shapeList) {
  const filled = shapeList.filter((shape) => shape.styleMode !== "stroke");
  const stroked = shapeList.filter((shape) => shape.styleMode === "stroke");
  return [...filled, ...stroked];
}

function shuffleInPlace(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
}

function assignStrokeWidthRatios(shapeList, thickProbability) {
  const strokeShapes = shapeList.filter(
    (shape) => shape.styleMode === "stroke",
  );
  if (strokeShapes.length === 0) return;

  const p = clamp(thickProbability, 0, 1);
  const thickCount = Math.round(strokeShapes.length * p);
  const shuffled = strokeShapes.slice();
  shuffleInPlace(shuffled);

  shuffled.forEach((shape, index) => {
    shape.strokeWidthRatio =
      index < thickCount ? STROKE_WIDTH_RATIOS[1] : STROKE_WIDTH_RATIOS[0];
  });
}

function validateCandidateConstraints(candidate, currentShapes) {
  if (
    ENABLE_SAME_COLOR_OVERLAP_CHECK &&
    overlapsSameColor(candidate, currentShapes)
  ) {
    const blend = clamp(runtimeConfig.blendPercent, 0, 100) / 100;
    const rejectionStrictness = 1 - blend;
    if (rejectionStrictness >= 1) return false;
    if (rejectionStrictness <= 0) return true;
    return random() >= rejectionStrictness;
  }
  return true;
}

function generateFromSeed(seed) {
  currentSeed = seed;
  randomSeed(seed);
  noiseSeed(seed);

  shapes = [];
  const { min: minSizeRatio, max: maxSizeRatio } = getSizeRatioRange(
    runtimeConfig.sizePercent,
    runtimeConfig.spreadPercent,
  );
  const centerPlacementBias = getCenterPlacementBias(
    runtimeConfig.centrePercent,
  );
  const edgeOverflow = getEdgeOverflowFactors(runtimeConfig.edgePercent);
  const paletteWeights = getPaletteWeights(runtimeConfig.lightPercent);
  const minSize = Math.min(width, height) * minSizeRatio;
  const maxSize = Math.min(width, height) * maxSizeRatio;

  let guard = 0;
  while (
    guard < MAX_GENERATION_ATTEMPTS &&
    shapes.length < getShapeCountFromPercent(runtimeConfig.amountPercent)
  ) {
    guard += 1;
    const color = pickPaletteColor(paletteWeights);
    const styleMode =
      random() < runtimeConfig.strokeOnlyProbability ? "stroke" : "fill";
    const size = lerp(minSize, maxSize, Math.pow(random(), 0.35));
    const uniformX = random(
      -size * edgeOverflow.negative,
      width + size * edgeOverflow.positive,
    );
    const uniformY = random(
      -size * edgeOverflow.negative,
      height + size * edgeOverflow.positive,
    );
    const centeredX = randomGaussian(width * 0.5, width * 0.2);
    const centeredY = randomGaussian(height * 0.5, height * 0.2);
    const x = lerp(uniformX, centeredX, centerPlacementBias);
    const y = lerp(uniformY, centeredY, centerPlacementBias);
    const flipX = random() < runtimeConfig.flipXProbability;
    const flipY = random() < runtimeConfig.flipYProbability;

    const candidate = {
      type: "svg",
      x,
      y,
      size,
      color,
      styleMode,
      strokeWidthRatio: null,
      flipX,
      flipY,
    };
    if (validateCandidateConstraints(candidate, shapes)) {
      shapes.push(candidate);
    }
  }

  assignStrokeWidthRatios(shapes, runtimeConfig.weightProbability);
  shapes = applyLayeringOrder(shapes);
  redraw();
}

function windowResized() {
  const container = document.getElementById("sketchContainer");
  const w = container.clientWidth || 800;
  resizeCanvas(w, Math.round(w * (9 / 16)));
  if (currentSeed !== null) generateFromSeed(currentSeed);
}

// responsive on first layout
window.addEventListener("load", () => {
  windowResized();
});
