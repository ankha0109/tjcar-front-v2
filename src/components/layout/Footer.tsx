import Link from "next/link";
import Logo from "@/components/svg/logo.svg";
import NewsletterForm from "@/components/layout/NewsletterForm";

const SOCIAL_LINKS = [
  {
    href: "https://facebook.com",
    label: "Facebook",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    href: "https://youtube.com",
    label: "YouTube",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: "https://t.me/tjcar",
    label: "Telegram",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
    ),
  },
] as const;

const ContactIcon = ({
  type,
}: {
  type: "phone" | "mail" | "pin" | "clock";
}) => {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-3.5 w-3.5 shrink-0 text-neutral-400",
  };
  if (type === "phone")
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  if (type === "mail")
    return (
      <svg {...common}>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    );
  if (type === "pin")
    return (
      <svg {...common}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
};

export default function Footer() {
  return (
    <footer className="mt-12 hidden border-t border-neutral-200 bg-white md:block">
      {/* Newsletter strip */}
      <div className="border-b border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-neutral-600 shadow-sm ring-1 ring-black/5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Шинэ мэдээ
              </span>
              <h3 className="mt-3 text-[20px] font-semibold tracking-tight text-neutral-900 sm:text-[22px]">
                Шинэ дуудлагуудыг и-мэйлээр аваарай
              </h3>
              <p className="mt-1.5 max-w-xl text-[13px] text-neutral-500">
                Япон, Солонгосын онцлох машинуудыг өдөр бүр шүүж танд хүргэнэ.
                Хэдийд ч бүртгэлээ цуцалж болно.
              </p>
            </div>
            <div className="lg:justify-self-end lg:w-full lg:max-w-md">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-4">
            <Link href="/" className="inline-flex" aria-label="TJ Car">
              <Logo className="h-10 w-auto" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">
              Япон, Солонгосоос машин захиалах, оруулах найдвартай үйлчилгээ.
              Захиалгаас хүлээн авах хүртэл бид таны хажууд.
            </p>

            <div className="mt-5">
              <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Биднийг дагах
              </p>
              <ul className="flex items-center gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="group flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-neutral-900 hover:text-white"
                    >
                      {s.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
              Машинууд
            </h4>
            <ul className="space-y-2">
              <FooterLink href="/">Япон машин</FooterLink>
              <FooterLink href="/korea">Солонгос машин</FooterLink>
              <FooterLink href="/cars">Бэлэн машин</FooterLink>
              <FooterLink href="/report">Осол аваар шалгах</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
              Үйлчилгээ
            </h4>
            <ul className="space-y-2">
              <FooterLink href="/dashboard">Хувийн кабинет</FooterLink>
              <FooterLink href="/auth/login">Нэвтрэх</FooterLink>
              <FooterLink href="/auth/register">Бүртгүүлэх</FooterLink>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2 lg:col-span-4">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
              Холбоо барих
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-500">
              <li>
                <a
                  href="tel:+97670000000"
                  className="inline-flex items-center gap-2 transition-colors hover:text-neutral-900"
                >
                  <ContactIcon type="phone" />
                  <span className="tabular-nums">+976 7000 0000</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@tjcar.mn"
                  className="inline-flex items-center gap-2 transition-colors hover:text-neutral-900"
                >
                  <ContactIcon type="mail" />
                  info@tjcar.mn
                </a>
              </li>
              <li className="inline-flex items-start gap-2">
                <ContactIcon type="pin" />
                <span>Улаанбаатар хот, Монгол улс</span>
              </li>
              <li className="inline-flex items-start gap-2">
                <ContactIcon type="clock" />
                <span>Даваа–Бямба: 09:00 – 18:00</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="text-[12px] text-neutral-500">
            &copy; {new Date().getFullYear()} TJ Car. Бүх эрх хуулиар
            хамгаалагдсан.
          </p>
          <div className="flex items-center gap-3 text-[12px] text-neutral-500">
            <Link
              href="#"
              className="transition-colors hover:text-neutral-900"
            >
              Үйлчилгээний нөхцөл
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href="#"
              className="transition-colors hover:text-neutral-900"
            >
              Нууцлалын бодлого
            </Link>
            <span className="text-neutral-300">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Систем хэвийн
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <span className="mr-0 w-0 overflow-hidden text-primary opacity-0 transition-all duration-200 group-hover:mr-1 group-hover:w-2.5 group-hover:opacity-100">
          →
        </span>
        {children}
      </Link>
    </li>
  );
}
