"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Form, Input, App } from "antd";
import { ApiError } from "@/services/Api";
import { forgotPassword } from "@/services/auth";
import AuthImagePanel from "@/components/pages/auth/AuthImagePanel";
import {
  ArrowIcon,
  MailIcon,
  PhoneIcon,
  SpinnerIcon,
} from "@/components/pages/auth/authIcons";

type ForgotPasswordFormValues = {
  phone: string;
};

/**
 * The broker throttles a resend to one per 60s, counted from the stored token's
 * `created_at`. It never tells us how much of that window is left, so we mirror
 * the same 60s locally rather than let the user burn a request on a refusal.
 */
const RESEND_SECONDS = 60;

type Props = {
  /**
   * Whether to render the photo half. False on phones — see the note in
   * `auth/forgot-password/page.tsx`; `lg:hidden` alone would still fetch it.
   */
  withImagePanel: boolean;
};

const ForgotPasswordFormContent = ({ withImagePanel }: Props) => {
  const t = useTranslations("auth.forgotPassword");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  // Non-null once the link is on its way; also the phone we resend to.
  const [sentTo, setSentTo] = useState<string | null>(null);
  // The masked address the server actually mailed, e.g. `ankh***09@gmail.com`.
  // Null when the API build in front of us doesn't return one yet.
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  // A lookup failure and a "this account has no e-mail" failure come back
  // identical, so the hint is offered alongside the error rather than instead.
  const [showNoEmailHint, setShowNoEmailHint] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setShowNoEmailHint(false);
    try {
      const res = await forgotPassword(values.phone);
      setSentEmail(res.email ?? null);
      setSentTo(values.phone);
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // Every business failure here is keyed on `phone` and worded in
        // hardcoded Mongolian server-side, so we show our own translated copy.
        form.setFields([{ name: "phone", errors: [t("errorNotFound")] }]);
        setShowNoEmailHint(true);
        return;
      }
      console.log("Forgot password error:", error);
      message.error(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!sentTo || cooldown > 0 || loading) return;
    setLoading(true);
    try {
      await forgotPassword(sentTo);
      setCooldown(RESEND_SECONDS);
      message.success(t("resendSuccess"));
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // At this point the account is known to exist, so a 422 is the broker
        // throttle: our clock drifted ahead of the server's. Start it over.
        setCooldown(RESEND_SECONDS);
        message.error(t("errorThrottled"));
        return;
      }
      console.log("Forgot password resend error:", error);
      message.error(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Below `lg` this is a full screen: no card, no padding, no aurora.
    // Mirrors the login page — see `LoginForm` for the reasoning.
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

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:max-w-none lg:p-12">
            {sentTo === null ? (
              <>
                <div
                  className="hero-reveal mb-7"
                  style={{ animationDelay: "80ms" }}
                >
                  <h1 className="text-[30px] font-semibold text-neutral-900 dark:text-neutral-50 lg:text-[28px]">
                    {t("title")}
                  </h1>
                  {/* Spells out that the link goes to e-mail, not SMS — the
                      form asks for a phone, so the default expectation is a
                      code by text message. */}
                  <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {t("subtitle")}
                  </p>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  autoComplete="off"
                  requiredMark={false}
                  disabled={loading}
                >
                  <div
                    className="hero-reveal"
                    style={{ animationDelay: "180ms" }}
                  >
                    <Form.Item
                      label={
                        <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                          {t("phoneLabel")}
                        </span>
                      }
                      name="phone"
                      rules={[
                        { required: true, message: t("phoneRequired") },
                        { pattern: /^\d{8}$/, message: t("phoneInvalid") },
                      ]}
                    >
                      <Input
                        size="large"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={8}
                        prefix={
                          <PhoneIcon className="mr-1 h-4 w-4 text-neutral-400" />
                        }
                        placeholder={t("phonePlaceholder")}
                        className="rounded-xl!"
                      />
                    </Form.Item>
                  </div>

                  {showNoEmailHint ? (
                    <p className="-mt-1 mb-4 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {t("errorNoEmailHint")}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ animationDelay: "260ms" }}
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
                  style={{ animationDelay: "340ms" }}
                >
                  <Link
                    href="/auth/login"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {t("backToLogin")}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div
                  className="hero-reveal mb-7"
                  style={{ animationDelay: "80ms" }}
                >
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MailIcon className="h-5 w-5" />
                  </span>
                  <h1 className="text-[26px] font-semibold text-neutral-900 dark:text-neutral-50 lg:text-[24px]">
                    {t("sentTitle")}
                  </h1>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {sentEmail
                      ? t("sentBody", { email: sentEmail })
                      : t("sentBodyGeneric")}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                    {t("sentExpiry")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onResend}
                  disabled={cooldown > 0 || loading}
                  style={{ animationDelay: "180ms" }}
                  className="hero-reveal flex h-12 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 px-5 text-[14.5px] font-semibold text-neutral-800 transition-all duration-300 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-600"
                >
                  {loading ? (
                    <SpinnerIcon className="h-5 w-5 animate-spin" />
                  ) : cooldown > 0 ? (
                    t("resendIn", { seconds: cooldown })
                  ) : (
                    t("resend")
                  )}
                </button>

                <p
                  className="hero-reveal mt-7 text-center text-[13.5px] text-neutral-500 dark:text-neutral-400"
                  style={{ animationDelay: "260ms" }}
                >
                  <Link
                    href="/auth/login"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {t("backToLogin")}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordFormContent;
