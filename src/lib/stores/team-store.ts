import { create } from "zustand";

/**
 * Store global do time selecionado nas telas `/team/*`.
 *
 * NAO persiste — selecao volta ao primeiro time elegivel a cada sessao.
 * Isso evita "ghost team" quando o usuario perde acesso a um time
 * ainda em cache no localStorage.
 */
interface TeamStore {
  selectedTeamId: string | null;
  setSelectedTeam: (id: string | null) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  selectedTeamId: null,
  setSelectedTeam: (id) => set({ selectedTeamId: id }),
}));
