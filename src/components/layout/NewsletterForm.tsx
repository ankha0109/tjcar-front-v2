"use client";

import { Button, Input } from "antd";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

type Status = "idle" | "loading" | "done" | "error";

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function NewsletterForm() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await new Promise((r) => setTimeout(r, 700));
      setStatus("done");
      setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex w-full max-w-md gap-2">
        <Input
          type="email"
          placeholder="example@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          prefix={<MailIcon className="h-3.5 w-3.5 text-neutral-400" />}
          variant="filled"
          className="!h-10"
        />
        <Button
          type="primary"
          htmlType="submit"
          loading={status === "loading"}
          className="!h-10 !rounded-lg !px-5 !font-medium"
        >
          {t("submit")}
        </Button>
      </div>
      <p
        className={cn(
          "h-4 text-[12px] transition-opacity",
          status === "done"
            ? "text-emerald-600 opacity-100"
            : status === "error"
              ? "text-red-600 opacity-100"
              : "opacity-0",
        )}
      >
        {status === "done"
          ? t("success")
          : status === "error"
            ? t("error")
            : " "}
      </p>
    </form>
  );
}
