"use client";

import HeaderComponent from "@/components/ui/HeaderComponent";
import HeaderTitle from "@/components/ui/HeaderTitle";
import { Dropdown } from "antd";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons-pro/core-stroke-standard";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  {
    key: "/settings",
    label: "Системийн тохиргоо",
  },
  {
    key: "/settings/logs",
    label: "Системийн түүх",
  },
];

const SettingsHeader = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    if (pathname === "/settings/logs") {
      setSelectedKey("/settings/logs");
    } else {
      setSelectedKey("/settings");
    }
  }, [pathname]);

  const onClickMenu = ({ key }: { key: string }) => {
    setSelectedKey(key);
    router.push(key);
  };

  return (
    <HeaderComponent>
      <Dropdown
        menu={{ items, onClick: onClickMenu, selectedKeys: [selectedKey] }}
        trigger={["click"]}
        className="flex flex-row items-center"
        placement="bottomRight"
        overlayStyle={{ width: "max-content" }}
        overlayClassName="w-max !min-w-auto"
        arrow
      >
        <div className="flex flex-row items-center gap-1 cursor-pointer">
          <HeaderTitle
            title={
              pathname == "/settings/logs"
                ? "Системийн түүх"
                : "Системийн тохиргоо"
            }
            onClick={(e) => e.preventDefault()}
          />
          <HugeiconsIcon icon={ArrowDown01Icon} size={22} className="pt-1" />
        </div>
      </Dropdown>
    </HeaderComponent>
  );
};

export default SettingsHeader;
