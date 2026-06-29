import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import RegisterFormContent from "@/components/pages/RegisterForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.register" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

const Register = () => {
  return (
    <Suspense fallback={null}>
      <RegisterFormContent />
    </Suspense>
  );
};

export default Register;
