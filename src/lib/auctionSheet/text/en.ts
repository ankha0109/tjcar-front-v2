import type { FieldKey } from "../fields";
import type { FieldText } from "../types";

/** Auction sheet fields in English. */
export const en: Record<FieldKey, FieldText> = {
  // ── Grade ────────────────────────────────────────────────────────────────
  overallGrade: {
    title: "Overall grade",
    short: "Grade",
    description:
      "The inspector's overall score for the car. S, 6 and 5 are near new, 4.5 and 4 good, 3.5 and 3 average, 2 and 1 poor. R or RA means the car was in an accident and a structural part was repaired.",
  },
  interiorGrade: {
    title: "Interior grade",
    short: "Interior",
    description:
      "How clean the cabin is, as a letter. A is almost new, B lightly used, C has stains or wear, D and E mean tears, burns or heavy dirt.",
  },
  exteriorGrade: {
    title: "Exterior grade",
    short: "Exterior",
    description:
      "The bodywork, as a letter. A is almost unmarked, B has small scratches, C visible scratches and dents, D and E heavy damage.",
  },

  // ── Identity ─────────────────────────────────────────────────────────────
  lotNumber: {
    title: "Lot number",
    short: "Lot No.",
    description:
      "The number the car is given for that day's auction. It is how the car is found and how a bid is placed on it.",
  },
  carName: {
    title: "Car name",
    short: "Name",
    description: "The model name. The maker is usually left out.",
  },
  grade: {
    title: "Trim grade",
    short: "Trim",
    description:
      "The version of the model. Two cars of the same model can differ a lot in equipment and price depending on the trim.",
  },
  modelCode: {
    title: "Model code",
    short: "Code",
    description:
      "The factory model code. The part before the hyphen is the emissions standard, the part after it the chassis code — the most reliable thing to search parts by.",
  },
  bodyType: {
    title: "Body type",
    short: "Body",
    description:
      "Body style and number of doors. 4D is a sedan, 5D a hatchback or wagon, 2D a coupé.",
  },
  doors: {
    title: "Doors",
    description: "Counts the tailgate: 5D is a five-door.",
  },
  displacement: {
    title: "Engine displacement",
    short: "Displacement",
    description:
      "Engine size in cc. The excise tax due in Mongolia depends directly on it.",
  },
  driveType: {
    title: "Drivetrain",
    short: "Drive",
    description: "Two-wheel (2WD) or four-wheel drive (4WD); one is circled. Some sheets write FF (front-wheel) or FR (rear-wheel) instead.",
  },
  firstRegistration: {
    title: "First registration",
    short: "First reg.",
    description:
      "The year and month the car was first plated in Japan, written in the Japanese era calendar: add 1988 to a Heisei (H) year and 2018 to a Reiwa (R) year. H27 is 2015.",
  },
  modelYear: {
    title: "Model year",
    description:
      "The year of manufacture of a car imported into Japan. Usually left blank for cars built in Japan.",
  },
  vehicleHistory: {
    title: "Usage history",
    short: "Usage",
    description:
      "What the car was used for: 自家用 is private use, レンタ a rental, 営業 a taxi or service vehicle, 事業 a company car. Blank means private use.",
  },
  seats: {
    title: "Seats",
    description: "Registered seating capacity, driver included.",
  },
  payload: {
    title: "Payload",
    description:
      "Maximum load. Only filled in for trucks and commercial vehicles.",
  },
  dimensions: {
    title: "Dimensions",
    short: "Size",
    description:
      "Length, width and height in centimetres. Shipping cost and whether the car fits a container are worked out from these.",
  },
  length: {
    title: "Length",
    description: "Overall length in centimetres.",
  },
  width: {
    title: "Width",
    description: "Overall width in centimetres.",
  },
  height: {
    title: "Height",
    description: "Overall height in centimetres.",
  },
  steering: {
    title: "Steering side",
    short: "Steering",
    description: "Right-hand (右) or left-hand (左) drive; one is circled.",
  },
  importHistory: {
    title: "Import history",
    short: "Import",
    description:
      "A block for cars built abroad and brought into Japan. Blank on a Japanese car.",
  },
  importType: {
    title: "Import channel",
    short: "Channel",
    description:
      "Who brought a foreign car into Japan: ディーラー is the official dealer, 並行 a parallel import by a private party or trader.",
  },
  seller: {
    title: "Seller",
    description: "The member that entered the car into the auction, or its class.",
  },
  venue: {
    title: "Auction venue",
    short: "Venue",
    description:
      "Which of the house's halls is selling the car. The box has no printed label; the hall's name is simply written in.",
  },
  userPurchase: {
    title: "Bought from the owner",
    short: "From owner",
    description:
      "Marked when the seller bought the car directly from its previous owner, so it has not passed between dealers.",
  },

  // ── Spec ─────────────────────────────────────────────────────────────────
  mileage: {
    title: "Mileage",
    description:
      "The odometer reading in kilometres — miles if «マイル» is circled. A ＊ or $ beside it means the odometer was replaced; «不明» means the true mileage is unknown.",
  },
  transmission: {
    title: "Transmission",
    short: "Shift",
    description:
      "Gearbox type. FAT is a floor-shift automatic, CAT a column-shift automatic, F5 and F6 five- and six-speed manuals, CVT a continuously variable automatic.",
  },
  airConditioner: {
    title: "Air conditioning",
    short: "A/C",
    description:
      "AC is manual air conditioning, AAC automatic climate control, WAC dual front and rear units.",
  },
  fuel: {
    title: "Fuel",
    description:
      "ガソリン is petrol, 軽油 diesel. Some sheets shorten them to G and D; hybrids are marked HV and electric cars EV.",
  },
  color: {
    title: "Exterior colour",
    short: "Colour",
    description:
      "The current colour. An entry under «色替» means the car has been resprayed in a different colour, and «元色» is the factory original.",
  },
  repaint: {
    title: "Colour change",
    short: "Resprayed",
    description:
      "Marked when the whole car has been repainted in a colour other than the factory one.",
  },
  colorCode: {
    title: "Colour code",
    description:
      "The factory paint code. Used to match paint and to check the car is still in its original colour.",
  },
  interiorColor: {
    title: "Interior colour",
    short: "Interior col.",
    description: "The main colour of the seats and trim.",
  },

  // ── Equipment ────────────────────────────────────────────────────────────
  equipment: {
    title: "Factory equipment",
    short: "Equipment",
    description:
      "A printed list of factory-fitted options. Whatever the car has is circled.",
  },
  eqSunroof: {
    title: "Sunroof",
    description: "SR. Circled when the car has a sunroof.",
  },
  eqAlloyWheels: {
    title: "Alloy wheels",
    short: "Alloys",
    description: "AW. «純AW» means the original factory alloy wheels.",
  },
  eqPowerSteering: {
    title: "Power steering",
    short: "P/S",
    description: "PS. Hydraulic or electric power steering.",
  },
  eqPowerWindows: {
    title: "Power windows",
    short: "P/W",
    description: "PW. Electrically operated windows.",
  },
  eqLeather: {
    title: "Leather seats",
    short: "Leather",
    description: "革 or カワ. Circled when the seats are leather.",
  },
  eqTv: {
    title: "TV",
    description: "A factory screen with a TV tuner.",
  },
  eqNavi: {
    title: "Navigation",
    short: "Navi",
    description:
      "ナビ. Factory satellite navigation. It carries Japanese maps, so it is rarely usable in Mongolia.",
  },
  eqAirbag: {
    title: "Airbag",
    description: "エアB. The car has airbags.",
  },
  eqAbs: {
    title: "ABS",
    description: "Anti-lock braking system.",
  },
  eqAudio: {
    title: "Audio",
    description:
      "The factory stereo. Some sheets mark «無し» when it is missing and «穴» when only the empty slot is left.",
  },
  eqAero: {
    title: "Body kit",
    short: "Aero",
    description: "エアロ. Bumpers, side skirts, a spoiler — an exterior styling kit.",
  },
  eqSpareTire: {
    title: "Spare tyre",
    short: "Spare",
    description: "Marked to show whether the spare tyre is present.",
  },
  eqWheelCaps: {
    title: "Wheel caps",
    short: "Caps",
    description: "Whether the steel wheels' covers are all there.",
  },
  eqMirrors: {
    title: "Power-folding mirrors",
    short: "Mirrors",
    description: "Door mirrors that fold at the press of a button.",
  },
  eqTuner: {
    title: "Tuner",
    description: "チューナー. A TV or radio broadcast tuner is fitted.",
  },
  tires: {
    title: "Tyre type",
    short: "Tyres",
    description: "«スタッドレス» is circled when the car is on studless winter tyres.",
  },

  // ── Documents ────────────────────────────────────────────────────────────
  shaken: {
    title: "Inspection valid until",
    short: "Inspection",
    description:
      "The year and month Japan's road inspection (shaken) runs out. If time is left, the car is still plated and on the road in Japan. It has no bearing on importing it to Mongolia.",
  },
  registrationNumber: {
    title: "Registration number",
    short: "Reg. No.",
    description:
      "The Japanese number plate. Blank means the car has already been deregistered.",
  },
  chassisNumber: {
    title: "Chassis number",
    short: "Chassis",
    description:
      "The number stamped on the body. A Japanese car has no 17-digit VIN — it reads model code, hyphen, serial. Check it against the documents.",
  },
  serialNumber: {
    title: "Serial number",
    short: "Serial No.",
    description:
      "An extra number recorded alongside the chassis number. Mostly filled in for imported cars and blank on Japanese ones.",
  },
  recycleFee: {
    title: "Recycling deposit",
    short: "Recycle fee",
    description:
      "An amount prepaid on every car under Japanese law, in yen. The buyer pays it on top of the hammer price.",
  },
  nameChangeDeadline: {
    title: "Name change deadline",
    short: "Name change",
    description:
      "The last month and day to transfer a plated car into the new owner's name. It matters little for a car going to export.",
  },
  serviceBook: {
    title: "Service book",
    description:
      "Whether the warranty and service booklet is present (有). When it is, it is one piece of evidence that the mileage is genuine.",
  },
  manual: {
    title: "Owner's manual",
    short: "Manual",
    description: "Whether the factory handbook comes with the car.",
  },
  documentsLater: {
    title: "Items sent later",
    short: "Sent later",
    description:
      "Things posted separately after the sale: the warranty booklet, manual, spare key, navigation disc.",
  },

  // ── Notes ────────────────────────────────────────────────────────────────
  salesPoints: {
    title: "Sales points",
    description:
      "Written by the seller: one owner, extra equipment and so on. Bear in mind these are the seller's words, not the inspector's findings.",
  },
  sellerNotes: {
    title: "Seller's notes",
    short: "Notes",
    description:
      "Damage, faults and shortcomings the seller declares: repaired areas, equipment that does not work.",
  },
  inspectorNotes: {
    title: "Inspector's report",
    short: "Inspector",
    description:
      "What the auction's own inspector found. The most important part of the sheet: scratches, dents, rust, a dirty interior, oil leaks and traces of repair are written here.",
  },
  officeNotes: {
    title: "Auction office notes",
    short: "Office notes",
    description:
      "Corrections and warnings added by the auction house itself, typically changes made after the sheet was printed.",
  },
  repairHistory: {
    title: "Accident repair history",
    short: "Repair history",
    description:
      "Whether the car has had an accident repair that reached its structure (有). If so, the overall grade is R or RA.",
  },
  interiorCondition: {
    title: "Interior defects",
    short: "Interior",
    description:
      "A printed checklist of cabin defects; what applies is circled: キズ scratches, コゲ burns, 穴 holes, 汚れ dirt, 破れ tears.",
  },
  windshieldCondition: {
    title: "Windscreen condition",
    short: "Windscreen",
    description:
      "Windscreen damage is circled: キズ scratches, 飛石 stone chips, ヒビ割 cracks, リペア跡 traces of repair.",
  },
  wheelMirrorCondition: {
    title: "Wheel and mirror damage",
    short: "Wheels, mirrors",
    description:
      "A printed checklist for the wheel caps and door mirrors: キズ scratch, ワレ crack, 小キズ有 small scratches, 小凹有 small dents, 補修要 needs repair. What applies is circled.",
  },
  partsCondition: {
    title: "Condition of parts",
    short: "Parts",
    description:
      "A printed grid for the steering wheel (ハンドル), seats (シート), audio, wheels (ホイル), body kit (エアロ) and door mirrors (ドアミラー); the inspector circles each part's defect.",
  },
  damageLegend: {
    title: "Mark legend",
    short: "Legend",
    description:
      "The printed key to the letters and numbers used on the damage diagram.",
  },
  meterHistory: {
    title: "Odometer history",
    short: "Odometer",
    description:
      "Whether the odometer has been replaced or repaired. If it is marked, the mileage written may not be the true one.",
  },
  nox: {
    title: "NOx・PM compliance",
    short: "NOx・PM",
    description:
      "Whether the car meets the emission limits of Japan's large cities, mostly for diesels. Irrelevant in Mongolia.",
  },

  // ── Diagram ──────────────────────────────────────────────────────────────
  damageDiagram: {
    title: "Damage diagram",
    short: "Diagram",
    description:
      "The car laid out flat from above. Every defect is marked where it is with a letter and a number: the letter is the kind (A scratch, U dent, W repair wave, S rust), the number the size (1 small, 3 large).",
  },
};
