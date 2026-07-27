import { setRequestLocale } from "next-intl/server";
import Home from "@/components/home/Home";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Home />;
}
