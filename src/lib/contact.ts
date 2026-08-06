/** Support line. Two renderings of one number — keep them in step. */
export const CONTACT_PHONE_RAW = "+97675115888";
export const CONTACT_PHONE_DISPLAY = "+976 7511-5888";

/**
 * Every published support number. `raw` dials, `display` prints. The header
 * and drawer show only the first; the garage card and the contact page show
 * all three. Same numbers in every locale, so they are data, not translations.
 */
export const CONTACT_PHONES = [
  { raw: "+97675115888", display: "7511-5888" },
  { raw: "+97686045888", display: "8604-5888" },
  { raw: "+97683045888", display: "8304-5888" },
] as const;

export const CONTACT_EMAIL = "info@tjcar.mn";

export const MESSENGER_URL = "https://m.me/tjcar.llc";
export const FACEBOOK_URL = "https://www.facebook.com/tjcar.llc";
export const INSTAGRAM_URL = "https://www.instagram.com/tjcar.llc";

/** Office pin. The coordinates also feed the contact page's structured data. */
export const OFFICE_LAT = 47.91118;
export const OFFICE_LNG = 106.891904;

/**
 * Google's own embed form for the `TJ Car LLC` place, lifted verbatim from the
 * v1 site (`~/Projects/Front/tjcar-front/src/app/contact/page.js`). The `pb=`
 * blob is opaque and position-sensitive — copy it, never hand-edit it.
 */
export const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10697.210837873457!2d106.891904!3d47.91118!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5d96935a39f75b61%3A0x3f6caa887cf1b78b!2sTJ%20Car%20LLC!5e0!3m2!1sen!2sus!4v1714967435809!5m2!1sen!2sus";

/** "Open in Google Maps" target — coordinates, so it works without a place id. */
export const MAP_PLACE_URL =
  "https://www.google.com/maps/search/?api=1&query=47.91118%2C106.891904";
