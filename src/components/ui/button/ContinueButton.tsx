"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
} from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, ButtonProps } from "antd";

const PlusButton = ({
  children,
  ...props
}: ButtonProps & { children: React.ReactNode }) => {
  return (
    <Button
      type="primary"
      className="w-[240px] justify-between"
      // classNames={{
      //   icon: "flex items-center",
      // }}
      icon={
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={20}
          className="flex items-center"
        />
      }
      iconPlacement="end"
      {...props}
    >
      <span className="flex-1">Үргэлжлүүл</span>
    </Button>
  );
};

export default PlusButton;
