"use server";

import { revalidatePath } from "next/cache";

export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  sourceDocument: string;
  pageNumber?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentEntity {
  type: "person" | "date" | "organization" | "location" | "id" | "amount" | "other";
  value: string;
  confidence: number;
  context?: string;
}

export interface DocumentAnalysis {
  documentId: string;
  documentName: string;
  documentType: string;
  mimeType: string;
  pageCount: number;
  extractedText: string;
  extractedFields: ExtractedField[];
  entities: DocumentEntity[];
  language: string;
  analysisDate: Date;
  tags: string[];
  isValid: boolean;
  validationErrors?: string[];
}

export interface AnalysisResult {
  success: boolean;
  analysis?: DocumentAnalysis;
  error?: string;
}

/**
 * Analyzes a document to extract structured information
 */
export async function analyzeDocument(fileUrl: string, fileName: string): Promise<AnalysisResult> {
  try {
    // In a production system, you would call an AI service or OCR API here
    // For now, we'll simulate document analysis with a delay and mock data
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Determine document type based on filename
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    const isImage = ["jpg", "jpeg", "png"].includes(fileExtension || "");
    const isPdf = fileExtension === "pdf";

    // Mock different document types based on filename
    const documentType = fileName.toLowerCase().includes("passport")
      ? "passport"
      : fileName.toLowerCase().includes("bank")
        ? "bank_statement"
        : fileName.toLowerCase().includes("photo")
          ? "photograph"
          : "unknown";

    // Mock extracted entities based on document type
    const entities: DocumentEntity[] = [];
    if (documentType === "passport") {
      entities.push(
        { type: "person", value: "John Doe", confidence: 0.95, context: "holder name" },
        { type: "id", value: "AB123456", confidence: 0.98, context: "passport number" },
        { type: "date", value: "2025-06-15", confidence: 0.96, context: "expiry date" },
        { type: "date", value: "1980-03-21", confidence: 0.94, context: "date of birth" },
        { type: "location", value: "United States", confidence: 0.97, context: "issuing country" },
      );
    } else if (documentType === "bank_statement") {
      entities.push(
        { type: "person", value: "John Doe", confidence: 0.92, context: "account holder" },
        { type: "organization", value: "First National Bank", confidence: 0.99, context: "bank name" },
        { type: "id", value: "******7890", confidence: 0.96, context: "account number" },
        { type: "date", value: "2023-09-30", confidence: 0.98, context: "statement date" },
        { type: "amount", value: "$12,450.75", confidence: 0.97, context: "closing balance" },
      );
    }

    // Construct extracted fields from entities
    const extractedFields: ExtractedField[] = entities.map((entity) => ({
      name: `${entity.type}${entity.context ? `_${entity.context.replace(/\s/g, "_")}` : ""}`,
      value: entity.value,
      confidence: entity.confidence,
      sourceDocument: fileName,
      pageNumber: 1,
    }));

    // Create analysis result
    const analysis: DocumentAnalysis = {
      documentId: crypto.randomUUID(),
      documentName: fileName,
      documentType,
      mimeType: isPdf ? "application/pdf" : isImage ? "image/jpeg" : "application/octet-stream",
      pageCount: isPdf ? 4 : 1,
      extractedText: `This is a ${documentType} document for John Doe.`,
      extractedFields,
      entities,
      language: "en",
      analysisDate: new Date(),
      tags: [documentType, "analyzed", isImage ? "image" : isPdf ? "pdf" : "document"],
      isValid: true,
    };

    // Validate document based on type
    if (documentType === "passport") {
      // Check for passport expiry
      const expiryEntity = entities.find((e) => e.type === "date" && e.context === "expiry date");
      if (expiryEntity) {
        const expiryDate = new Date(expiryEntity.value);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        if (expiryDate < sixMonthsFromNow) {
          analysis.isValid = false;
          analysis.validationErrors = ["Passport expires within 6 months"];
        }
      }
    }

    revalidatePath("/");

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    console.error("Error analyzing document:", error);
    return {
      success: false,
      error: "Failed to analyze document. Please try again.",
    };
  }
}
