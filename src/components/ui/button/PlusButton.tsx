"use client";

import { Add01Icon } from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, ButtonProps } from "antd";

const PlusButton = ({
  children,
  ...props
}: ButtonProps & { children: React.ReactNode }) => {
  return (
    <Button
      icon={
        <HugeiconsIcon
          icon={Add01Icon}
          size={20}
          className="flex items-center text-green"
          alignmentBaseline="middle"
          strokeWidth={1.5}
        />
      }
      {...props}
    >
      {children}
    </Button>
  );
};

export default PlusButton;
