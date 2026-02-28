let cnv;
let shapes = [];
let currentSeed = null;
let resizeFrameRequestId = null;

// Global configuration (foundational/default project settings)
const COLOR_SCHEMES = {
  ad: {
    background: "#031f60",
    palette: ["#072d75", "#083c8a", "#0158ad", "#6db5f8"],
  },
  al: {
    background: "#edf6fe",
    palette: ["#083c8a", "#1666bb", "#2a84e1", "#3598f8"],
  },
  cy: {
    background: "#00161a",
    palette: ["#00333c", "#014a53", "#03636b", "#55b7bd"],
  },
  or: {
    background: "#fef4e8",
    palette: ["#773604", "#ad5601", "#cb6503", "#ea7407"],
  },
  nd: {
    background: "#0b0c0d",
    palette: ["#656667", "#898a8b", "#c8c9ca", "#e3e4e5"],
  },
  nl: {
    background: "#ffffff",
    palette: ["#232424", "#434444", "#656667", "#e3e4e5"],
  },
};
const COMPONENTS = [
  {
    name: "The corner",
    path: "M360 360V224C360 100.5 259.5 0 136 0H0v160h136c35.3 0 64 28.7 64 64v136h160Z",
    value: "tc",
    viewBoxSize: 360,
  },
  {
    name: "Large tile slice",
    path: "M360,224C360,100.5,259.5,0,136,0H0v360h360v-136h0Z",
    value: "ls",
    viewBoxSize: 360,
  },
  {
    name: "Large tile",
    path: "M496,720H224C100.5,720,0,619.5,0,496V224C0,100.5,100.5,0,224,0h272c123.5,0,224,100.5,224,224v272c0,123.5-100.5,224-224,224h0Z",
    value: "lt",
    viewBoxSize: 720,
  },
  {
    name: "Small tile slice",
    path: "M200,64C200,28.7,171.3,0,136,0H0v200h200V64h0Z",
    value: "ss",
    viewBoxSize: 200,
  },
  {
    name: "Small tile",
    path: "m64 0c-35.3 0-64 28.7-64 64v272c0 35.3 28.7 64 64 64h272c35.3 0 64-28.7 64-64v-272c0-35.3-28.7-64-64-64z",
    value: "st",
    viewBoxSize: 400,
  },
];
const COMPONENTS_BY_VALUE = new Map(
  COMPONENTS.map((component) => [
    component.value,
    {
      ...component,
      path2D: new Path2D(component.path),
    },
  ]),
);
const DEFAULT_COMPONENT_VALUE = "tc";
const MIX_COMPONENT_VALUE = "mx";
const STROKE_WIDTH_RATIOS = [0.0037, 0.0148];
const RATIO_SPECS = {
  l: {
    label: "16:9",
    preview: { width: 800, height: 450 },
    hiRes: { width: 7680, height: 4320 },
    standard: { width: 1920, height: 1080 },
  },
  og: {
    label: "OG",
    preview: { width: 800, height: 419 },
    hiRes: { width: 7680, height: 4020 },
    standard: { width: 1200, height: 630 },
  },
  s: {
    label: "1:1",
    preview: { width: 800, height: 800 },
    hiRes: { width: 4320, height: 4320 },
    standard: { width: 1600, height: 1600 },
  },
  p: {
    label: "4:5",
    preview: { width: 800, height: 1000 },
    hiRes: { width: 4320, height: 5400 },
    standard: { width: 1600, height: 2000 },
  },
};
const DEFAULT_RATIO_VALUE = "l";
const DEFAULT_SEED = 991712126;
const DEFAULT_COLOR_VALUE = "ad";

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
const UI_HALFTONE_PERCENT_DEFAULT = 0;
const UI_DOT_SIZE_PERCENT_DEFAULT = 0;

// Internal tuning constants (engine behavior / performance guards)
const ENABLE_SAME_COLOR_OVERLAP_CHECK = true;
const MAX_GENERATION_ATTEMPTS = 9000;
const MIN_STROKE_WIDTH = 1;
const MIN_THICK_STROKE_WIDTH = 2;

