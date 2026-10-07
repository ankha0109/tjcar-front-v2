/**
 * What is written or circled on the sample sheets, translated.
 *
 * With labels set to the page locale, the inspector's handwriting and the
 * printed choices are translated too — line by line through this table, so one
 * entry serves every house that writes the same thing. Anything missing simply
 * stays in Japanese, as it would on the real sheet.
 *
 * Each row is `[mn, en, ru]`.
 */
const ROWS: Record<string, [string, string, string]> = {
  // ── The sample car ───────────────────────────────────────────────────────
  プリウス: ["PRIUS", "PRIUS", "PRIUS"],
  "S ツーリング": ["S Touring", "S Touring", "S Touring"],
  "プリウス S ツーリング": ["PRIUS S Touring", "PRIUS S Touring", "PRIUS S Touring"],
  "プリウス 5D S ツーリング": [
    "PRIUS 5D S Touring",
    "PRIUS 5D S Touring",
    "PRIUS 5D S Touring",
  ],
  "27年 6月": ["H27 / 6", "H27 / 6", "H27 / 6"],
  "8年 6月": ["R8 / 6", "R8 / 6", "R8 / 6"],
  "名古屋 330 さ 12-34": [
    "Нагоя 330 さ 12-34",
    "Nagoya 330 さ 12-34",
    "Нагоя 330 さ 12-34",
  ],
  "11,930円": ["¥11,930", "¥11,930", "¥11,930"],
  埼玉: ["Сайтама", "Saitama", "Сайтама"],
  自家用: ["Хувийн", "Private", "Личная"],
  レンタ: ["Түрээс", "Rental", "Прокат"],
  パール: ["Сувдан цагаан", "Pearl white", "Белый перламутр"],
  "パール 070": ["Сувдан 070", "Pearl 070", "Перламутр 070"],
  黒: ["Хар", "Black", "Чёрный"],

  // ── Equipment written out by hand ────────────────────────────────────────
  "AW PS PW ナビ TV エアB ABS": [
    "AW PS PW NAVI TV AIRBAG ABS",
    "AW PS PW NAVI TV AIRBAG ABS",
    "AW PS PW NAVI TV AIRBAG ABS",
  ],
  "PS PW ABS AW TV ナビ": [
    "PS PW ABS AW TV NAVI",
    "PS PW ABS AW TV NAVI",
    "PS PW ABS AW TV NAVI",
  ],
  "エアB AAC": ["AIRBAG AAC", "AIRBAG AAC", "AIRBAG AAC"],

  // ── Notes ────────────────────────────────────────────────────────────────
  ワンオーナー: ["Нэг эзэмшигчтэй", "One owner", "Один владелец"],
  "純正ナビ・Bカメラ・ETC": [
    "Нави, арын камер, ETC",
    "Navi, rear camera, ETC",
    "Навигация, камера, ETC",
  ],
  "スマートキー・LEDライト": [
    "Ухаалаг түлхүүр, LED гэрэл",
    "Smart key, LED lights",
    "Смарт-ключ, LED-фары",
  ],
  "フロントバンパー キズ": [
    "Урд бампер зураастай",
    "Front bumper scratched",
    "Царапины на переднем бампере",
  ],
  "シート 小スレ": [
    "Суудал бага зэрэг үрэгдсэн",
    "Seat lightly worn",
    "Сиденье слегка потёрто",
  ],
  "小キズ・小ヘコミ有": [
    "Жижиг зураас, хонхорхойтой",
    "Small scratches and dents",
    "Мелкие царапины и вмятины",
  ],
  "フロントガラス 飛石": [
    "Салхины шилэнд чулуу үсэрсэн",
    "Stone chip in the windscreen",
    "Скол на лобовом стекле",
  ],
  "内装 小ヨゴレ": [
    "Салон бага зэрэг бохир",
    "Interior slightly dirty",
    "Салон слегка загрязнён",
  ],

  // ── Documents and accessories ────────────────────────────────────────────
  "保証書・取説": ["Дэвтэр, заавар", "Booklet, manual", "Книжка, руководство"],
  "保証書・取説・スペアキー": [
    "Дэвтэр, заавар, нөөц түлхүүр",
    "Booklet, manual, spare key",
    "Книжка, руководство, ключ",
  ],
  保証書: ["Дэвтэр", "Booklet", "Книжка"],
  新車保証書: ["Баталгааны дэвтэр", "Warranty book", "Гарантийная книжка"],
  取: ["Заавар", "Manual", "Рук-во"],
  取説: ["Заавар", "Manual", "Руководство"],
  取扱説明書: ["Заавар", "Manual", "Руководство"],
  ナビ取説: ["Навигийн заавар", "Navi manual", "Рук-во нави"],
  "ロム/SD": ["Диск/SD", "ROM/SD", "Диск/SD"],
  リモコン: ["Пульт", "Remote", "Пульт"],
  ナンバー: ["Дугаар", "Plate", "Номер"],
  スペアキー: ["Нөөц түлхүүр", "Spare key", "Запасной ключ"],
  キーレス: ["Алсын түлхүүр", "Keyless", "Брелок"],
  スマートキー: ["Ухаалаг түлхүүр", "Smart key", "Смарт-ключ"],

  // ── Printed choices ──────────────────────────────────────────────────────
  有: ["Байгаа", "Yes", "Есть"],
  無: ["Байхгүй", "No", "Нет"],
  無し: ["Байхгүй", "None", "Нет"],
  右: ["Баруун", "Right", "Правый"],
  左: ["Зүүн", "Left", "Левый"],
  右H: ["Баруун", "Right", "Правый"],
  左H: ["Зүүн", "Left", "Левый"],
  右ハンドル: ["Баруун жолоо", "Right-hand", "Правый руль"],
  左ハンドル: ["Зүүн жолоо", "Left-hand", "Левый руль"],
  ガソリン: ["Бензин", "Petrol", "Бензин"],
  軽油: ["Дизель", "Diesel", "Дизель"],
  電気: ["Цахилгаан", "Electric", "Электро"],
  その他: ["Бусад", "Other", "Другое"],
  ディーラー: ["Дилер", "Dealer", "Дилер"],
  ディラ: ["Дилер", "Dealer", "Дилер"],
  D車: ["Дилер", "Dealer", "Дилер"],
  並行: ["Зэрэгцээ", "Parallel", "Параллельный"],
  並: ["Зэрэгцээ", "Parallel", "Паралл."],
  フロア: ["Шалны", "Floor", "Напольный"],
  コラム: ["Жолооны дэргэд", "Column", "На колонке"],
  ダッシュ: ["Самбар дээр", "Dash", "На панели"],
  スタッドレス: ["Өвлийн", "Winter", "Зимние"],
  交換車: ["Сольсон", "Replaced", "Заменён"],
  改ざん車: ["Өөрчилсөн", "Tampered", "Скручен"],
  不明車: ["Тодорхойгүй", "Unknown", "Неизвестен"],
  適合: ["Хангасан", "Compliant", "Соответствует"],
  不適合: ["Хангаагүй", "Non-compliant", "Не соответствует"],

  // ── Defects ──────────────────────────────────────────────────────────────
  キズ: ["Зураас", "Scratch", "Царапина"],
  スレ: ["Үрэлт", "Scuff", "Потёртость"],
  汚れ: ["Бохир", "Dirt", "Грязь"],
  シミ: ["Толбо", "Stain", "Пятно"],
  コゲ: ["Түлэгдэл", "Burn", "Прожог"],
  穴: ["Нүх", "Hole", "Дыра"],
  キレ: ["Зүсэгдсэн", "Cut", "Порез"],
  破れ: ["Урагдсан", "Tear", "Разрыв"],
  割れ: ["Хагарсан", "Crack", "Трещина"],
  ワレ: ["Хагарсан", "Crack", "Трещина"],
  ヒビ: ["Хагарал", "Crack", "Трещина"],
  ひび割: ["Хагарал", "Crack", "Трещина"],
  ヒビ割: ["Хагарал", "Crack", "Трещина"],
  飛石: ["Чулуу", "Chip", "Скол"],
  リペア跡: ["Засвар", "Repair", "Ремонт"],
  X要: ["Солих", "Replace", "Замена"],
  X要す: ["Солих", "Replace", "Замена"],
  小キズ有: ["Жижиг зураас", "Small scratch", "Мелкие царапины"],
  小凹有: ["Жижиг хонхор", "Small dent", "Мелкие вмятины"],
  補修要: ["Засвар хэрэгтэй", "Needs repair", "Нужен ремонт"],
};

const COLUMN: Record<string, number> = { mn: 0, en: 1, ru: 2 };

/** Japanese → the page locale, for everything written on the sample sheets. */
export function getGlossary(locale: string): Record<string, string> {
  const column = COLUMN[locale] ?? 0;
  return Object.fromEntries(
    Object.entries(ROWS).map(([jp, row]) => [jp, row[column]]),
  );
}
