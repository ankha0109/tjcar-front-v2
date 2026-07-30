import ListingSkeleton from "@/components/cards/ListingSkeleton";

// No `showFilters`: `/garage` filters from a toolbar above the grid, not a
// sidebar, so the placeholder is toolbar + grid only.
export default function Loading() {
  return <ListingSkeleton />;
}
