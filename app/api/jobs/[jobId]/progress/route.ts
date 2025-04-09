import { jobTracker } from "@/app/services/job-tracker";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = jobTracker.getJob(jobId);

  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial job state
      const data = `data: ${JSON.stringify(job)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Subscribe to job updates
      const onUpdate = (updatedJob: typeof job) => {
        const data = `data: ${JSON.stringify(updatedJob)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));

        // If job is completed or errored, close the stream
        if (updatedJob.status === "completed" || updatedJob.status === "error") {
          jobTracker.unsubscribeFromJob(jobId, onUpdate);
          controller.close();
        }
      };

      // Subscribe to job updates
      jobTracker.subscribeToJob(jobId, onUpdate);

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        jobTracker.unsubscribeFromJob(jobId, onUpdate);
        controller.close();
      });
    },
  });

  // Set headers for SSE
  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", "text/event-stream");
  responseHeaders.set("Cache-Control", "no-cache");
  responseHeaders.set("Connection", "keep-alive");

  // Ensure proxies don't buffer the response
  responseHeaders.set("X-Accel-Buffering", "no");

  // Get client headers to check for proxy
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // If behind a proxy, explicitly disable buffering
    responseHeaders.set("X-Accel-Buffering", "no");
  }

  return new Response(stream, {
    headers: responseHeaders,
  });
}
