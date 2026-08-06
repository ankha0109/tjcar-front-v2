import { redirect } from "@/i18n/navigation";

/**
 * `/report/view` with no id. The PDF prints the full URL in readable text
 * under the QR code, so a human retyping it can drop the trailing id — and
 * there is nothing to show them here. `/report` is where the service is
 * explained.
 */
export default async function ReportViewIndexRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/report", locale });
}
