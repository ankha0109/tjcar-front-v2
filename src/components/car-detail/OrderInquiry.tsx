"use client";

import { useEffect, useState } from "react";
import { Drawer, Modal } from "antd";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { CONTACT_PHONES, FACEBOOK_URL, MESSENGER_URL } from "@/lib/contact";

/**
 * The `lg` breakpoint. Deliberately the same 1024px the detail page's sticky
 * bar uses for `lg:hidden`, so the bar and this sheet swap shape together —
 * the device cookie is the wrong signal here, because this is not UI that
 * duplicates the mobile header.
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

type Props = {
  /**
   * Car title. Goes into the Messenger message beside the listing URL so the
   * page can see which car it is without following the link — v1 sent only
   * the URL (`~/Projects/Front/tjcar-front/src/app/korea/[id]/page.js`).
   */
  carTitle: string;
  /**
   * `block` — full-width CTA under the landed-price breakdown.
   * `bar` — compact CTA inside the mobile sticky bar.
   */
  variant?: "block" | "bar";
};

/**
 * "Захиалга өгөх" — the CTA plus the contact sheet it opens: Messenger with the
 * car prefilled, the Facebook page, and the support lines.
 *
 * A modal on desktop, a bottom sheet on phones. One body, two containers.
 */
export default function OrderInquiry({ carTitle, variant = "block" }: Props) {
  const t = useTranslations("carDetail.order");
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const isDesktop = useIsDesktop();

  // The listing URL is read at open time rather than built on the server: it
  // already carries the right locale prefix, and needs no site-URL env var.
  const handleOpen = () => {
    setPageUrl(window.location.href);
    setOpen(true);
  };
  const close = () => setOpen(false);

  const body = (
    <Channels carTitle={carTitle} pageUrl={pageUrl} onPick={close} />
  );

  return (
    <>
      <BrandButton
        size={variant === "bar" ? "middle" : "large"}
        className={
          variant === "bar"
            ? "h-10 shrink-0 rounded-xl px-4 text-[13px] font-semibold"
            : "h-11 w-full rounded-xl text-[13px] font-semibold"
        }
        onClick={handleOpen}
      >
        {t("cta")}
      </BrandButton>

      {isDesktop ? (
        <Modal
          title={t("cta")}
          open={open}
          onCancel={close}
          footer={null}
          centered
          width={440}
        >
          {body}
        </Modal>
      ) : (
        <Drawer
          title={t("cta")}
          placement="bottom"
          size="auto"
          open={open}
          onClose={close}
          styles={{
            // Bottom inset so the last row clears the home indicator; the
            // detail page's own sticky bar pads the same way.
            body: {
              paddingTop: 4,
              paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            },
          }}
        >
          {body}
        </Drawer>
      )}
    </>
  );
}

/** `true` once mounted on a viewport at or above {@link DESKTOP_QUERY}. */
function useIsDesktop() {
  // Starts `false` so server and first client render agree. Nothing is visible
  // either way — both containers render their body only once opened.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}

function Channels({
  carTitle,
  pageUrl,
  onPick,
}: {
  carTitle: string;
  pageUrl: string;
  onPick: () => void;
}) {
  const t = useTranslations("carDetail.order");
  const messengerHref = `${MESSENGER_URL}?text=${encodeURIComponent(
    `${carTitle} — ${pageUrl}`,
  )}`;

  return (
    <div>
      <p className="text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        {t("intro")}
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <ChannelRow
          href={messengerHref}
          external
          onPick={onPick}
          icon={<MessengerIcon />}
          iconClass="bg-linear-to-br from-[#0695FF] to-[#A334FA]"
          label={t("messengerLabel")}
          hint={t("messengerHint")}
        />
        <ChannelRow
          href={FACEBOOK_URL}
          external
          onPick={onPick}
          icon={<FacebookIcon />}
          iconClass="bg-[#1877F2]"
          label={t("facebookLabel")}
          hint={t("facebookHint")}
        />
        {CONTACT_PHONES.map((phone) => (
          <ChannelRow
            key={phone.raw}
            href={`tel:${phone.raw}`}
            onPick={onPick}
            icon={<PhoneIcon />}
            iconClass="bg-[#22C55E]"
            label={phone.display}
            hint={t("phoneHint")}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One channel. The colour class sits on the anchor itself — antd's reset paints
 * a bare `<a>` blue and beats an inherited text colour.
 */
function ChannelRow({
  href,
  external,
  onPick,
  icon,
  iconClass,
  label,
  hint,
}: {
  href: string;
  external?: boolean;
  onPick: () => void;
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : undefined)}
      onClick={onPick}
      className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 text-neutral-900 transition-colors pointer-fine:hover:border-neutral-300 pointer-fine:hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:pointer-fine:hover:border-neutral-700"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="block text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {hint}
        </span>
      </span>
    </a>
  );
}

/**
 * Messenger's bolt on its own — the speech bubble is the coloured circle behind
 * it. The transform recentres the bolt (its own centre is 11.96,11.53) on the
 * 24-box and scales it up, since alone it reads small inside the circle.
 */
function MessengerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5.5 w-5.5"
      aria-hidden
    >
      <path
        transform="translate(-3.55 -2.99) scale(1.3)"
        d="M13.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5.5 w-5.5"
      aria-hidden
    >
      <path d="M15.12 5.32H17V2.14A26.11 26.11 0 0 0 14.26 2C11.54 2 9.68 3.66 9.68 6.7v2.62H6.61v3.56h3.07V22h3.68v-9.12h3.06l.46-3.56h-3.52V7.05c0-1.05.29-1.73 1.76-1.73Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
