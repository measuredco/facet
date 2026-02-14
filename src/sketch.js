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

// UI control configuration (defaults + bounds)
const UI_BALANCE_PERCENT_DEFAULT = 50;
const UI_DENSITY_MAX = 50;
const UI_DENSITY_PERCENT_DEFAULT = 0;
const UI_MIRROR_PERCENT_DEFAULT = 0;
const UI_OPACITY_PERCENT_DEFAULT = 75;
const UI_OUTLINE_PERCENT_DEFAULT = 0;
const UI_WEIGHT_PERCENT_DEFAULT = 50;
const UI_SIZE_PERCENT_DEFAULT = 75;
const UI_VARIANCE_PERCENT_DEFAULT = 50;

// Internal tuning constants (engine behavior / performance guards)
const MAX_GENERATION_ATTEMPTS = 9000;
const MIN_STROKE_WIDTH = 1;
const MIN_THICK_STROKE_WIDTH = 2;

// Default values for runtime UI controls
const runtimeConfig = {
  shapeCountPercent: UI_DENSITY_PERCENT_DEFAULT,
  strokeOnlyProbability: UI_OUTLINE_PERCENT_DEFAULT / 100,
  weightProbability: UI_WEIGHT_PERCENT_DEFAULT / 100,
  flipProbability: UI_MIRROR_PERCENT_DEFAULT / 100,
  overlapAlpha: UI_OPACITY_PERCENT_DEFAULT / 100,
  sizePercent: UI_SIZE_PERCENT_DEFAULT,
  variancePercent: UI_VARIANCE_PERCENT_DEFAULT,
  balancePercent: UI_BALANCE_PERCENT_DEFAULT,
};
const URL_PARAMS = {
  seed: "s",
  balancePct: "bl",
  densityPct: "dn",
  mirrorPct: "mr",
  opacityPct: "op",
  outlinePct: "ot",
  sizePct: "sz",
  variancePct: "vr",
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
  const balancePct = Math.round(runtimeConfig.balancePercent);
  const densityPct = Math.round(runtimeConfig.shapeCountPercent);
  const mirrorPct = Math.round(runtimeConfig.flipProbability * 100);
  const opacityPct = Math.round(runtimeConfig.overlapAlpha * 100);
  const outlinePct = Math.round(runtimeConfig.strokeOnlyProbability * 100);
  const weightPct = Math.round(runtimeConfig.weightProbability * 100);
  const sizePct = Math.round(runtimeConfig.sizePercent);
  const variancePct = Math.round(runtimeConfig.variancePercent);

  return [
    `facet-s${safeSeed}`,
    `${URL_PARAMS.balancePct}${balancePct}`,
    `${URL_PARAMS.densityPct}${densityPct}`,
    `${URL_PARAMS.mirrorPct}${mirrorPct}`,
    `${URL_PARAMS.opacityPct}${opacityPct}`,
    `${URL_PARAMS.outlinePct}${outlinePct}`,
    `${URL_PARAMS.sizePct}${sizePct}`,
    `${URL_PARAMS.variancePct}${variancePct}`,
    `${URL_PARAMS.weightPct}${weightPct}`,
  ].join("-");
}

