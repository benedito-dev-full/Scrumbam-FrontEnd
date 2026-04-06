import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  FeedbackResponse,
  RetrospectiveSummary,
  CreateFeedbackDto,
} from "@/types";

export const retrospectiveApi = {
  addFeedback: async (
    taskId: string,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackResponse> => {
    const { data } = await api.post<FeedbackResponse>(
      ENDPOINTS.TASK_FEEDBACK(taskId),
      dto,
    );
    return data;
  },

  getRetrospective: async (
    projectId: string,
    period?: number,
  ): Promise<RetrospectiveSummary> => {
    const { data } = await api.get<RetrospectiveSummary>(
      ENDPOINTS.RETROSPECTIVE(projectId),
      { params: period ? { period } : undefined },
    );
    return data;
  },
};
