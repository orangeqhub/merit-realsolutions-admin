import { bboxFromPolygon } from './geometry.js';

/**
 * STEP 2 — Entrance, gate plaza, visitor parking, security.
 */
export function generateEntrance(boundary, config) {
  const bbox = bboxFromPolygon(boundary.points);
  const centerX = (bbox.minX + bbox.maxX) / 2;
  const gateY = bbox.minY;
  const gateWidth = 60;
  const plazaDepth = 80;
  const parkingDepth = 100;

  const gate = {
    x: centerX - gateWidth / 2,
    y: gateY - 5,
    w: gateWidth,
    h: 10,
    type: 'gate',
  };

  const plaza = {
    x: centerX - 100,
    y: gateY,
    w: 200,
    h: plazaDepth,
    type: 'gatePlaza',
  };

  const security = {
    x: centerX - gateWidth / 2 - 25,
    y: gateY + 10,
    w: 20,
    h: 20,
    type: 'security',
  };

  const visitorParking = {
    x: centerX + gateWidth / 2 + 15,
    y: gateY + 15,
    w: 80,
    h: 50,
    type: 'visitorParking',
  };

  const entranceGarden = {
    x: centerX - 120,
    y: gateY + plazaDepth,
    w: 240,
    h: 40,
    type: 'entranceGarden',
  };

  return {
    gate,
    plaza,
    security,
    visitorParking,
    entranceGarden,
    connectPoint: { x: centerX, y: gateY + plazaDepth },
    mainAxisX: centerX,
  };
}
