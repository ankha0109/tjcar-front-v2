"use client";

import { useCompany } from "@/hooks/useCompany";
import { Tabs, TabsProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const SettingsTabs = () => {
  const router = useRouter();
  const pathname = usePathname();

  const { data: company } = useCompany();

  const items: TabsProps["items"] = [
    {
      key: "company",
      label: "Байгууллага",
    },
    {
      key: "branch",
      label: "Салбар",
    },
    {
      key: "attendance",
      label: "Цаг бүртгэл",
    },
    {
      key: "operation",
      label: "Цагийн хуваарь",
    },
    {
      key: "department",
      label: "Алба хэлтэс",
      disabled: true,
    },
    {
      key: "position",
      label: "Албан тушаал",
      disabled: true,
    },
    {
      key: "salary",
      label: "Цалин хөлс",
      disabled: true,
    },
    {
      key: "salary_adjustment",
      label: "Нэмэгдэл олговор",
      disabled: true,
    },
    {
      key: "average_salary",
      label: "Дундаж цалин",
      disabled: true,
    },
    {
      key: "admin_roles",
      label: "Админ эрх",
      disabled: true,
    },
  ];

  // Route-оос key тодорхойлж авах
  const activeTab = useMemo(() => {
    // /settings/<key> хэлбэртэй гэж үзнэ
    const match = items.find((tab) =>
      pathname.includes(`/settings/${tab.key}`)
    );
    return match?.key || items[0].key;
  }, [pathname, items]);

  const onChange = (key: string) => {
    console.log("clicked", key);
    router.push(`/settings/${key}`);
  };

  if (pathname === "/settings/logs") return null;

  return (
    <Tabs
      activeKey={activeTab}
      items={items}
      onChange={onChange}
      className="settings-tabs mb-4"
    />
  );
};

export default SettingsTabs;
