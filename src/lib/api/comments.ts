import type { Comment, CreateCommentDto } from "@/types";

/**
 * Stub — V2 nao implementa endpoints de comments.
 * Retorna lista vazia / sucesso fake para nao quebrar UI.
 */
export const commentsApi = {
  list: async (_taskId: string): Promise<Comment[]> => {
    return [];
  },

  add: async (_taskId: string, dto: CreateCommentDto): Promise<Comment> => {
    return {
      chave: `stub-${Date.now()}`,
      texto: dto.texto,
      autor: { chave: "stub", nome: "" },
      criadoEm: new Date().toISOString(),
    };
  },
};
