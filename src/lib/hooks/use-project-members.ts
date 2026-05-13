import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  projectMembersApi,
  type AddProjectMemberRequest,
  type ProjectMember,
  type UpdateProjectMemberRequest,
} from "@/lib/api/project-members";

function projectMembersKey(projectId: string | undefined) {
  return ["project-members", projectId ?? ""] as const;
}

export function useProjectMembers(projectId: string | undefined) {
  return useQuery<ProjectMember[]>({
    queryKey: projectMembersKey(projectId),
    queryFn: () => projectMembersApi.list(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useAddProjectMember(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddProjectMemberRequest) =>
      projectMembersApi.add(projectId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectMembersKey(projectId) });
      toast.success("Membro adicionado ao projeto");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      const status = error.response?.status;
      if (status === 403) {
        toast.error("Sem permissao para adicionar membros neste projeto");
      } else if (status === 404) {
        toast.error("Usuario nao encontrado");
      } else if (status === 409) {
        toast.error("Este usuario ja e membro do projeto");
      } else {
        toast.error(
          error.response?.data?.message ?? "Erro ao adicionar membro",
        );
      }
    },
  });
}

export function useUpdateProjectMember(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateProjectMemberRequest;
    }) => projectMembersApi.update(projectId!, userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectMembersKey(projectId) });
      toast.success("Membro atualizado");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      const status = error.response?.status;
      if (status === 403) {
        toast.error("Sem permissao para alterar este membro");
      } else if (status === 404) {
        toast.error("Membro nao encontrado");
      } else {
        toast.error(
          error.response?.data?.message ?? "Erro ao atualizar membro",
        );
      }
    },
  });
}

export function useRemoveProjectMember(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      projectMembersApi.remove(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectMembersKey(projectId) });
      toast.success("Membro removido do projeto");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      const status = error.response?.status;
      if (status === 403) {
        toast.error(
          error.response?.data?.message ??
            "Sem permissao (ou seria o ultimo Manager)",
        );
      } else if (status === 404) {
        toast.error("Membro nao encontrado");
      } else {
        toast.error(error.response?.data?.message ?? "Erro ao remover membro");
      }
    },
  });
}