// Default values for runtime UI controls
const runtimeConfig = {
  ratioValue: DEFAULT_RATIO_VALUE,
  componentValue: DEFAULT_COMPONENT_VALUE,
  colorValue: DEFAULT_COLOR_VALUE,
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
  dotSizePercent: UI_DOT_SIZE_PERCENT_DEFAULT,
  halftonePercent: UI_HALFTONE_PERCENT_DEFAULT,
};
const URL_PARAMS = {
  seed: "s",
  ratio: "r",
  color: "cl",
  component: "cm",
  amountPct: "a",
  centrePct: "cn",
  edgePct: "e",
  flipXPct: "fx",
  flipYPct: "fy",
  sizePct: "sz",
  spreadPct: "sp",
  blendPct: "b",
  lightPct: "l",
  opacityPct: "op",
  outlinePct: "ot",
  weightPct: "w",
  dotSizePct: "d",
  halftonePct: "sc",
};

function getActiveRatioSpec() {
  return (
    RATIO_SPECS[runtimeConfig.ratioValue] || RATIO_SPECS[DEFAULT_RATIO_VALUE]
  );
}

function resolveRatioValue(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  if (Object.hasOwn(RATIO_SPECS, value)) return value;
  return null;
}

function getActiveComponent() {
  if (runtimeConfig.componentValue === MIX_COMPONENT_VALUE) {
    return COMPONENTS_BY_VALUE.get(DEFAULT_COMPONENT_VALUE);
  }
  return (
    COMPONENTS_BY_VALUE.get(runtimeConfig.componentValue) ||
    COMPONENTS_BY_VALUE.get(DEFAULT_COMPONENT_VALUE)
  );
}

function getActiveColorScheme() {
  return (
    COLOR_SCHEMES[runtimeConfig.colorValue] ||
    COLOR_SCHEMES[DEFAULT_COLOR_VALUE]
  );
}

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
  const activeColorScheme = getActiveColorScheme();
  ctx.fillStyle = activeColorScheme.background;
  ctx.fillRect(0, 0, renderWidth, renderHeight);

  shapes.forEach((s, index) => {
    const activeComponent =
      COMPONENTS_BY_VALUE.get(s.componentValue) || getActiveComponent();
    const viewBoxHalf = activeComponent.viewBoxSize * 0.5;
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

    const scale = drawSize / activeComponent.viewBoxSize;
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
      ctx.stroke(activeComponent.path2D);
    } else {
      ctx.fillStyle = rgbaFromHex(s.color, alpha);
      ctx.fill(activeComponent.path2D);
    }
    ctx.restore();
  });
  applyHalftoneOverlay(ctx);

  ctx.restore();
}

