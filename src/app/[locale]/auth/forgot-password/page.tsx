import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ForgotPasswordFormContent from "@/components/pages/ForgotPasswordForm";
import { getDevice } from "@/lib/device";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.forgotPassword" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

const ForgotPassword = async () => {
  // Same reasoning as the login page: a `hidden` panel still downloads its
  // image, so phones — which never show it — skip rendering it altogether.
  const device = await getDevice();

  return <ForgotPasswordFormContent withImagePanel={device !== "mobile"} />;
};

export default ForgotPassword;
