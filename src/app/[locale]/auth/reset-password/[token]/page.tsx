import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ResetPasswordFormContent from "@/components/pages/ResetPasswordForm";
import { getDevice } from "@/lib/device";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.resetPassword" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    // The URL carries a live reset token — keep it out of search indexes.
    robots: { index: false, follow: false },
  };
}

const ResetPassword = async ({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) => {
  const { token } = await params;
  // Same reasoning as the login page: a `hidden` panel still downloads its
  // image, so phones — which never show it — skip rendering it altogether.
  const device = await getDevice();

  return (
    // The form reads `?email=` off the URL with `useSearchParams`.
    <Suspense fallback={null}>
      <ResetPasswordFormContent
        token={token}
        withImagePanel={device !== "mobile"}
      />
    </Suspense>
  );
};

export default ResetPassword;
