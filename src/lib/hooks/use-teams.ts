"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teamsApi } from "@/lib/api/teams";
import { QUERY_KEYS } from "@/lib/constants";
import type {
  Team,
  TeamMember,
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberRoleDto,
} from "@/types/team";

type ApiError = {
  response?: { status?: number; data?: { message?: string } };
};

function extractMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.response?.data?.message ?? fallback;
}

/** Lista os times onde o usuario logado e membro. */
export function useMyTeams() {
  return useQuery({
    queryKey: QUERY_KEYS.teams.mine,
    queryFn: () => teamsApi.listMine(),
    staleTime: 5 * 60_000, // 5 min
  });
}

/** Lista todos os times de uma organizacao. */
export function useTeamsList(organizationId: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.teams.list(organizationId ?? ""),
    queryFn: () => teamsApi.list(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60_000,
  });
}

/** Detalhe de um time. */
export function useTeam(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.teams.detail(id ?? ""),
    queryFn: () => teamsApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

/** Membros de um time. */
export function useTeamMembers(teamId: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.teams.members(teamId ?? ""),
    queryFn: () => teamsApi.getMembers(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  });
}

/** Cria time. ADMIN only — backend valida. */
export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation<Team, unknown, CreateTeamDto>({
    mutationFn: (dto) => teamsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Time criado com sucesso.");
    },
    onError: (err) => {
      toast.error(extractMessage(err, "Erro ao criar time"));
    },
  });
}

/** Edita time. */
export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation<Team, unknown, { id: string; dto: UpdateTeamDto }>({
    mutationFn: ({ id, dto }) => teamsApi.update(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.detail(id) });
      toast.success("Time atualizado.");
    },
    onError: (err) => {
      toast.error(extractMessage(err, "Erro ao atualizar time"));
    },
  });
}

/**
 * Soft delete de time.
 * Backend retorna 409 quando o time ainda tem projetos vinculados.
 */
export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (id) => teamsApi.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.removeQueries({ queryKey: QUERY_KEYS.teams.detail(id) });
      qc.removeQueries({ queryKey: QUERY_KEYS.teams.members(id) });
      toast.success("Time removido.");
    },
    onError: (err) => {
      const status = (err as ApiError)?.response?.status;
      if (status === 409) {
        toast.error("Desvincule os projetos do time antes de excluí-lo");
        return;
      }
      toast.error(extractMessage(err, "Erro ao remover time"));
    },
  });
}

/** Adiciona membro ao time. */
export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation<
    TeamMember,
    unknown,
    { teamId: string; dto: AddTeamMemberDto }
  >({
    mutationFn: ({ teamId, dto }) => teamsApi.addMember(teamId, dto),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.members(teamId) });
      qc.invalidateQueries({ queryKey: ["teams"] }); // memberCount muda
      toast.success("Membro adicionado.");
    },
    onError: (err) => {
      toast.error(extractMessage(err, "Erro ao adicionar membro"));
    },
  });
}

/** Edita cargo do membro. */
export function useUpdateTeamMemberRole() {
  const qc = useQueryClient();
  return useMutation<
    void,
    unknown,
    { teamId: string; userId: string; dto: UpdateTeamMemberRoleDto }
  >({
    mutationFn: ({ teamId, userId, dto }) =>
      teamsApi.updateMemberRole(teamId, userId, dto),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.members(teamId) });
      toast.success("Cargo atualizado.");
    },
    onError: (err) => {
      toast.error(extractMessage(err, "Erro ao atualizar cargo"));
    },
  });
}

/** Remove membro do time. */
export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation<void, unknown, { teamId: string; userId: string }>({
    mutationFn: ({ teamId, userId }) => teamsApi.removeMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.teams.members(teamId) });
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Membro removido.");
    },
    onError: (err) => {
      toast.error(extractMessage(err, "Erro ao remover membro"));
    },
  });
}
