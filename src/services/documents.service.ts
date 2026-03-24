// src/services/documents.service.ts
import { api } from "../modules/api/client";

export interface DocumentsListParams {
  installationId?: number;
  anlageId?: number;
  kategorie?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentListItem {
  id: number;
  kategorie: string;
  dokumentTyp?: string;
  dateiname: string;
  dateityp?: string;
  dateigroesse?: number;
  url: string;
  status: string;
  installationId?: number;
  installationPublicId?: string;
  anlageId?: number;
  anlageBezeichnung?: string;
  uploadedBy?: string;
  createdAt: string;
}

export async function fetchDocuments(
  params: DocumentsListParams = {}
): Promise<PaginatedResponse<DocumentListItem>> {
  const response = await api.get("/documents", { params });
  return response.data;
}

export async function fetchDocumentById(id: number): Promise<DocumentListItem> {
  const response = await api.get(`/documents/${id}`);
  return response.data;
}

// Datei hochladen (einzeln)
export async function uploadDocument(
  file: File,
  options: {
    installationId?: number;
    anlageId?: number;
    kategorie?: string;
    dokumentTyp?: string;
  }
): Promise<{ success: boolean; id: number; url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  if (options.installationId) formData.append("installationId", options.installationId.toString());
  if (options.anlageId) formData.append("anlageId", options.anlageId.toString());
  if (options.kategorie) formData.append("kategorie", options.kategorie);
  if (options.dokumentTyp) formData.append("dokumentTyp", options.dokumentTyp);
  
  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
}

// Mehrere Dateien hochladen
export async function uploadDocuments(
  files: File[],
  options: {
    installationId?: number;
    anlageId?: number;
    kategorie?: string;
  }
): Promise<{ success: boolean; count: number; documents: Array<{ id: number; url: string; filename: string }> }> {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append("files", file);
  });
  
  if (options.installationId) formData.append("installationId", options.installationId.toString());
  if (options.anlageId) formData.append("anlageId", options.anlageId.toString());
  if (options.kategorie) formData.append("kategorie", options.kategorie);
  
  const response = await api.post("/documents/upload-multiple", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
}

export async function updateDocument(
  id: number,
  data: { kategorie?: string; dokumentTyp?: string; status?: string }
): Promise<{ success: boolean; id: number }> {
  const response = await api.put(`/documents/${id}`, data);
  return response.data;
}

export async function deleteDocument(id: number): Promise<{ success: boolean }> {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
}

// Download URL generieren
export function getDownloadUrl(id: number): string {
  return `/api/documents/${id}/download`;
}

export default {
  fetchDocuments,
  fetchDocumentById,
  uploadDocument,
  uploadDocuments,
  updateDocument,
  deleteDocument,
  getDownloadUrl
};
