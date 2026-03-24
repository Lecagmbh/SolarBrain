import { analyzeDocument } from "../ai/DocumentAIEngine";

export async function analyzeUpload(file: File) {
  const text = await file.text().catch(() => null);
  return analyzeDocument(file.name, text);
}
