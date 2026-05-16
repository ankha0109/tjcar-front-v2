import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LoginFormContent from "@/components/pages/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

const Login = () => {
  return (
    <Suspense fallback={null}>
      <LoginFormContent />
    </Suspense>
  );
};

export default Login;
