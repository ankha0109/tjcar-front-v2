import Api from "@/services/Api";
import { CompanyProps } from "@/types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export function useCompany(
  params = {},
  options?: Partial<UseQueryOptions<CompanyProps, unknown>>
) {
  return useQuery({
    queryKey: ["company", params],
    queryFn: async () => {
      const res = await Api.get("/company", params);
      console.log(res);
      return res.company;
    },
    // staleTime: 1000 * 60 * 5, // 5 минут cache хийнэ
    refetchOnWindowFocus: false, // Disable window focus revalidation by default
    ...options, // гаднаас ирсэн props-г merge хийж болно
  });
}
