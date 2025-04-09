import { EventEmitter } from "node:events";
import type { Document } from "@/app/types/document";

export interface Job {
  id: string;
  status:
    | "queued"
    | "extracting_content"
    | "uploading_document"
    | "processing_chunks"
    | "generating_embedding"
    | "storing_document"
    | "completed"
    | "error";
  progress: number;
  step?: number;
  message?: string;
  error?: string;
  result?: Document;
}

class JobTracker {
  private jobs: Map<string, Job>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.jobs = new Map();
    this.eventEmitter = new EventEmitter();
    // Increase max listeners as we might have many SSE connections
    this.eventEmitter.setMaxListeners(100);
  }

  createJob(jobId: string): Job {
    const job: Job = {
      id: jobId,
      status: "queued",
      progress: 0,
    };
    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  updateJob(jobId: string, updates: Partial<Job>) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);
    this.eventEmitter.emit(`job:${jobId}`, updatedJob);
  }

  subscribeToJob(jobId: string, callback: (job: Job) => void) {
    this.eventEmitter.on(`job:${jobId}`, callback);
  }

  unsubscribeFromJob(jobId: string, callback: (job: Job) => void) {
    this.eventEmitter.off(`job:${jobId}`, callback);
  }

  // Clean up completed jobs after 1 hour
  private cleanupJob(jobId: string) {
    setTimeout(
      () => {
        this.jobs.delete(jobId);
      },
      60 * 60 * 1000,
    );
  }

  completeJob(jobId: string, result: Document) {
    this.updateJob(jobId, {
      status: "completed",
      progress: 100,
      result,
    });
    this.cleanupJob(jobId);
  }

  failJob(jobId: string, error: string) {
    this.updateJob(jobId, {
      status: "error",
      error,
    });
    this.cleanupJob(jobId);
  }
}

// Export a singleton instance
export const jobTracker = new JobTracker();
