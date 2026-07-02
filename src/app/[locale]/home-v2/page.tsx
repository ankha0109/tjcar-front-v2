import { setRequestLocale } from "next-intl/server";
import HomeV2 from "@/components/home/v2/HomeV2";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomeV2Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeV2 />;
}
