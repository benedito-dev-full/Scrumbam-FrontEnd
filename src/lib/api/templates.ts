import api from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  ProjectTemplate,
  CreateFromTemplateDto,
  ProjectFromTemplate,
} from "@/types";

export const templatesApi = {
  list: async (): Promise<ProjectTemplate[]> => {
    const { data } = await api.get<ProjectTemplate[]>(ENDPOINTS.TEMPLATES);
    return data;
  },

  getById: async (id: string): Promise<ProjectTemplate> => {
    const { data } = await api.get<ProjectTemplate>(ENDPOINTS.TEMPLATE(id));
    return data;
  },

  createFromTemplate: async (
    dto: CreateFromTemplateDto,
  ): Promise<ProjectFromTemplate> => {
    const { data } = await api.post<ProjectFromTemplate>(
      ENDPOINTS.PROJECT_FROM_TEMPLATE,
      dto,
    );
    return data;
  },
};
