/**
 * The vocabulary of a Japanese auction sheet: every kind of box the ten houses
 * print, whatever they call it and wherever they put it. A house layout
 * (`houses/*.ts`) only says *where* a field sits; what it means lives in
 * `text/{mn,en,ru}.ts`, keyed by the same `FieldKey`, so a key missing from any
 * locale is a type error rather than a blank tooltip.
 *
 * `sample` is the fictional car written across all ten sheets — a 2015 Prius,
 * lot 3765, grade 4 — in the inspector's ink, so the reader can tell what is
 * printed on the form from what gets filled in.
 */

export type FieldGroup =
  | "identity"
  | "grade"
  | "spec"
  | "docs"
  | "equipment"
  | "notes"
  | "diagram";

/** Rail order — the order a buyer actually reads a sheet in. */
export const FIELD_GROUPS: FieldGroup[] = [
  "grade",
  "identity",
  "spec",
  "equipment",
  "docs",
  "notes",
  "diagram",
];

export type FieldMeta = {
  group: FieldGroup;
  /** Label as printed on a typical sheet. A house overrides it per cell. */
  jp: string;
  /** What the inspector writes in. */
  sample?: string | string[];
  /** Printed choices; `picked` is the one circled in ink (-1 for none). */
  options?: string[];
  picked?: number;
};

