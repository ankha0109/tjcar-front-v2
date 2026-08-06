import { getTranslations } from "next-intl/server";
import {
  CONTACT_EMAIL,
  CONTACT_PHONES,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  MESSENGER_URL,
} from "@/lib/contact";

const CARD =
  "rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";

/**
 * The three ways to reach the company, then the office facts underneath.
 * Messenger and email are whole-card anchors; the phone card is not, because
 * three numbers cannot share one href.
 */
export default async function ContactChannels() {
  const t = await getTranslations("contact");

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t("channels.heading")}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className={CARD}>
          <CardHead
            icon={<PhoneIcon />}
            tone="emerald"
            label={t("channels.phone.label")}
            hint={t("channels.phone.hint")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CONTACT_PHONES.map((phone) => (
              <a
                key={phone.raw}
                href={`tel:${phone.raw}`}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-[13px] font-semibold text-neutral-900 transition-colors pointer-fine:hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100"
              >
                {phone.display}
              </a>
            ))}
          </div>
        </div>

        <a
          href={MESSENGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CARD} block text-neutral-900 transition-colors pointer-fine:hover:border-neutral-300 dark:text-neutral-100 dark:pointer-fine:hover:border-neutral-700`}
        >
          <CardHead
            icon={<MessageIcon />}
            tone="sky"
            label={t("channels.messenger.label")}
            hint={t("channels.messenger.hint")}
          />
          <span className="mt-3 block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            m.me/tjcar.llc
          </span>
        </a>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className={`${CARD} block text-neutral-900 transition-colors pointer-fine:hover:border-neutral-300 dark:text-neutral-100 dark:pointer-fine:hover:border-neutral-700`}
        >
          <CardHead
            icon={<MailIcon />}
            tone="amber"
            label={t("channels.email.label")}
            hint={t("channels.email.hint")}
          />
          <span className="mt-3 block break-all text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            {CONTACT_EMAIL}
          </span>
        </a>
      </div>

      <section className={`${CARD} mt-3 p-5`}>
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("office.heading")}
        </h2>

        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {t("office.addressLabel")}
            </dt>
            <dd className="mt-1.5 text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {t("office.address")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {t("office.hoursLabel")}
            </dt>
            <dd className="mt-1.5 text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              <div>{t("office.hours.weekdays")}</div>
              <div>{t("office.hours.saturday")}</div>
              <div className="text-neutral-400 dark:text-neutral-500">
                {t("office.hours.sunday")}
              </div>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <span className="text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
            {t("office.socialLabel")}
          </span>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-neutral-700 underline-offset-4 pointer-fine:hover:underline dark:text-neutral-300"
          >
            Facebook
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-neutral-700 underline-offset-4 pointer-fine:hover:underline dark:text-neutral-300"
          >
            Instagram
          </a>
        </div>
      </section>
    </div>
  );
}

const TONES = {
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
} as const;

function CardHead({
  icon,
  tone,
  label,
  hint,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      </div>
    </div>
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MailIcon() {
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
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
