import { categorizeDocument } from "./categorizeDocument";
import type { DocumentCategory } from "./documentCategories";

export async function analyzeDocument(
  filename: string,
  textContent: string | null
): Promise<{
  category: DocumentCategory;
  confidence: number;
  reason?: string;
}> {
  return categorizeDocument(filename, textContent);
}
