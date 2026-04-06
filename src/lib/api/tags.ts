import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type { Tag, CreateTagDto } from "@/types";

export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const { data } = await api.get<Tag[]>(ENDPOINTS.TAGS);
    return data;
  },

  create: async (dto: CreateTagDto): Promise<Tag> => {
    const { data } = await api.post<Tag>(ENDPOINTS.TAGS, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(ENDPOINTS.TAG(id));
  },
};
