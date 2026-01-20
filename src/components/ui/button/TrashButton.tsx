import { Add01Icon, Delete02Icon } from "@hugeicons-pro/core-stroke-standard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, ButtonProps } from "antd";
import { twMerge } from "tailwind-merge";

const TrashButton = ({
  children,
  className,
  ...props
}: ButtonProps & { children?: React.ReactNode }) => {
  return (
    <Button
      className={twMerge("text-[#B4B4B4] hover:text-[#bc1818]", className)}
      icon={
        <HugeiconsIcon
          icon={Delete02Icon}
          size={18}
          className="flex items-center transition-all ease-[cubic-bezier(.4,0,.2,1)]"
          alignmentBaseline="middle"
          color="currentColor"
          strokeWidth={1.5}
        />
      }
      {...props}
    />
  );
};

export default TrashButton;

{
  /* <Button
          danger
          icon={
            <HugeiconsIcon
              icon={Delete02Icon}
              size={20}
              className="flex items-center"
            />
          }
          onClick={() => {
            showConfirm(record.id);
          }}
        /> */
}
