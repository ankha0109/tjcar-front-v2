"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";

type Props = {
  carTitle: string;
};

export default function CarBidCta({ carTitle }: Props) {
  const t = useTranslations("carDetail.bid");
  const { modal } = App.useApp();

  return (
    <BrandButton
      block
      size="large"
      onClick={() => {
        modal.info({
          title: t("comingSoonTitle"),
          content: t("comingSoonBody", { car: carTitle }),
          okText: t("ok"),
          centered: true,
        });
      }}
    >
      {t("cta")}
    </BrandButton>
  );
}
