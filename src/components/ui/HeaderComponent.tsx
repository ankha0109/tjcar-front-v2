import { cn } from "@/utils";

interface HeaderComponentProps {
  children: React.ReactNode;
  className?: string;
}

const HeaderComponent = ({ children, className }: HeaderComponentProps) => {
  return (
    <header className={cn("h-[60px] flex items-center justify-between", className)}>
      {children}
    </header>
  );
};

export default HeaderComponent;
