"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Form, Input, App } from "antd";
import AuthImagePanel from "@/components/pages/auth/AuthImagePanel";
import {
  ArrowIcon,
  LockIcon,
  PhoneIcon,
  SpinnerIcon,
} from "@/components/pages/auth/authIcons";

type LoginFormValues = {
  phone: string;
  password: string;
};

type Props = {
  /**
   * Whether to render the photo half. False on phones — see the note in
   * `auth/login/page.tsx`; `lg:hidden` alone would still fetch the image.
   */
  withImagePanel: boolean;
};

const LoginFormContent = ({ withImagePanel }: Props) => {
  const t = useTranslations("auth.login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        phone: values.phone,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        message.error(t("errorInvalid"));
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/";
        router.push(callbackUrl);
      }
    } catch (error) {
      console.log("Login error:", error);
      message.error(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Below `lg` the login is a full screen: no card, no padding, no aurora —
    // the form fills whatever height the shell leaves it. The card chrome only
    // switches on at `lg`, where the image panel appears next to it.
    <div className="relative flex flex-1 flex-col overflow-hidden lg:items-center lg:justify-center lg:px-4 lg:py-16">
      {/* Atmospheric aurora — same warm cast as the home hero */}
      <div
        aria-hidden="true"
        className="hero-bg pointer-events-none absolute inset-0 -z-10 hidden lg:block"
      >
        <div className="hero-glow" />
      </div>

      <div className="hero-reveal flex w-full flex-1 flex-col overflow-hidden lg:max-w-5xl lg:flex-none lg:rounded-[28px] lg:border lg:border-neutral-200/80 lg:bg-white/80 lg:shadow-[0_40px_120px_-50px_rgba(15,15,25,0.55)] lg:backdrop-blur-xl lg:dark:border-neutral-800/70 lg:dark:bg-neutral-950/70">
        <div
          className={`flex flex-1 flex-col ${
            withImagePanel ? "lg:grid lg:grid-cols-[1.05fr_1fr]" : ""
          }`}
        >
          {withImagePanel ? <AuthImagePanel /> : null}

          {/* ── Form ─────────────────────────────────────────── */}
          {/* Centred rather than top-anchored on phones: the AI chat FAB owns
              the bottom-right corner, so a bottom-pinned register link ends up
              sitting right next to it. */}
          {/* `max-w-md` keeps the inputs from stretching the full width of a
              narrow-but-not-phone window, where there is no card to bound them.
              At `lg` the grid column does that job instead. */}
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:max-w-none lg:p-12">
            <div
              className="hero-reveal mb-8"
              style={{ animationDelay: "80ms" }}
            >
              <h1 className="text-[30px] font-semibold text-neutral-900 dark:text-neutral-50 lg:text-[28px]">
                {t("title")}
              </h1>
            </div>

            <Form
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              requiredMark={false}
              disabled={loading}
            >
              <div className="hero-reveal" style={{ animationDelay: "180ms" }}>
                <Form.Item
                  label={
                    <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                      {t("phoneLabel")}
                    </span>
                  }
                  name="phone"
                  rules={[{ required: true, message: t("phoneRequired") }]}
                >
                  <Input
                    size="large"
                    inputMode="tel"
                    autoComplete="tel"
                    prefix={
                      <PhoneIcon className="mr-1 h-4 w-4 text-neutral-400" />
                    }
                    placeholder={t("phonePlaceholder")}
                    className="rounded-xl!"
                  />
                </Form.Item>
              </div>

              <div className="hero-reveal" style={{ animationDelay: "260ms" }}>
                <Form.Item
                  label={
                    <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                      {t("passwordLabel")}
                    </span>
                  }
                  name="password"
                  rules={[{ required: true, message: t("passwordRequired") }]}
                >
                  <Input.Password
                    size="large"
                    autoComplete="current-password"
                    prefix={
                      <LockIcon className="mr-1 h-4 w-4 text-neutral-400" />
                    }
                    placeholder={t("passwordPlaceholder")}
                    className="rounded-xl!"
                  />
                </Form.Item>
              </div>

              <div
                className="hero-reveal -mt-1 mb-4 text-right"
                style={{ animationDelay: "300ms" }}
              >
                <Link
                  href="/auth/forgot-password"
                  className="text-[13px] font-medium text-neutral-500 underline-offset-4 hover:text-primary hover:underline dark:text-neutral-400"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ animationDelay: "340ms" }}
                className="hero-reveal group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-[14.5px] font-semibold text-white shadow-[0_10px_28px_-12px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.65)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {loading ? (
                  <SpinnerIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{t("submit")}</span>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </span>
                  </>
                )}
              </button>
            </Form>

            <p
              className="hero-reveal mt-7 text-center text-[13.5px] text-neutral-500 dark:text-neutral-400"
              style={{ animationDelay: "420ms" }}
            >
              {t("noAccount")}{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t("registerLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginFormContent;