export const FIELD_META = {
  // ── Grade ────────────────────────────────────────────────────────────────
  overallGrade: { group: "grade", jp: "評価点", sample: "4" },
  interiorGrade: { group: "grade", jp: "内装", sample: "B" },
  exteriorGrade: { group: "grade", jp: "外装", sample: "B" },

  // ── Identity ─────────────────────────────────────────────────────────────
  lotNumber: { group: "identity", jp: "出品番号", sample: "3765" },
  carName: { group: "identity", jp: "車名", sample: "プリウス" },
  grade: { group: "identity", jp: "グレード", sample: "S ツーリング" },
  modelCode: { group: "identity", jp: "型式", sample: "DAA-ZVW30" },
  bodyType: { group: "identity", jp: "形状", sample: "5D" },
  doors: { group: "identity", jp: "ドア数", sample: "5D" },
  displacement: { group: "identity", jp: "排気量", sample: "1800" },
  driveType: {
    group: "identity",
    jp: "駆動",
    options: ["2WD", "4WD"],
    picked: 0,
  },
  firstRegistration: { group: "identity", jp: "初度登録", sample: "27年 6月" },
  modelYear: { group: "identity", jp: "モデル年式" },
  vehicleHistory: { group: "identity", jp: "車歴", sample: "自家用" },
  seats: { group: "identity", jp: "乗車定員", sample: "5" },
  payload: { group: "identity", jp: "最大積載量" },
  dimensions: { group: "identity", jp: "寸法" },
  length: { group: "identity", jp: "長さ", sample: "448" },
  width: { group: "identity", jp: "幅", sample: "174" },
  height: { group: "identity", jp: "高さ", sample: "149" },
  steering: {
    group: "identity",
    jp: "ハンドル",
    options: ["右", "左"],
    picked: 0,
  },
  importHistory: { group: "identity", jp: "輸入歴" },
  importType: {
    group: "identity",
    jp: "輸入区分",
    options: ["ディーラー", "並行"],
    picked: -1,
  },
  seller: { group: "identity", jp: "出品店" },
  venue: { group: "identity", jp: "会場", sample: "埼玉" },
  userPurchase: { group: "identity", jp: "ユーザ仕入車" },

  // ── Spec ─────────────────────────────────────────────────────────────────
  mileage: { group: "spec", jp: "走行", sample: "86,000" },
  transmission: { group: "spec", jp: "シフト", sample: "FAT" },
  airConditioner: { group: "spec", jp: "エアコン", sample: "AAC" },
  fuel: {
    group: "spec",
    jp: "燃料",
    options: ["ガソリン", "軽油"],
    picked: 0,
  },
  color: { group: "spec", jp: "外装色", sample: "パール" },
  repaint: { group: "spec", jp: "色替" },
  colorCode: { group: "spec", jp: "カラーNo.", sample: "070" },
  interiorColor: { group: "spec", jp: "内装色", sample: "黒" },

  // ── Equipment ────────────────────────────────────────────────────────────
  equipment: { group: "equipment", jp: "装備" },
  eqSunroof: { group: "equipment", jp: "SR", picked: -1 },
  eqAlloyWheels: { group: "equipment", jp: "AW", picked: 0 },
  eqPowerSteering: { group: "equipment", jp: "PS", picked: 0 },
  eqPowerWindows: { group: "equipment", jp: "PW", picked: 0 },
  eqLeather: { group: "equipment", jp: "革", picked: -1 },
  eqTv: { group: "equipment", jp: "TV", picked: 0 },
  eqNavi: { group: "equipment", jp: "ナビ", picked: 0 },
  eqAirbag: { group: "equipment", jp: "エアB", picked: 0 },
  eqAbs: { group: "equipment", jp: "ABS", picked: 0 },
  eqAudio: { group: "equipment", jp: "オーディオ", picked: -1 },
  eqAero: { group: "equipment", jp: "エアロ", picked: -1 },
  eqSpareTire: { group: "equipment", jp: "スペア", picked: -1 },
  eqWheelCaps: { group: "equipment", jp: "キャップ", picked: -1 },
  eqMirrors: { group: "equipment", jp: "電格ミラー", picked: 0 },
  eqTuner: { group: "equipment", jp: "チューナー", picked: -1 },
  tires: {
    group: "equipment",
    jp: "タイヤ",
    options: ["スタッドレス"],
    picked: -1,
  },

  // ── Documents ────────────────────────────────────────────────────────────
  shaken: { group: "docs", jp: "車検", sample: "8年 6月" },
  registrationNumber: {
    group: "docs",
    jp: "登録番号",
    sample: "名古屋 330 さ 12-34",
  },
  chassisNumber: { group: "docs", jp: "車台番号", sample: "ZVW30-1234567" },
  serialNumber: { group: "docs", jp: "シリアルNo." },
  recycleFee: { group: "docs", jp: "リサイクル預託金", sample: "11,930円" },
  nameChangeDeadline: { group: "docs", jp: "名義変更期限" },
  serviceBook: {
    group: "docs",
    jp: "整備手帳・保証書",
    options: ["有", "無"],
    picked: 0,
  },
  manual: {
    group: "docs",
    jp: "取扱説明書",
    options: ["有", "無"],
    picked: 0,
  },
  documentsLater: {
    group: "docs",
    jp: "後日書類",
    sample: ["保証書・取説", "スペアキー"],
  },

  // ── Notes ────────────────────────────────────────────────────────────────
  salesPoints: {
    group: "notes",
    jp: "セールスポイント",
    sample: ["ワンオーナー", "純正ナビ・Bカメラ・ETC", "スマートキー・LEDライト"],
  },
  sellerNotes: {
    group: "notes",
    jp: "注意事項",
    sample: ["フロントバンパー キズ", "シート 小スレ"],
  },
  inspectorNotes: {
    group: "notes",
    jp: "検査員報告",
    sample: ["小キズ・小ヘコミ有", "フロントガラス 飛石", "内装 小ヨゴレ"],
  },
  officeNotes: { group: "notes", jp: "事務局より" },
  repairHistory: {
    group: "notes",
    jp: "修復歴",
    options: ["有", "無"],
    picked: 1,
  },
  interiorCondition: {
    group: "notes",
    jp: "内装",
    options: ["キズ", "コゲ", "穴", "汚れ", "破れ"],
    picked: 3,
  },
  windshieldCondition: {
    group: "notes",
    jp: "FW",
    options: ["キズ", "飛石", "ヒビ割", "リペア跡"],
    picked: 1,
  },
  wheelMirrorCondition: {
    group: "notes",
    jp: "ホイルCP・ドアミラー",
    options: ["キズ", "ワレ", "小キズ有", "小凹有", "補修要"],
    picked: 2,
  },
  partsCondition: { group: "notes", jp: "各部の状態" },
  damageLegend: { group: "notes", jp: "記号" },
  meterHistory: { group: "notes", jp: "メーター歴" },
  nox: { group: "notes", jp: "NOx・PM" },

  // ── Diagram ──────────────────────────────────────────────────────────────
  damageDiagram: { group: "diagram", jp: "車両展開図" },
} satisfies Record<string, FieldMeta>;

export type FieldKey = keyof typeof FIELD_META;

/** `FIELD_META` widened, for reading the optional members off any key. */
export function fieldMeta(key: FieldKey): FieldMeta {
  return FIELD_META[key];
}
