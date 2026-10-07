import type { FieldKey } from "../fields";
import type { FieldText } from "../types";
import { en } from "./en";
import { mn } from "./mn";
import { ru } from "./ru";

const TEXT: Record<string, Record<FieldKey, FieldText>> = { mn, en, ru };

/** The field dictionary for a locale; anything unknown reads the default, `mn`. */
export function getFieldText(locale: string): Record<FieldKey, FieldText> {
  return TEXT[locale] ?? mn;
}
