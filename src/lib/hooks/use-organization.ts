"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationsApi } from "@/lib/api/organizations";
import { invitesApi } from "@/lib/api/invites";
import { authApi } from "@/lib/api/auth";
import { QUERY_KEYS } from "@/lib/constants";
import type {
  AddOrgMemberDto,
  UpdateOrganizationDto,
  UpdateMeDto,
} from "@/types";
import type { OrgRole } from "@/types";

// === Organization data ===

export function useOrganization(orgId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.organization(orgId ?? ""),
    queryFn: () => organizationsApi.getOrg(orgId!),
    enabled: !!orgId,
  });
}

export function useUpdateOrganization(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateOrganizationDto) =>
      organizationsApi.updateOrg(orgId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.organization(orgId ?? ""),
      });
      toast.success("Organizacao atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar organizacao");
    },
  });
}

// === Organization members ===

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.orgMembers(orgId ?? ""),
    queryFn: () => organizationsApi.listUsers(orgId!),
    enabled: !!orgId,
  });
}

/** Lista convites pendentes da org (ADMIN). 404 se nao for ADMIN. */
export function usePendingInvites(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-invites", orgId ?? ""],
    queryFn: () => invitesApi.listPending(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export function useCancelInvite(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => invitesApi.cancel(orgId!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org-invites", orgId ?? ""],
      });
      toast.success("Convite cancelado");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      const status = error.response?.status;
      if (status === 403) {
        toast.error("Sem permissao para cancelar convites");
      } else if (status === 404) {
        toast.error("Convite nao encontrado");
      } else if (status === 409) {
        toast.error("Convite ja foi aceito e nao pode ser cancelado");
      } else {
        toast.error(
          error.response?.data?.message ?? "Erro ao cancelar convite",
        );
      }
    },
  });
}

export function useAddOrgMember(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AddOrgMemberDto) => organizationsApi.addUser(orgId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.orgMembers(orgId ?? ""),
      });
      toast.success("Membro adicionado com sucesso");
    },
    onError: (error: { response?: { status?: number } }) => {
      if (error.response?.status === 409) {
        toast.error("Este email ja esta cadastrado");
      } else if (error.response?.status === 403) {
        toast.error("Sem permissao para adicionar membros");
      } else {
        toast.error("Erro ao adicionar membro");
      }
    },
  });
}

export function useRemoveOrgMember(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => organizationsApi.removeUser(orgId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.orgMembers(orgId ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.organization(orgId ?? ""),
      });
      toast.success("Membro removido da organizacao");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      if (error.response?.status === 400) {
        toast.error(
          error.response.data?.message ??
            "Nao foi possivel remover este membro",
        );
      } else if (error.response?.status === 403) {
        toast.error("Sem permissao para remover membros");
      } else {
        toast.error("Erro ao remover membro");
      }
    },
  });
}

export function useUpdateMemberRole(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      organizationsApi.updateUserRole(orgId!, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.orgMembers(orgId ?? ""),
      });
      toast.success("Cargo atualizado");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      if (error.response?.status === 400) {
        toast.error(
          error.response.data?.message ?? "Nao foi possivel alterar o cargo",
        );
      } else {
        toast.error("Erro ao alterar cargo");
      }
    },
  });
}

// === Auth/Me (user profile) ===

export function useMe() {
  return useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: () => authApi.getMe(),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateMeDto) => authApi.updateMe(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
      toast.success("Perfil atualizado");
    },
    onError: (error: {
      response?: { status?: number; data?: { message?: string } };
    }) => {
      if (error.response?.status === 401) {
        toast.error("Senha atual incorreta");
      } else if (error.response?.status === 409) {
        toast.error("Este email ja esta em uso");
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    },
  });
}
