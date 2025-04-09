// app/api/sse/route.ts
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
      };

      sendEvent({ step: 1, message: "Starting document processing" });
      await new Promise((r) => setTimeout(r, 1000));
      sendEvent({ step: 2, message: "Uploading file" });
      await new Promise((r) => setTimeout(r, 1000));
      sendEvent({ step: 3, message: "Chunking document" });
      await new Promise((r) => setTimeout(r, 1000));
      sendEvent({ step: 4, message: "Calculating embedding" });
      await new Promise((r) => setTimeout(r, 1000));
      sendEvent({ step: 5, message: "Completed", document: { id: "123", name: "Doc Name" } });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
