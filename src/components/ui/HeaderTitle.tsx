"use client";

import { cn } from "@/utils";

const HeaderTitle = ({
  title,
  ...props
}: { title: string } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <h3 {...props} className={cn("text-[22px] leading-6 m-0", props.className)}>
      {title}
    </h3>
  );
};

export default HeaderTitle;
