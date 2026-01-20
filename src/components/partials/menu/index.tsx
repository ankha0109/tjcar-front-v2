"use client";

import { cn } from "@/utils";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";

export const RenderMenuItem = ({
  icon,
  link,
  tooltip,
}: {
  icon: IconSvgElement;
  link?: string;
  tooltip?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (link) {
      router.push(link);
    }
  };
  return (
    <Tooltip title={tooltip} placement="right">
      <div
        className={cn(
          "flex justify-center items-center cursor-pointer h-10 hover:bg-white transition-all duration-200",
          pathname === link && "bg-white"
        )}
        onClick={handleClick}
      >
        <HugeiconsIcon
          icon={icon}
          size={22}
          strokeWidth={1.5}
          className={cn("text-comet", pathname === link && "text-[#222222]")}
        />
      </div>
    </Tooltip>
  );
};
