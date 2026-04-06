import api from "./client";
import { ENDPOINTS } from "./endpoints";
import { mapApiColumn, mapApiColumns } from "@/lib/adapters/api-column-adapter";
import type {
  Column,
  CreateColumnDto,
  UpdateColumnDto,
  ReorderColumnsDto,
} from "@/types";

export const columnsApi = {
  list: async (projectId: string): Promise<Column[]> => {
    const { data } = await api.get(ENDPOINTS.PROJECT_COLUMNS(projectId));
    return mapApiColumns(data);
  },

  create: async (projectId: string, dto: CreateColumnDto): Promise<Column> => {
    const { data } = await api.post(ENDPOINTS.PROJECT_COLUMNS(projectId), dto);
    return mapApiColumn(data);
  },

  update: async (
    projectId: string,
    columnId: string,
    dto: UpdateColumnDto,
  ): Promise<Column> => {
    const { data } = await api.put(
      ENDPOINTS.PROJECT_COLUMN(projectId, columnId),
      dto,
    );
    return mapApiColumn(data);
  },

  reorder: async (projectId: string, dto: ReorderColumnsDto): Promise<void> => {
    await api.put(ENDPOINTS.PROJECT_COLUMNS_REORDER(projectId), dto);
  },

  delete: async (
    projectId: string,
    columnId: string,
    targetColumnId: string,
  ): Promise<void> => {
    await api.delete(ENDPOINTS.PROJECT_COLUMN(projectId, columnId), {
      data: { targetColumnId },
    });
  },
};
