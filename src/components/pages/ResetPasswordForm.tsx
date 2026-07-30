"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Form, Input, App } from "antd";
import { ApiError } from "@/services/Api";
import { resetPassword } from "@/services/auth";
import AuthImagePanel from "@/components/pages/auth/AuthImagePanel";
import {
  AlertIcon,
  ArrowIcon,
  KeyIcon,
  LockIcon,
  SpinnerIcon,
} from "@/components/pages/auth/authIcons";

type ResetPasswordFormValues = {
  password: string;
  confirm: string;
};

type Props = {
  /** The reset token, straight off the `[token]` route segment. */
  token: string;
  /**
   * Whether to render the photo half. False on phones — see the note in
   * `auth/reset-password/[token]/page.tsx`; `lg:hidden` alone would still
   * fetch the image.
   */
  withImagePanel: boolean;
};

const ResetPasswordFormContent = ({ token, withImagePanel }: Props) => {
  const t = useTranslations("auth.resetPassword");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  // Set once the server rejects the token itself — a field error would be
  // misleading, nothing the user can type here fixes an expired link.
  const [linkRejected, setLinkRejected] = useState(false);

  // The backend appends `?email=` by string concatenation, without encoding, so
  // a plus-addressed mailbox arrives with its `+` decoded to a space. No e-mail
  // can legally contain a space, which makes the swap back unambiguous.
  const rawEmail = searchParams.get("email");
  const email = rawEmail ? rawEmail.replace(/ /g, "+") : null;

  const onFinish = async (values: ResetPasswordFormValues) => {
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword({
        token,
        email,
        password: values.password,
        password_confirmation: values.confirm,
      });
      message.success(t("successMessage"));
      router.push("/auth/login");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const errors = (error.details as { errors?: Record<string, string[]> })
          ?.errors;
        // A dead token comes back keyed on `email`, which is not a field we
        // render; anything else is a genuine password complaint.
        if (errors?.email) {
          setLinkRejected(true);
          return;
        }
        if (errors && typeof errors === "object") {
          form.setFields(
            Object.entries(errors).map(([name, messages]) => ({
              name: name === "password_confirmation" ? "confirm" : name,
              errors: Array.isArray(messages) ? messages : [String(messages)],
            })),
          );
          return;
        }
      }
      console.log("Reset password error:", error);
      message.error(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  // A link with no `email` is as unusable as an expired one — the backend
  // matches the token against that address and we have no other source for it.
  const invalid = !email || linkRejected;

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
            {invalid ? (
              <>
                <div
                  className="hero-reveal mb-7"
                  style={{ animationDelay: "80ms" }}
                >
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <AlertIcon className="h-5 w-5" />
                  </span>
                  <h1 className="text-[26px] font-semibold text-neutral-900 dark:text-neutral-50 lg:text-[24px]">
                    {t("invalidTitle")}
                  </h1>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {t("invalidBody")}
                  </p>
                </div>

                <Link
                  href="/auth/forgot-password"
                  style={{ animationDelay: "180ms" }}
                  className="hero-reveal group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 text-[14.5px] font-semibold text-white shadow-[0_10px_28px_-12px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:text-white hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.65)] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:text-neutral-900"
                >
                  <span>{t("requestAgain")}</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </span>
                </Link>

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
            ) : (
              <>
                <div
                  className="hero-reveal mb-7"
                  style={{ animationDelay: "80ms" }}
                >
                  <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyIcon className="h-5 w-5" />
                  </span>
                  <h1 className="text-[30px] font-semibold text-neutral-900 dark:text-neutral-50 lg:text-[28px]">
                    {t("title")}
                  </h1>
                  {/* Naming the account reassures the user the link belongs to
                      them, and surfaces a wrong mailbox before they type. */}
                  <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {t("subtitle", { email })}
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
                          {t("passwordLabel")}
                        </span>
                      }
                      name="password"
                      rules={[
                        { required: true, message: t("passwordRequired") },
                        { min: 8, message: t("passwordMin") },
                      ]}
                    >
                      <Input.Password
                        size="large"
                        autoComplete="new-password"
                        prefix={
                          <LockIcon className="mr-1 h-4 w-4 text-neutral-400" />
                        }
                        placeholder={t("passwordPlaceholder")}
                        className="rounded-xl!"
                      />
                    </Form.Item>
                  </div>

                  <div
                    className="hero-reveal"
                    style={{ animationDelay: "260ms" }}
                  >
                    <Form.Item
                      label={
                        <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                          {t("confirmLabel")}
                        </span>
                      }
                      name="confirm"
                      dependencies={["password"]}
                      rules={[
                        { required: true, message: t("confirmRequired") },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error(t("passwordMismatch")),
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        size="large"
                        autoComplete="new-password"
                        prefix={
                          <LockIcon className="mr-1 h-4 w-4 text-neutral-400" />
                        }
                        placeholder={t("confirmPlaceholder")}
                        className="rounded-xl!"
                      />
                    </Form.Item>
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

export default ResetPasswordFormContent;
