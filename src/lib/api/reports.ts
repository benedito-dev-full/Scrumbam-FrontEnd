import api from "./client";
import { ENDPOINTS } from "./endpoints";

export interface DownloadPdfParams {
  dateFrom?: string;
  dateTo?: string;
  periodDays?: number;
}

export const reportsApi = {
  downloadProjectPdf: async (
    projectId: string,
    params?: DownloadPdfParams,
  ): Promise<Blob> => {
    const response = await api.get(ENDPOINTS.REPORT_PROJECT_PDF(projectId), {
      params,
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
