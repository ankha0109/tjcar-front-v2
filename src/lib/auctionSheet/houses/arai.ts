import type { AuctionHouse } from "../types";

/**
 * ARAI — Oyama, Bayside and the van and truck halls.
 *
 * Boxes follow the real form: measured as percentages of the sheet, scaled to a
 * 1000-wide viewBox and snapped so neighbours share an edge. Listed in reading
 * order, which is also the order the stepper walks them in.
 */
export const arai: AuctionHouse = {
  id: "arai",
  name: "ARAI",
  height: 1075,
  cells: [
    { field: "lotNumber", x: 28, y: 24, w: 123, h: 164, jp: "出品No" },
    { field: "firstRegistration", x: 151, y: 24, w: 77, h: 107 },
    { field: "carName", x: 228, y: 24, w: 650, h: 107, jp: "車名 ドア 形状 グレード", sample: "プリウス 5D S ツーリング" },
    { field: "overallGrade", x: 878, y: 24, w: 94, h: 91 },
    { field: "interiorGrade", x: 878, y: 115, w: 48, h: 59 },
    { field: "exteriorGrade", x: 926, y: 115, w: 46, h: 59 },
    { field: "modelYear", x: 151, y: 131, w: 164, h: 57 },
    { field: "displacement", x: 315, y: 131, w: 90, h: 57 },
    { field: "modelCode", x: 405, y: 131, w: 219, h: 57 },
    { field: "payload", x: 624, y: 131, w: 156, h: 57 },
    { field: "seats", x: 780, y: 131, w: 98, h: 57 },
    { field: "vehicleHistory", x: 28, y: 188, w: 200, h: 34 },
    { field: "transmission", x: 228, y: 188, w: 200, h: 34 },
    { field: "salesPoints", x: 428, y: 188, w: 544, h: 131, kind: "note" },
    { field: "shaken", x: 28, y: 222, w: 200, h: 34 },
    { field: "airConditioner", x: 228, y: 222, w: 200, h: 34, jp: "冷房" },
    { field: "mileage", x: 28, y: 256, w: 200, h: 49 },
    { field: "fuel", x: 228, y: 256, w: 200, h: 49, sample: "ガソリン" },
    { field: "color", x: 28, y: 305, w: 159, h: 49 },
    { field: "repaint", x: 187, y: 305, w: 41, h: 49 },
    { field: "interiorColor", x: 228, y: 305, w: 200, h: 49 },
    { field: "equipment", x: 428, y: 319, w: 402, h: 35, jp: "純正装備品", sample: "AW PS PW ナビ TV エアB ABS" },
    { field: "steering", x: 830, y: 319, w: 142, h: 35, kind: "value", options: ["右ハンドル"], picked: 0 },
    { field: "colorCode", x: 28, y: 354, w: 200, h: 38, jp: "カラーNo" },
    { field: "documentsLater", x: 228, y: 354, w: 744, h: 38, jp: "後送品申告欄", sample: "保証書・取説・スペアキー" },
    { field: "nameChangeDeadline", x: 708, y: 399, w: 122, h: 32, kind: "label" },
    { field: "nameChangeDeadline", x: 830, y: 399, w: 113, h: 32, kind: "value" },
    { field: "recycleFee", x: 708, y: 431, w: 122, h: 34, kind: "label", jp: "R料金預託済額" },
    { field: "recycleFee", x: 830, y: 431, w: 113, h: 34, kind: "value" },
    { field: "meterHistory", x: 28, y: 465, w: 471, h: 79, kind: "note", jp: "走行に関する補足事項" },
    { field: "damageDiagram", x: 540, y: 465, w: 432, h: 533, kind: "diagram" },
    { field: "sellerNotes", x: 28, y: 544, w: 471, h: 135, kind: "note", jp: "不具合箇所" },
    { field: "inspectorNotes", x: 28, y: 679, w: 471, h: 300, kind: "note" },
    { field: "registrationNumber", x: 28, y: 998, w: 471, h: 32, jp: "登録No" },
    { field: "chassisNumber", x: 518, y: 998, w: 454, h: 32, jp: "車台No" },
  ],
  marks: [
    { code: "A2", x: 0.5, y: 0.78 },
    { code: "W1", x: 0.73, y: 0.6 },
    { code: "U1", x: 0.73, y: 0.42 },
    { code: "A1", x: 0.5, y: 0.2 },
    { code: "B1", x: 0.73, y: 0.16 },
  ],
};
