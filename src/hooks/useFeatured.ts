import { useQuery } from "@tanstack/react-query";
import Api from "@/services/Api";
import { FeaturedCar } from "@/types/featured";

export const useFeatured = () => {
  return useQuery<FeaturedCar[]>({
    queryKey: ["featured"],
    queryFn: () => Api.get("/featured"),
  });
};
