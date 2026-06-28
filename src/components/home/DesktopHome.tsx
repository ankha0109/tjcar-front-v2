import BlogSection from "@/components/home/BlogSection";
import CarSearchSection from "@/components/home/CarSearchSection";
import type { FilterOptions } from "@/types/filters";

type Props = {
  filterOptions?: FilterOptions;
  japanBrands?: string[];
};

export default function DesktopHome({ filterOptions, japanBrands }: Props) {
  return (
    <>
      <CarSearchSection
        filterOptions={filterOptions}
        japanBrands={japanBrands}
      />
      <BlogSection />
    </>
  );
}