function applyHalftoneOverlay(ctx) {
  if (runtimeConfig.halftonePercent <= 0) return;

  const strength = clamp(runtimeConfig.halftonePercent, 0, 100) / 100;
  const dotSize = clamp(runtimeConfig.dotSizePercent, 0, 100) / 100;
  const targetWidth = ctx.canvas.width;
  const targetHeight = ctx.canvas.height;
  const minDimension = Math.min(targetWidth, targetHeight);
  const coarseCell = clamp(Math.round(minDimension / 180), 4, 24);
  const dotScale = lerp(0.6, 2.2, dotSize);
  const cellSize = Math.max(
    3,
    Math.round(coarseCell * lerp(1.6, 0.8, strength) * dotScale),
  );
  const sampleOffset = Math.floor(cellSize * 0.5);
  const dotAlpha = lerp(0.16, 0.45, strength);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = dotAlpha;
  ctx.fillStyle = "#000";

  for (let y = 0; y < targetHeight; y += cellSize) {
    for (let x = 0; x < targetWidth; x += cellSize) {
      const sx = Math.min(x + sampleOffset, targetWidth - 1);
      const sy = Math.min(y + sampleOffset, targetHeight - 1);
      const pixelOffset = (sy * targetWidth + sx) * 4;
      const r = data[pixelOffset];
      const g = data[pixelOffset + 1];
      const b = data[pixelOffset + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const darkness = 1 - luminance / 255;
      const radius = darkness * (cellSize * 0.5) * strength;
      if (radius <= 0.25) continue;

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function exportCurrentComposition(filename, exportWidth, exportHeight) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportWidth;
  exportCanvas.height = exportHeight;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  const scaleX = exportWidth / width;
  const scaleY = exportHeight / height;
  const uniformScale = Math.min(scaleX, scaleY);
  const offsetX = (exportWidth - width * uniformScale) * 0.5;
  const offsetY = (exportHeight - height * uniformScale) * 0.5;

  drawCompositionToContext(
    exportCtx,
    exportWidth,
    exportHeight,
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
  const activeColorScheme = getActiveColorScheme();
  const svgParts = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${renderWidth}" height="${renderHeight}" viewBox="0 0 ${renderWidth} ${renderHeight}">`,
  );
  svgParts.push(
    `<rect width="${renderWidth}" height="${renderHeight}" fill="${activeColorScheme.background}" />`,
  );

  shapes.forEach((shape, index) => {
    const activeComponent =
      COMPONENTS_BY_VALUE.get(shape.componentValue) || getActiveComponent();
    const viewBoxHalf = activeComponent.viewBoxSize * 0.5;
    const hasLowerOverlap = shapes
      .slice(0, index)
      .some(
        (lowerShape) =>
          lowerShape.styleMode !== "stroke" && shapesOverlap(shape, lowerShape),
      );
    const alpha = hasLowerOverlap ? runtimeConfig.overlapAlpha : 1;

    const scale = shape.size / activeComponent.viewBoxSize;
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
        `<path d="${activeComponent.path}" fill="none" stroke="${rgbaFromHex(shape.color, alpha)}" stroke-width="${localStrokeWidth}" transform="${transform}" />`,
      );
      return;
    }

    svgParts.push(
      `<path d="${activeComponent.path}" fill="${rgbaFromHex(shape.color, alpha)}" transform="${transform}" />`,
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
  const ratio = runtimeConfig.ratioValue;
  const component = runtimeConfig.componentValue;
  const color = runtimeConfig.colorValue;
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
  const dotSizePct = Math.round(runtimeConfig.dotSizePercent);
  const halftonePct = Math.round(runtimeConfig.halftonePercent);

  const paramString = [
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
    `${URL_PARAMS.dotSizePct}${dotSizePct}`,
    `${URL_PARAMS.halftonePct}${halftonePct}`,
  ].join("");
  return `facet-${safeSeed}-${ratio}-${color}-${component}-${paramString}`;
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

function getPaletteWeights(lightPercent, palette) {
  const t = clamp(lightPercent, 0, 100) / 100;
  const count = palette.length;
  const uniformWeight = 1 / count;
  const earlyWeights = palette.map((_, index) => 1 / (index + 1));
  const earlyTotal = earlyWeights.reduce((sum, value) => sum + value, 0);
  const lateWeights = palette.map((_, index) => index + 1);
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

function pickPaletteColor(weights, palette) {
  const threshold = random();
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += weights[i];
    if (threshold <= sum) return palette[i];
  }
  return palette[palette.length - 1];
}

function shouldDisableOpacityControl() {
  return (
    runtimeConfig.strokeOnlyProbability >= 1 || runtimeConfig.amountPercent <= 0
  );
}

function shouldDisableBlendControl() {
  return runtimeConfig.amountPercent <= 0;
}

function shouldDisableDotSizeControl() {
  return runtimeConfig.halftonePercent <= 0;
}

function shouldDisableFlipControls() {
  // Large tile and small tile are symmetrical; flipping yields no visual change.
  if (runtimeConfig.componentValue === MIX_COMPONENT_VALUE) return false;
  return (
    runtimeConfig.componentValue === "lt" ||
    runtimeConfig.componentValue === "st"
  );
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
  const dotSizeValue = document.getElementById("dotSizeValue");
  const halftoneValue = document.getElementById("halftoneValue");

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
  if (dotSizeValue) {
    dotSizeValue.textContent = String(Math.round(runtimeConfig.dotSizePercent));
  }
  if (halftoneValue) {
    halftoneValue.textContent = String(
      Math.round(runtimeConfig.halftonePercent),
    );
  }
}

function syncRatioOptionsToInputs() {
  const ratioOptions = document.querySelectorAll(
    '#ratioMenuPanel [role="option"]',
  );
  if (ratioOptions.length === 0) return;
  const ratioBtn = document.getElementById("ratioBtn");
  const activeRatio = getActiveRatioSpec();

  ratioOptions.forEach((option) => {
    if (!(option instanceof HTMLElement)) return;
    const isSelected = option.dataset.ratio === runtimeConfig.ratioValue;
    option.setAttribute("aria-selected", String(isSelected));
    option.tabIndex = isSelected ? 0 : -1;
  });
  if (ratioBtn) {
    ratioBtn.textContent = activeRatio.label;
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
  const dotSizeInput = document.getElementById("dotSizeInput");
  const halftoneInput = document.getElementById("halftoneInput");
  const componentInput = document.querySelector(
    `input[name="componentInput"][value="${runtimeConfig.componentValue}"]`,
  );
  const colorInput = document.querySelector(
    `input[name="colorInput"][value="${runtimeConfig.colorValue}"]`,
  );

  if (componentInput instanceof HTMLInputElement) {
    componentInput.checked = true;
  }
  if (colorInput instanceof HTMLInputElement) {
    colorInput.checked = true;
  }
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
    flipXInput.disabled = shouldDisableFlipControls();
  }
  if (flipYInput) {
    flipYInput.value = String(Math.round(runtimeConfig.flipYProbability * 100));
    flipYInput.disabled = shouldDisableFlipControls();
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
  if (dotSizeInput) {
    dotSizeInput.value = String(runtimeConfig.dotSizePercent);
    dotSizeInput.disabled = shouldDisableDotSizeControl();
  }
  if (halftoneInput) {
    halftoneInput.value = String(runtimeConfig.halftonePercent);
  }
}

function applyRandomizedSettings() {
  const componentValues = [
    ...COMPONENTS.map((component) => component.value),
    MIX_COMPONENT_VALUE,
  ];
  runtimeConfig.componentValue =
    componentValues[Math.floor(Math.random() * componentValues.length)];
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
  runtimeConfig.halftonePercent = Math.round(Math.random() * 100);
  runtimeConfig.dotSizePercent = Math.round(Math.random() * 100);
  syncRuntimeControlsToInputs();
  updateRuntimeControlDisplay();
  writeUrlState(currentSeed);
  if (currentSeed !== null) generateFromSeed(currentSeed);
}

function applySeedVariant() {
  const seed = Math.floor(Math.random() * 1e9);
  writeUrlState(seed);
  generateFromSeed(seed);
}

function bindRuntimeControls() {
  const componentInputs = document.querySelectorAll(
    'input[name="componentInput"]',
  );
  const colorInputs = document.querySelectorAll('input[name="colorInput"]');
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
  const dotSizeInput = document.getElementById("dotSizeInput");
  const halftoneInput = document.getElementById("halftoneInput");
  const resetBtn = document.getElementById("resetBtn");
  const seedBtn = document.getElementById("seedBtn");

  if (
    componentInputs.length === 0 ||
    colorInputs.length === 0 ||
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
    !dotSizeInput ||
    !halftoneInput ||
    !resetBtn ||
    !seedBtn
  ) {
    return;
  }

  syncRuntimeControlsToInputs();
  updateRuntimeControlDisplay();

  componentInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!(input instanceof HTMLInputElement) || !input.checked) return;
      runtimeConfig.componentValue = input.value;
      syncRuntimeControlsToInputs();
      updateRuntimeControlDisplay();
      writeUrlState(currentSeed);
      if (currentSeed !== null) generateFromSeed(currentSeed);
    });
  });

  colorInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!(input instanceof HTMLInputElement) || !input.checked) return;
      if (!Object.hasOwn(COLOR_SCHEMES, input.value)) return;
      runtimeConfig.colorValue = input.value;
      syncRuntimeControlsToInputs();
      updateRuntimeControlDisplay();
      writeUrlState(currentSeed);
      if (currentSeed !== null) generateFromSeed(currentSeed);
    });
  });

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

  dotSizeInput.addEventListener("input", () => {
    const nextValue = Number(dotSizeInput.value);
    runtimeConfig.dotSizePercent = clamp(nextValue, 0, 100);
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  halftoneInput.addEventListener("input", () => {
    const nextValue = Number(halftoneInput.value);
    runtimeConfig.halftonePercent = clamp(nextValue, 0, 100);
    dotSizeInput.disabled = shouldDisableDotSizeControl();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  resetBtn.addEventListener("click", () => {
    runtimeConfig.componentValue = DEFAULT_COMPONENT_VALUE;
    runtimeConfig.colorValue = DEFAULT_COLOR_VALUE;
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
    runtimeConfig.halftonePercent = UI_HALFTONE_PERCENT_DEFAULT;
    runtimeConfig.dotSizePercent = UI_DOT_SIZE_PERCENT_DEFAULT;
    syncRuntimeControlsToInputs();
    updateRuntimeControlDisplay();
    writeUrlState(currentSeed);
    if (currentSeed !== null) generateFromSeed(currentSeed);
  });

  seedBtn.addEventListener("click", () => {
    applySeedVariant();
  });
}

function readSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return parseSeed(params.get(URL_PARAMS.seed));
}

function readRuntimeConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const ratioRaw = params.get(URL_PARAMS.ratio);
  const resolvedRatio = resolveRatioValue(ratioRaw);
  if (resolvedRatio !== null) {
    runtimeConfig.ratioValue = resolvedRatio;
  }

  const componentRaw = params.get(URL_PARAMS.component);
  if (componentRaw === MIX_COMPONENT_VALUE) {
    runtimeConfig.componentValue = MIX_COMPONENT_VALUE;
  } else if (componentRaw !== null && COMPONENTS_BY_VALUE.has(componentRaw)) {
    runtimeConfig.componentValue = componentRaw;
  }

  const colorRaw = params.get(URL_PARAMS.color);
  if (colorRaw !== null && Object.hasOwn(COLOR_SCHEMES, colorRaw)) {
    runtimeConfig.colorValue = colorRaw;
  }

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

  const dotSizePctRaw = params.get(URL_PARAMS.dotSizePct);
  if (dotSizePctRaw !== null) {
    const dotSizePct = Number(dotSizePctRaw);
    if (Number.isFinite(dotSizePct) && !Number.isNaN(dotSizePct)) {
      runtimeConfig.dotSizePercent = clamp(dotSizePct, 0, 100);
    }
  }

  const halftonePctRaw = params.get(URL_PARAMS.halftonePct);
  if (halftonePctRaw !== null) {
    const halftonePct = Number(halftonePctRaw);
    if (Number.isFinite(halftonePct) && !Number.isNaN(halftonePct)) {
      runtimeConfig.halftonePercent = clamp(halftonePct, 0, 100);
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
  orderedParams.set(URL_PARAMS.ratio, runtimeConfig.ratioValue);
  orderedParams.set(URL_PARAMS.color, runtimeConfig.colorValue);
  orderedParams.set(URL_PARAMS.component, runtimeConfig.componentValue);
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
  orderedParams.set(
    URL_PARAMS.dotSizePct,
    String(Math.round(runtimeConfig.dotSizePercent)),
  );
  orderedParams.set(
    URL_PARAMS.halftonePct,
    String(Math.round(runtimeConfig.halftonePercent)),
  );

  url.search = orderedParams.toString();
  window.history.replaceState(null, "", url);
}

function setup() {
  const container = document.getElementById("sketchContainer");
  const initialRatio = getActiveRatioSpec();
  cnv = createCanvas(initialRatio.preview.width, initialRatio.preview.height);
  cnv.parent(container);
  noLoop();

  // wire controls
  const ratioMenuPanel = document.getElementById("ratioMenuPanel");
  const ratioBtn = document.getElementById("ratioBtn");
  const genBtn = document.getElementById("generateBtn");
  const downloadHiResBtn = document.getElementById("downloadHiResBtn");
  const downloadWebBtn = document.getElementById("downloadWebBtn");
  const downloadSvgBtn = document.getElementById("downloadSvgBtn");
  readRuntimeConfigFromUrl();
  syncRatioOptionsToInputs();
  applyResponsiveCanvasSize();
  bindRuntimeControls();

  if (ratioBtn && ratioMenuPanel) {
    ratioBtn.addEventListener("choose", (event) => {
      const customEvent = event;
      if (!(customEvent instanceof CustomEvent)) return;
      const choice = customEvent.detail?.choice;
      if (!(choice instanceof HTMLElement)) return;
      const nextRatio = resolveRatioValue(choice.dataset.ratio);
      if (!nextRatio) return;
      runtimeConfig.ratioValue = nextRatio;
      syncRatioOptionsToInputs();
      writeUrlState(currentSeed);
      applyResponsiveCanvasSize();
    });
  }

  genBtn.addEventListener("click", () => {
    applyRandomizedSettings();
  });

  if (downloadHiResBtn) {
    downloadHiResBtn.addEventListener("click", () => {
      const filename = buildExportFilename(currentSeed);
      const ratioSpec = getActiveRatioSpec();
      exportCurrentComposition(
        filename,
        ratioSpec.hiRes.width,
        ratioSpec.hiRes.height,
      );
    });
  }

  if (downloadWebBtn) {
    downloadWebBtn.addEventListener("click", () => {
      const filename = buildExportFilename(currentSeed);
      const ratioSpec = getActiveRatioSpec();
      exportCurrentComposition(
        filename,
        ratioSpec.standard.width,
        ratioSpec.standard.height,
      );
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
  const shouldDisableFlip = shouldDisableFlipControls();
  const effectiveFlipXProbability = shouldDisableFlip
    ? 0
    : runtimeConfig.flipXProbability;
  const effectiveFlipYProbability = shouldDisableFlip
    ? 0
    : runtimeConfig.flipYProbability;
  const edgeOverflow = getEdgeOverflowFactors(runtimeConfig.edgePercent);
  const palette = getActiveColorScheme().palette;
  const paletteWeights = getPaletteWeights(runtimeConfig.lightPercent, palette);
  const minSize = Math.min(width, height) * minSizeRatio;
  const maxSize = Math.min(width, height) * maxSizeRatio;

  let guard = 0;
  while (
    guard < MAX_GENERATION_ATTEMPTS &&
    shapes.length < getShapeCountFromPercent(runtimeConfig.amountPercent)
  ) {
    guard += 1;
    const color = pickPaletteColor(paletteWeights, palette);
    const componentValue =
      runtimeConfig.componentValue === MIX_COMPONENT_VALUE
        ? COMPONENTS[Math.floor(random(COMPONENTS.length))].value
        : runtimeConfig.componentValue;
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
    const flipX = random() < effectiveFlipXProbability;
    const flipY = random() < effectiveFlipYProbability;

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
      componentValue,
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
  if (resizeFrameRequestId !== null) {
    return;
  }
  resizeFrameRequestId = window.requestAnimationFrame(() => {
    resizeFrameRequestId = null;
    applyResponsiveCanvasSize();
  });
}

function applyResponsiveCanvasSize() {
  const container = document.getElementById("sketchContainer");
  if (!container) return;
  const main = document.querySelector("main");
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  const ratioSpec = getActiveRatioSpec();
  const ratio = ratioSpec.preview.height / ratioSpec.preview.width;

  // Use stylesheet max-inline-size as baseline, then cap by viewport height
  // so tall ratios (e.g. square/portrait) don't exceed the visible viewport.
  container.style.removeProperty("max-inline-size");

  const computed = window.getComputedStyle(container);
  const baselineMaxInline = Number.parseFloat(computed.maxInlineSize);
  const baselineMaxInlinePx = Number.isFinite(baselineMaxInline)
    ? baselineMaxInline
    : Number.POSITIVE_INFINITY;

  const mainStyles = main ? window.getComputedStyle(main) : null;
  const mainPaddingBlock = mainStyles
    ? Number.parseFloat(mainStyles.paddingTop) +
      Number.parseFloat(mainStyles.paddingBottom)
    : 0;
  const headerHeight = header ? header.offsetHeight : 0;
  const footerHeight = footer ? footer.offsetHeight : 0;
  const maxCanvasHeight = Math.max(
    1,
    window.innerHeight - headerHeight - footerHeight - mainPaddingBlock,
  );

  const maxInlineFromHeight = maxCanvasHeight / ratio;
  const finalMaxInlinePx = Math.min(baselineMaxInlinePx, maxInlineFromHeight);
  if (Number.isFinite(finalMaxInlinePx)) {
    container.style.maxInlineSize = `${Math.floor(finalMaxInlinePx)}px`;
  }

  const w = container.clientWidth || ratioSpec.preview.width;
  resizeCanvas(w, Math.round(w * ratio));
  if (currentSeed !== null) generateFromSeed(currentSeed);
}

// responsive on first layout
window.addEventListener("load", () => {
  applyResponsiveCanvasSize();
});

window.draw = draw;
window.setup = setup;
window.windowResized = windowResized;
