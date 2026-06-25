import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSource,
  deleteSource,
  fetchDepartments,
  fetchSources,
  fetchSourceTypes,
  updateSource,
  type SourceFormValues
} from "@/features/sources/api/sources.api";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: fetchSources
  });
}

export function useSourceTypes() {
  return useQuery({
    queryKey: ["source-types"],
    queryFn: fetchSourceTypes,
    staleTime: 5 * 60_000
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    staleTime: 5 * 60_000
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (values: SourceFormValues) => {
      return createSource({
        source_no: "",
        source_type_code: values.sourceTypeCode,
        title: values.title.trim(),
        reference_no: values.referenceNo.trim() || null,
        source_date: values.sourceDate,
        department_id: values.departmentId || null,
        summary: values.summary.trim() || null,
        created_by: user?.id ?? null
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sources"] });
    }
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SourceFormValues }) => {
      return updateSource(id, {
        source_type_code: values.sourceTypeCode,
        title: values.title.trim(),
        reference_no: values.referenceNo.trim() || null,
        source_date: values.sourceDate,
        department_id: values.departmentId || null,
        summary: values.summary.trim() || null
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sources"] });
    }
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSource,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sources"] });
    }
  });
}
