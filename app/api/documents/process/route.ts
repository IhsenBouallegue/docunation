import { processDocumentStream } from "@/app/actions/document-processor";
import { jobTracker } from "@/app/services/job-tracker";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create a new job
  const jobId = uuidv4();
  jobTracker.createJob(jobId);

  // Start processing in the background
  processDocumentStream(formData, jobId).catch((error) => {
    console.error("Error processing document:", error);
    jobTracker.failJob(jobId, error.message || "Unknown error occurred");
  });

  // Return the job ID immediately
  return new Response(JSON.stringify({ jobId }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}

// Set large values for the response time limit since document processing can take a while
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";