function parseSeed(value) {
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

function getVarianceFromPercent(variancePercent) {
  const t = clamp(variancePercent, 0, 100) / 100;
  return lerp(0, 1, t);
}

function getSizeRatioRange(sizePercent, variancePercent) {
  const variance = getVarianceFromPercent(variancePercent);
  const minRatio = 0.1;
  const maxRatio = 2.0;
  const sizeControl = getSizeControlFromPercent(sizePercent);
  return {
    min: clamp(sizeControl - variance, minRatio, maxRatio),
    max: clamp(sizeControl + variance, minRatio, maxRatio),
  };
}

function getShapeCountFromPercent(shapeCountPercent) {
  const p = clamp(shapeCountPercent, 0, 100) / 100;
  return Math.round(1 + p * (UI_DENSITY_MAX - 1));
}

function getCenterBalanceConfig(balancePercent) {
  const t = clamp(balancePercent, 0, 100) / 100;
  return {
    positionBias: lerp(0.1, 0.56, t),
    targetOffset: lerp(0.45, 0.08, t),
    slack: lerp(0.035, 0.008, t),
  };
}

function shouldDisableOpacityControl() {
  return (
    runtimeConfig.strokeOnlyProbability >= 1 || runtimeConfig.shapeCountPercent <= 0
  );
}

function updateRuntimeControlDisplay() {
  const balanceValue = document.getElementById("balanceValue");
  const densityValue = document.getElementById("densityValue");
  const outlineValue = document.getElementById("outlineValue");
  const mirrorValue = document.getElementById("mirrorValue");
  const opacityValue = document.getElementById("opacityValue");
  const sizeValue = document.getElementById("sizeValue");
  const weightValue = document.getElementById("weightValue");
  const varianceValue = document.getElementById("varianceValue");

  if (balanceValue) {
    balanceValue.textContent = `${Math.round(runtimeConfig.balancePercent)}%`;
  }
  if (densityValue) {
    densityValue.textContent = `${Math.round(runtimeConfig.shapeCountPercent)}%`;
  }
  if (outlineValue) {
    outlineValue.textContent = `${Math.round(
      runtimeConfig.strokeOnlyProbability * 100,
    )}%`;
  }
  if (mirrorValue) {
    mirrorValue.textContent = `${Math.round(
      runtimeConfig.flipProbability * 100,
    )}%`;
  }
  if (opacityValue) {
    opacityValue.textContent = `${Math.round(runtimeConfig.overlapAlpha * 100)}%`;
  }
  if (sizeValue) {
    sizeValue.textContent = `${Math.round(runtimeConfig.sizePercent)}%`;
  }
  if (weightValue) {
    weightValue.textContent = `${Math.round(
      runtimeConfig.weightProbability * 100,
    )}%`;
  }
  if (varianceValue) {
    varianceValue.textContent = `${Math.round(runtimeConfig.variancePercent)}%`;
  }
}

function syncRuntimeControlsToInputs() {
  const balanceInput = document.getElementById("balanceInput");
  const densityInput = document.getElementById("densityInput");
  const outlineInput = document.getElementById("outlineInput");
  const mirrorInput = document.getElementById("mirrorInput");
  const opacityInput = document.getElementById("opacityInput");
  const sizeInput = document.getElementById("sizeInput");
  const weightInput = document.getElementById("weightInput");
  const varianceInput = document.getElementById("varianceInput");

  if (balanceInput) {
    balanceInput.value = String(Math.round(runtimeConfig.balancePercent));
  }
  if (densityInput) {
    densityInput.value = String(Math.round(runtimeConfig.shapeCountPercent));
  }
  if (outlineInput) {
    outlineInput.value = String(
      Math.round(runtimeConfig.strokeOnlyProbability * 100),
    );
  }
  if (mirrorInput) {
    mirrorInput.value = String(Math.round(runtimeConfig.flipProbability * 100));
  }
  if (opacityInput) {
    opacityInput.value = String(Math.round(runtimeConfig.overlapAlpha * 100));
    opacityInput.disabled = shouldDisableOpacityControl();
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
  if (varianceInput) {
    varianceInput.value = String(runtimeConfig.variancePercent);
  }
}

function bindRuntimeControls() {
  const balanceInput = document.getElementById("balanceInput");
  const densityInput = document.getElementById("densityInput");
  const outlineInput = document.getElementById("outlineInput");
  const mirrorInput = document.getElementById("mirrorInput");
  const opacityInput = document.getElementById("opacityInput");
  const sizeInput = document.getElementById("sizeInput");
  const weightInput = document.getElementById("weightInput");
  const varianceInput = document.getElementById("varianceInput");
  const resetBtn = document.getElementById("resetBtn");
  const randomBtn = document.getElementById("randomBtn");

  if (
    !balanceInput ||
    !densityInput ||
    !outlineInput ||
    !mirrorInput ||
    !opacityInput ||
    !sizeInput ||
    !weightInput ||
    !varianceInput ||
    !resetBtn ||
    !randomBtn
  ) {
    return;
  }

  syncRuntimeControlsToInputs();
  updateRuntimeControlDisplay();

  balanceInput.addEventListener("input", () => {
    const nextValue = Number(balanceInput.value);
    runtimeConfig.balancePercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  densityInput.addEventListener("input", () => {
    const nextValue = Number(densityInput.value);
    runtimeConfig.shapeCountPercent = clamp(nextValue, 0, 100);
    opacityInput.disabled = shouldDisableOpacityControl();
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

  mirrorInput.addEventListener("input", () => {
    const nextValue = Number(mirrorInput.value) / 100;
    runtimeConfig.flipProbability = clamp(nextValue, 0, 1);
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

  varianceInput.addEventListener("input", () => {
    const nextValue = Number(varianceInput.value);
    runtimeConfig.variancePercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  resetBtn.addEventListener("click", () => {
    runtimeConfig.balancePercent = UI_BALANCE_PERCENT_DEFAULT;
    runtimeConfig.shapeCountPercent = UI_DENSITY_PERCENT_DEFAULT;
    runtimeConfig.strokeOnlyProbability = UI_OUTLINE_PERCENT_DEFAULT / 100;
    runtimeConfig.flipProbability = UI_MIRROR_PERCENT_DEFAULT / 100;
    runtimeConfig.overlapAlpha = UI_OPACITY_PERCENT_DEFAULT / 100;
    runtimeConfig.weightProbability = UI_WEIGHT_PERCENT_DEFAULT / 100;
    runtimeConfig.sizePercent = UI_SIZE_PERCENT_DEFAULT;
    runtimeConfig.variancePercent = UI_VARIANCE_PERCENT_DEFAULT;
    syncRuntimeControlsToInputs();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  randomBtn.addEventListener("click", () => {
    runtimeConfig.balancePercent = Math.round(Math.random() * 100);
    runtimeConfig.shapeCountPercent = Math.round(Math.random() * 100);
    runtimeConfig.flipProbability = Math.random();
    runtimeConfig.overlapAlpha = Math.random();
    runtimeConfig.strokeOnlyProbability = Math.random();
    runtimeConfig.weightProbability = Math.random();
    runtimeConfig.sizePercent = Math.round(Math.random() * 100);
    runtimeConfig.variancePercent = Math.round(Math.random() * 100);
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

  const balancePctRaw = params.get(URL_PARAMS.balancePct);
  if (balancePctRaw !== null) {
    const balancePct = Number(balancePctRaw);
    if (Number.isFinite(balancePct) && !Number.isNaN(balancePct)) {
      runtimeConfig.balancePercent = clamp(balancePct, 0, 100);
    }
  }

  const shapePctRaw = params.get(URL_PARAMS.densityPct);
  if (shapePctRaw !== null) {
    const shapePct = Number(shapePctRaw);
    if (Number.isFinite(shapePct) && !Number.isNaN(shapePct)) {
      runtimeConfig.shapeCountPercent = clamp(shapePct, 0, 100);
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

  const flipPctRaw = params.get(URL_PARAMS.mirrorPct);
  if (flipPctRaw !== null) {
    const flipPct = Number(flipPctRaw);
    if (Number.isFinite(flipPct) && !Number.isNaN(flipPct)) {
      runtimeConfig.flipProbability = clamp(flipPct / 100, 0, 1);
    }
  }

  const overlapPctRaw = params.get(URL_PARAMS.opacityPct);
  if (overlapPctRaw !== null) {
    const overlapPct = Number(overlapPctRaw);
    if (Number.isFinite(overlapPct) && !Number.isNaN(overlapPct)) {
      runtimeConfig.overlapAlpha = clamp(overlapPct / 100, 0, 1);
    }
  }

  const sizePctRaw = params.get(URL_PARAMS.sizePct);
  if (sizePctRaw !== null) {
    const sizePercent = Number(sizePctRaw);
    if (Number.isFinite(sizePercent) && !Number.isNaN(sizePercent)) {
      runtimeConfig.sizePercent = clamp(sizePercent, 0, 100);
    }
  }

  const variancePctRaw = params.get(URL_PARAMS.variancePct);
  if (variancePctRaw !== null) {
    const variancePercent = Number(variancePctRaw);
    if (Number.isFinite(variancePercent) && !Number.isNaN(variancePercent)) {
      runtimeConfig.variancePercent = clamp(variancePercent, 0, 100);
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
    URL_PARAMS.balancePct,
    String(Math.round(runtimeConfig.balancePercent)),
  );
  orderedParams.set(
    URL_PARAMS.densityPct,
    String(Math.round(runtimeConfig.shapeCountPercent)),
  );
  orderedParams.set(
    URL_PARAMS.mirrorPct,
    String(Math.round(runtimeConfig.flipProbability * 100)),
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
    URL_PARAMS.sizePct,
    String(Math.round(runtimeConfig.sizePercent)),
  );
  orderedParams.set(
    URL_PARAMS.variancePct,
    String(Math.round(runtimeConfig.variancePercent)),
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
  const initialSeed = readSeedFromUrl() ?? Math.floor(Math.random() * 1e9);
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
  const strokeShapes = shapeList.filter((shape) => shape.styleMode === "stroke");
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

function getCenterOffsetRatio(shapeList, canvasWidth, canvasHeight) {
  if (shapeList.length === 0) return 0;

  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;
  shapeList.forEach((shape) => {
    const weight = Math.max(1, shape.size * shape.size);
    weightedX += shape.x * weight;
    weightedY += shape.y * weight;
    totalWeight += weight;
  });

  if (totalWeight <= 0) return 0;

  const centroidX = weightedX / totalWeight;
  const centroidY = weightedY / totalWeight;
  const dx = centroidX - canvasWidth * 0.5;
  const dy = centroidY - canvasHeight * 0.5;
  const dist = Math.hypot(dx, dy);
  const maxDist = Math.hypot(canvasWidth * 0.5, canvasHeight * 0.5);
  return maxDist > 0 ? dist / maxDist : 0;
}

function validateCandidateConstraints(
  candidate,
  currentShapes,
  centerOffsetRatio,
  centerBalance,
  canvasWidth,
  canvasHeight,
) {
  if (overlapsSameColor(candidate, currentShapes)) {
    return {
      accepted: false,
      nextCenterOffsetRatio: centerOffsetRatio,
    };
  }

  const nextShapes = [...currentShapes, candidate];
  const nextCenterOffsetRatio = getCenterOffsetRatio(
    nextShapes,
    canvasWidth,
    canvasHeight,
  );
  const withinCenterTarget = nextCenterOffsetRatio <= centerBalance.targetOffset;
  const improvesCenterBalance =
    nextCenterOffsetRatio <= centerOffsetRatio + centerBalance.slack;
  const centerBalanced = withinCenterTarget || improvesCenterBalance;

  return {
    accepted: centerBalanced,
    nextCenterOffsetRatio: centerBalanced
      ? nextCenterOffsetRatio
      : centerOffsetRatio,
  };
}

function generateFromSeed(seed) {
  currentSeed = seed;
  randomSeed(seed);
  noiseSeed(seed);

  shapes = [];
  const { min: minSizeRatio, max: maxSizeRatio } = getSizeRatioRange(
    runtimeConfig.sizePercent,
    runtimeConfig.variancePercent,
  );
  const centerBalance = getCenterBalanceConfig(runtimeConfig.balancePercent);
  const minSize = Math.min(width, height) * minSizeRatio;
  const maxSize = Math.min(width, height) * maxSizeRatio;

  let centerOffsetRatio = 0;
  let guard = 0;
  while (
    guard < MAX_GENERATION_ATTEMPTS &&
    shapes.length < getShapeCountFromPercent(runtimeConfig.shapeCountPercent)
  ) {
    guard += 1;
    const color = random(PALETTE);
    const styleMode =
      random() < runtimeConfig.strokeOnlyProbability ? "stroke" : "fill";
    const size = lerp(minSize, maxSize, Math.pow(random(), 0.35));
    const uniformX = random(-size * 0.6, width + size * 0.2);
    const uniformY = random(-size * 0.6, height + size * 0.2);
    const centeredX = randomGaussian(width * 0.5, width * 0.2);
    const centeredY = randomGaussian(height * 0.5, height * 0.2);
    const x = lerp(uniformX, centeredX, centerBalance.positionBias);
    const y = lerp(uniformY, centeredY, centerBalance.positionBias);
    const shouldFlip = random() < runtimeConfig.flipProbability;
    const flipMode = shouldFlip ? Math.floor(random(1, 4)) : 0;
    const flipX = flipMode === 1 || flipMode === 3;
    const flipY = flipMode === 2 || flipMode === 3;

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
    const validation = validateCandidateConstraints(
      candidate,
      shapes,
      centerOffsetRatio,
      centerBalance,
      width,
      height,
    );

    if (validation.accepted) {
      shapes.push(candidate);
      centerOffsetRatio = validation.nextCenterOffsetRatio;
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
