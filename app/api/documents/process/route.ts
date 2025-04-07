import { processDocumentStream } from "@/app/actions/document-processor";

export async function POST(request: Request) {
  const formData = await request.formData();
  return processDocumentStream(formData);
}

// Set large values for the response time limit since document processing can take a while
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";
