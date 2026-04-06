// Retrospective types -- aligned with backend RetrospectiveSummaryDto + FeedbackResponseDto

export type FeedbackTipo = "positivo" | "negativo" | "ideia";

export interface FeedbackAutor {
  id: string;
  nome: string;
}

export interface FeedbackResponse {
  id: string;
  tipo: FeedbackTipo;
  conteudo: string;
  autor: FeedbackAutor;
  taskId: string | null;
  criadoEm: string;
}

export interface RetrospectiveSummary {
  periodDays: number;
  positivoCount: number;
  negativoCount: number;
  ideiaCount: number;
  positivos: FeedbackResponse[];
  negativos: FeedbackResponse[];
  ideias: FeedbackResponse[];
}

export interface CreateFeedbackDto {
  tipo: FeedbackTipo;
  conteudo: string;
}
