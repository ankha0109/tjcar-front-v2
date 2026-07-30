import { getTranslations } from "next-intl/server";

/**
 * In-stock cars are sold over the phone, so this card takes the place the bid
 * panel holds on an auction lot. Same numbers as the header/footer; kept here as
 * data rather than translations because they are identical in every locale.
 */
const PHONES = [
  { raw: "+97675115888", display: "7511-5888" },
  { raw: "+97686045888", display: "8604-5888" },
  { raw: "+97683045888", display: "8304-5888" },
];

const MESSENGER_URL = "https://m.me/tjcar.llc";

export default async function GarageContactCard() {
  const t = await getTranslations("garage.contact");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <PhoneIcon />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PHONES.map((phone) => (
          <a
            key={phone.raw}
            href={`tel:${phone.raw}`}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-[13px] font-semibold text-neutral-900 transition-colors pointer-fine:hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100"
          >
            {phone.display}
          </a>
        ))}
      </div>

      <a
        href={MESSENGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-[13px] font-semibold text-white transition-colors pointer-fine:hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
      >
        <MessageIcon />
        {t("messenger")}
      </a>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
