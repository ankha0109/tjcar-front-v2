"use client";

import { InformationCircleIcon } from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";

const InfoButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) => {
  let infoColor = "#F0B400";

  return (
    <div
      className={`h-8 flex gap-[10px] pr-[15px] items-center border border-[#F0B400] rounded-[5px] select-none cursor-pointer`}
      onClick={onClick}
    >
      <div className={`h-full flex items-center px-[10px] bg-[#f0b40033]`}>
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={20}
          strokeWidth={1.5}
          className={`flex items-center`}
          alignmentBaseline="middle"
          color={infoColor}
        />
      </div>
      {children}
    </div>
  );
};

export default InfoButton;
