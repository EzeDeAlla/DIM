import { useAxiosQuery, useAxiosMutation } from "./useAxiosQuery";
import { useQueryClient } from "@tanstack/react-query";

export const useSettings = () => useAxiosQuery({
  queryKey: ["settings"],
  queryFn: async () => {
    const { getSettings } = await import("../api/settings.api");
    const res = await getSettings();
    return res.data?.data ?? res.data;
  }
});

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  
  return useAxiosMutation({
    mutationKey: ["settings:update"],
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { updateSetting } = await import("../api/settings.api");
      const res = await updateSetting(key, value);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      // Invalidar la cache de settings para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  });
};
