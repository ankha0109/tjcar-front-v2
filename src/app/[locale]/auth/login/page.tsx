import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LoginFormContent from "@/components/pages/LoginForm";
import { getDevice } from "@/lib/device";

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

const Login = async () => {
  // Phones get the form alone, full screen. Gate the photo on the device cookie
  // rather than on `lg:` alone: a `hidden` panel still downloads its image (and
  // `priority` would even preload it), which is pure waste on a phone.
  const device = await getDevice();

  return (
    <Suspense fallback={null}>
      <LoginFormContent withImagePanel={device !== "mobile"} />
    </Suspense>
  );
};

export default Login;
