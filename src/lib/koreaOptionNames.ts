// Locale display names for the Encar standard-option vocabulary. The backend
// normalizes the Korean catalog to canonical English strings (see
// App\Services\Encar\EncarOptionNames), so those English names are the lookup
// keys here; mn/ru render from this table and any unmapped name (or the en
// locale) falls back to the backend string. A dictionary module instead of
// next-intl messages keeps the 70-entry vocabulary out of the message files
// and makes the fallback explicit — no missing-key warnings.

type LocalizedName = { mn: string; ru: string };

const CATEGORIES: Record<string, LocalizedName> = {
  "Exterior/Interior": { mn: "Гадна/Салон", ru: "Экстерьер/салон" },
  Safety: { mn: "Аюулгүй байдал", ru: "Безопасность" },
  "Convenience/Multimedia": {
    mn: "Тав тух/Мультимедиа",
    ru: "Комфорт/мультимедиа",
  },
  Seats: { mn: "Суудал", ru: "Сиденья" },
};

const OPTIONS: Record<string, LocalizedName> = {
  // Exterior/Interior
  Sunroof: { mn: "Люк", ru: "Люк" },
  Headlamp: { mn: "Урд гэрэл", ru: "Фары" },
  "Headlamp (HID)": { mn: "Урд гэрэл (HID)", ru: "Фары (HID)" },
  "Headlamp (LED)": { mn: "Урд гэрэл (LED)", ru: "Фары (LED)" },
  "Power tailgate": {
    mn: "Хойд хаалга сорно",
    ru: "Электропривод багажника",
  },
  "Soft-close doors": {
    mn: "Хаалга сорно",
    ru: "Доводчики дверей",
  },
  "Power-folding side mirrors": {
    mn: "Автомат толь эвхдэг",
    ru: "Электроскладывание зеркал",
  },
  "Alloy wheels": { mn: "Хөнгөн цагаан обуд", ru: "Легкосплавные диски" },
  "Roof rack": { mn: "Дээврийн рейлинг", ru: "Рейлинги на крыше" },
  "Heated steering wheel": { mn: "Халдаг жолооны хүрд", ru: "Обогрев руля" },
  "Power-adjustable steering wheel": {
    mn: "Автомат тохируулгатай жолооны хүрд",
    ru: "Электрорегулировка руля",
  },
  "Paddle shifters": { mn: "Паддл шифт", ru: "Подрулевые лепестки" },
  "Steering wheel controls": {
    mn: "Жолооны хүрдний удирдлага",
    ru: "Кнопки на руле",
  },
  "Auto-dimming mirror (ECM)": {
    mn: "Автомат харанхуйлдаг толь (ECM)",
    ru: "Зеркало с автозатемнением (ECM)",
  },
  "Hi-pass toll system": {
    mn: "Hi-pass төлбөрийн систем",
    ru: "Система оплаты Hi-pass",
  },
  "Power door locks": { mn: "Төв түгжээ", ru: "Центральный замок" },
  "Power steering": { mn: "Жолооны усилитель", ru: "Усилитель руля" },
  "Power windows": { mn: "Автомат цонх", ru: "Электростеклоподъёмники" },
  // Safety
  Airbags: { mn: "Аюулгүйн дэр", ru: "Подушки безопасности" },
  "Airbag (driver)": { mn: "Аюулгүйн дэр (жолооч)", ru: "Подушка (водитель)" },
  "Airbag (passenger)": {
    mn: "Аюулгүйн дэр (суугч)",
    ru: "Подушка (пассажир)",
  },
  "Airbag (side)": { mn: "Аюулгүйн дэр (хажуу)", ru: "Подушки (боковые)" },
  "Airbag (curtain)": { mn: "Аюулгүйн дэр (хөшиг)", ru: "Подушки (шторки)" },
  "Anti-lock brakes (ABS)": { mn: "ABS тоормос", ru: "ABS" },
  "Traction control (TCS)": {
    mn: "Шарвалтаас хамгаалах (TCS)",
    ru: "Антипробуксовка (TCS)",
  },
  "Stability control (ESC)": {
    mn: "Тогтворжуулах систем (ESC)",
    ru: "Система стабилизации (ESC)",
  },
  "Tire pressure monitoring (TPMS)": {
    mn: "Дугуйн даралт мэдрэгч (TPMS)",
    ru: "Датчики давления шин (TPMS)",
  },
  "Lane departure warning (LDWS)": {
    mn: "Эгнээ гарах анхааруулга (LDWS)",
    ru: "Контроль полосы (LDWS)",
  },
  "Electronic suspension (ECS)": {
    mn: "Электрон подвеска (ECS)",
    ru: "Электронная подвеска (ECS)",
  },
  "Parking sensors": { mn: "Зогсоолын мэдрэгч", ru: "Парктроники" },
  "Parking sensors (front)": {
    mn: "Зогсоолын мэдрэгч (урд)",
    ru: "Парктроники (перед)",
  },
  "Parking sensors (rear)": {
    mn: "Зогсоолын мэдрэгч (хойно)",
    ru: "Парктроники (зад)",
  },
  "Blind-spot warning": {
    mn: "Сохор бүсийн анхааруулга",
    ru: "Контроль слепых зон",
  },
  "Rear camera": { mn: "Арын камер", ru: "Камера заднего вида" },
  "360° around view": { mn: "360° камер", ru: "Камеры 360°" },
  // Convenience/Multimedia
  "Cruise control": { mn: "Круиз контрол", ru: "Круиз-контроль" },
  "Cruise control (standard)": {
    mn: "Круиз контрол (энгийн)",
    ru: "Круиз-контроль (обычный)",
  },
  "Adaptive cruise control": {
    mn: "Адаптив круиз контрол",
    ru: "Адаптивный круиз-контроль",
  },
  "Head-up display (HUD)": {
    mn: "HUD дэлгэц",
    ru: "Проекционный дисплей (HUD)",
  },
  "Electronic parking brake (EPB)": {
    mn: "Электрон гар тоормос (EPB)",
    ru: "Электронный ручник (EPB)",
  },
  "Automatic climate control": {
    mn: "Автомат агааржуулагч",
    ru: "Климат-контроль",
  },
  "Smart key": { mn: "Смарт түлхүүр", ru: "Смарт-ключ" },
  "Remote central locking": {
    mn: "Алсын удирдлагатай түгжээ",
    ru: "ДУ центрального замка",
  },
  "Rain sensor": { mn: "Борооны мэдрэгч", ru: "Датчик дождя" },
  "Auto headlights": { mn: "Автомат гэрэл", ru: "Автоматический свет" },
  "Curtains/blinds": { mn: "Хөшиг", ru: "Шторки" },
  "Curtains/blinds (rear seats)": {
    mn: "Хөшиг (хойд суудал)",
    ru: "Шторки (задние сиденья)",
  },
  "Curtains/blinds (rear window)": {
    mn: "Хөшиг (хойд цонх)",
    ru: "Шторка (заднее стекло)",
  },
  Navigation: { mn: "Навигац", ru: "Навигация" },
  "Front AV monitor": { mn: "Урд AV дэлгэц", ru: "Передний AV-монитор" },
  "Rear AV monitor": { mn: "Хойд AV дэлгэц", ru: "Задний AV-монитор" },
  Bluetooth: { mn: "Bluetooth", ru: "Bluetooth" },
  "CD player": { mn: "CD тоглуулагч", ru: "CD-плеер" },
  "USB port": { mn: "USB залгуур", ru: "USB-разъём" },
  "AUX port": { mn: "AUX залгуур", ru: "AUX-разъём" },
  // Seats
  "Leather seats": { mn: "Арьсан суудал", ru: "Кожаные сиденья" },
  "Power seats": { mn: "Автомат суудал", ru: "Электросиденья" },
  "Power seat (driver)": {
    mn: "Автомат суудал (жолооч)",
    ru: "Электросиденье (водитель)",
  },
  "Power seat (passenger)": {
    mn: "Автомат суудал (суугч)",
    ru: "Электросиденье (пассажир)",
  },
  "Power seats (rear)": {
    mn: "Автомат суудал (хойно)",
    ru: "Электросиденья (зад)",
  },
  "Heated seats": { mn: "Халдаг суудал", ru: "Подогрев сидений" },
  "Heated seats (front)": {
    mn: "Халдаг суудал (урд)",
    ru: "Подогрев (передние)",
  },
  "Heated seats (rear)": {
    mn: "Халдаг суудал (хойно)",
    ru: "Подогрев (задние)",
  },
  "Memory seat": { mn: "Санах ойтой суудал", ru: "Память сидений" },
  "Memory seat (driver)": {
    mn: "Санах ойтой суудал (жолооч)",
    ru: "Память (водитель)",
  },
  "Memory seat (passenger)": {
    mn: "Санах ойтой суудал (суугч)",
    ru: "Память (пассажир)",
  },
  "Ventilated seats": {
    mn: "Агааржуулалттай суудал",
    ru: "Вентиляция сидений",
  },
  "Ventilated seat (driver)": {
    mn: "Агааржуулалттай суудал (жолооч)",
    ru: "Вентиляция (водитель)",
  },
  "Ventilated seat (passenger)": {
    mn: "Агааржуулалттай суудал (суугч)",
    ru: "Вентиляция (пассажир)",
  },
  "Ventilated seats (rear)": {
    mn: "Агааржуулалттай суудал (хойно)",
    ru: "Вентиляция (задние)",
  },
  "Massage seats": { mn: "Массажтай суудал", ru: "Массаж сидений" },
};

function pick(
  table: Record<string, LocalizedName>,
  name: string,
  locale: string,
): string {
  const entry = table[name];
  if (!entry) return name;
  if (locale === "mn") return entry.mn;
  if (locale === "ru") return entry.ru;
  return name;
}

export function localizeKoreaOptionCategory(
  category: string,
  locale: string,
): string {
  return pick(CATEGORIES, category, locale);
}

export function localizeKoreaOptionName(name: string, locale: string): string {
  return pick(OPTIONS, name, locale);
}
