import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { Comment, CreateCommentDto } from "@/types";

export const commentsApi = {
  list: async (taskId: string): Promise<Comment[]> => {
    const { data } = await api.get<Comment[]>(ENDPOINTS.TASK_COMMENTS(taskId));
    return data;
  },

  add: async (taskId: string, dto: CreateCommentDto): Promise<Comment> => {
    const { data } = await api.post<Comment>(
      ENDPOINTS.TASK_COMMENTS(taskId),
      dto,
    );
    return data;
  },
};
