import type { AuctionHouse } from "../types";

/**
 * CAA — prints the same form as TAA, box for box. Checked against a real CAA Chubu sheet from our catalogue.
 *
 * Boxes follow the real form: measured as percentages of the sheet, scaled to a
 * 1000-wide viewBox and snapped so neighbours share an edge. Listed in reading
 * order, which is also the order the stepper walks them in.
 */
export const caa: AuctionHouse = {
  id: "caa",
  name: "CAA",
  height: 1000,
  cells: [
    { field: "lotNumber", x: 26, y: 24, w: 113, h: 117 },
    { field: "firstRegistration", x: 139, y: 24, w: 79, h: 117, jp: "初年度登録" },
    { field: "carName", x: 218, y: 24, w: 222, h: 67 },
    { field: "bodyType", x: 440, y: 24, w: 92, h: 67, jp: "ドア形状" },
    { field: "grade", x: 532, y: 24, w: 354, h: 67 },
    { field: "overallGrade", x: 895, y: 24, w: 78, h: 67 },
    { field: "vehicleHistory", x: 218, y: 91, w: 116, h: 50 },
    { field: "displacement", x: 334, y: 91, w: 106, h: 50 },
    { field: "fuel", x: 440, y: 91, w: 92, h: 50, sample: "ガソリン" },
    { field: "modelCode", x: 532, y: 91, w: 354, h: 50 },
    { field: "exteriorGrade", x: 895, y: 91, w: 39, h: 50 },
    { field: "interiorGrade", x: 934, y: 91, w: 39, h: 50 },
    { field: "mileage", x: 26, y: 148, w: 192, h: 62 },
    { field: "shaken", x: 218, y: 148, w: 116, h: 62 },
    { field: "registrationNumber", x: 334, y: 148, w: 228, h: 62 },
    { field: "nameChangeDeadline", x: 562, y: 148, w: 112, h: 62, jp: "名変期限" },
    { field: "salesPoints", x: 674, y: 148, w: 299, h: 159, kind: "note" },
    { field: "transmission", x: 26, y: 210, w: 57, h: 97 },
    { field: "airConditioner", x: 83, y: 210, w: 56, h: 97 },
    { field: "color", x: 139, y: 210, w: 325, h: 48 },
    { field: "seats", x: 464, y: 210, w: 98, h: 48 },
    { field: "payload", x: 562, y: 210, w: 112, h: 48 },
    { field: "colorCode", x: 139, y: 258, w: 156, h: 49, jp: "カラーNo" },
    { field: "interiorColor", x: 295, y: 258, w: 169, h: 49 },
    { field: "importHistory", x: 464, y: 258, w: 98, h: 49, jp: "輸入車" },
    { field: "recycleFee", x: 562, y: 258, w: 112, h: 49 },
    { field: "documentsLater", x: 26, y: 307, w: 648, h: 50, jp: "後日発送部品", sample: "保証書・取説・スペアキー" },
    { field: "equipment", x: 674, y: 307, w: 299, h: 50, jp: "純正装備", sample: "AW PS PW ナビ TV エアB ABS" },
    { field: "sellerNotes", x: 26, y: 364, w: 648, h: 100, kind: "note", jp: "注意事項欄" },
    { field: "chassisNumber", x: 674, y: 364, w: 299, h: 50, jp: "車体番号" },
    { field: "dimensions", x: 674, y: 414, w: 299, h: 19, kind: "label", jp: "諸元" },
    { field: "length", x: 674, y: 433, w: 104, h: 31 },
    { field: "width", x: 778, y: 433, w: 101, h: 31 },
    { field: "height", x: 879, y: 433, w: 94, h: 31 },
    { field: "inspectorNotes", x: 26, y: 472, w: 478, h: 409, kind: "note", jp: "検査員記入欄" },
    { field: "damageDiagram", x: 514, y: 472, w: 459, h: 479, kind: "diagram" },
    { field: "eqSpareTire", x: 514, y: 868, w: 63, h: 55, kind: "check" },
    { field: "officeNotes", x: 26, y: 881, w: 478, h: 70, kind: "note", jp: "事務局よりご案内" },
  ],
  marks: [
    { code: "A1", x: 0.5, y: 0.5 },
    { code: "A3", x: 0.5, y: 0.07 },
    { code: "E2", x: 0.5, y: 0.92 },
    { code: "W2", x: 0.5, y: 0.78 },
    { code: "B2", x: 0.73, y: 0.6 },
  ],
};
