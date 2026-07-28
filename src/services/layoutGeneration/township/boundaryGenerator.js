import { roundRectCorners } from './geometry.js';

const SHAPES = ['rectangle', 'lShape', 'uShape', 'irregular'];

export function generateBoundary(config) {
  const { size, boundaryShape, rng } = config;
  const halfW = size.widthFeet / 2;
  const halfH = size.heightFeet / 2;

  let shape = boundaryShape;
  if (shape === 'auto') {
    shape = rng.pick(SHAPES);
  }

  let points;
  switch (shape) {
    case 'lShape':
      points = buildLShape(halfW, halfH, rng);
      break;
    case 'uShape':
      points = buildUShape(halfW, halfH, rng);
      break;
    case 'irregular':
      points = buildIrregular(halfW, halfH, rng);
      break;
    default:
      points = buildRectangle(halfW, halfH);
  }

  const cornerRadius = rng.int(15, 40);
  points = roundRectCorners(points, cornerRadius);

  return {
    shape,
    points,
    halfW,
    halfH,
    widthFeet: size.widthFeet,
    heightFeet: size.heightFeet,
  };
}

function buildRectangle(halfW, halfH) {
  return [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];
}

function buildLShape(halfW, halfH, rng) {
  const cutW = halfW * rng.float(0.25, 0.4);
  const cutH = halfH * rng.float(0.25, 0.4);
  return [
    { x: -halfW, y: -halfH },
    { x: halfW - cutW, y: -halfH },
    { x: halfW - cutW, y: -halfH + cutH },
    { x: halfW, y: -halfH + cutH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];
}

function buildUShape(halfW, halfH, rng) {
  const inset = halfW * rng.float(0.2, 0.35);
  const depth = halfH * rng.float(0.25, 0.4);
  return [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH - depth },
    { x: inset, y: halfH - depth },
    { x: inset, y: halfH },
    { x: -inset, y: halfH },
    { x: -inset, y: halfH - depth },
    { x: -halfW, y: halfH - depth },
  ];
}

function buildIrregular(halfW, halfH, rng) {
  const jitter = 0.08;
  return [
    { x: -halfW * (1 + rng.float(-jitter, jitter)), y: -halfH * (1 + rng.float(-jitter, jitter)) },
    { x: halfW * (1 + rng.float(-jitter, jitter)), y: -halfH * (1 + rng.float(-jitter, jitter * 0.5)) },
    { x: halfW * (1 + rng.float(-jitter * 0.5, jitter)), y: halfH * (1 + rng.float(-jitter, jitter)) },
    { x: -halfW * (1 + rng.float(-jitter, jitter * 0.5)), y: halfH * (1 + rng.float(-jitter, jitter)) },
  ];
}
