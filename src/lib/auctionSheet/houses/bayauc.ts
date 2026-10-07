import type { AuctionHouse } from "../types";

/**
 * BAYAUC — Bay Auc, Osaka. A printed data sheet rather than a hand-filled form, and the tallest of the ten.
 *
 * Boxes follow the real form: measured as percentages of the sheet, scaled to a
 * 1000-wide viewBox and snapped so neighbours share an edge. Listed in reading
 * order, which is also the order the stepper walks them in.
 */
export const bayauc: AuctionHouse = {
  id: "bayauc",
  name: "BAYAUC",
  height: 1423,
  cells: [
    { field: "lotNumber", x: 23, y: 23, w: 955, h: 79 },
    { field: "carName", x: 23, y: 102, w: 463, h: 42, jp: "車種名" },
    { field: "firstRegistration", x: 486, y: 102, w: 316, h: 84, jp: "年式" },
    { field: "overallGrade", x: 802, y: 102, w: 176, h: 152 },
    { field: "grade", x: 23, y: 144, w: 463, h: 42 },
    { field: "displacement", x: 23, y: 186, w: 463, h: 42 },
    { field: "mileage", x: 486, y: 186, w: 316, h: 42 },
    { field: "modelCode", x: 23, y: 228, w: 463, h: 42 },
    { field: "driveType", x: 486, y: 228, w: 316, h: 42, sample: "FF" },
    { field: "interiorGrade", x: 802, y: 254, w: 86, h: 142 },
    { field: "exteriorGrade", x: 888, y: 254, w: 90, h: 142 },
    { field: "bodyType", x: 23, y: 270, w: 463, h: 42, jp: "ドア形状" },
    { field: "seats", x: 486, y: 270, w: 316, h: 42, jp: "定員" },
    { field: "transmission", x: 23, y: 312, w: 463, h: 42 },
    { field: "fuel", x: 486, y: 312, w: 316, h: 42, sample: "G" },
    { field: "color", x: 23, y: 354, w: 463, h: 42 },
    { field: "recycleFee", x: 486, y: 354, w: 316, h: 42, jp: "R料" },
    { field: "equipment", x: 23, y: 396, w: 955, h: 84, sample: ["PS PW ABS AW TV ナビ","エアB AAC"] },
    { field: "dimensions", x: 23, y: 480, w: 128, h: 35, kind: "label", jp: "諸元" },
    { field: "length", x: 151, y: 480, w: 185, h: 35 },
    { field: "width", x: 336, y: 480, w: 174, h: 35 },
    { field: "height", x: 510, y: 480, w: 200, h: 35 },
    { field: "shaken", x: 23, y: 515, w: 292, h: 43, jp: "検査" },
    { field: "manual", x: 315, y: 515, w: 55, h: 43, kind: "value", sample: "取" },
    { field: "serviceBook", x: 370, y: 515, w: 126, h: 43, kind: "value", sample: "保証書" },
    { field: "colorCode", x: 693, y: 515, w: 285, h: 43, jp: "カラー" },
    { field: "vehicleHistory", x: 23, y: 558, w: 204, h: 41 },
    { field: "chassisNumber", x: 227, y: 558, w: 343, h: 41, jp: "車台NO" },
    { field: "nameChangeDeadline", x: 693, y: 558, w: 285, h: 41, jp: "名変期限" },
    { field: "damageDiagram", x: 0, y: 599, w: 693, h: 751, kind: "diagram", jp: "検査" },
    { field: "inspectorNotes", x: 693, y: 599, w: 285, h: 803, kind: "value" },
  ],
  marks: [
    { code: "A1", x: 0.5, y: 0.2 },
    { code: "U1", x: 0.73, y: 0.16 },
    { code: "A2", x: 0.27, y: 0.6 },
    { code: "W1", x: 0.27, y: 0.85 },
    { code: "B1", x: 0.27, y: 0.16 },
  ],
};
