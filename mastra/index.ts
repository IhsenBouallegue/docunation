import { pgVector } from "@/mastra/rag";
import { Mastra } from "@mastra/core";
import { documentAgent } from "./agents";
import { documentProcessingWorkflow, documentQueryWorkflow } from "./workflows";

export const mastra = new Mastra({
  workflows: {
    documentProcessingWorkflow,
    documentQueryWorkflow,
  },
  agents: {
    documentAgent,
  },
  vectors: {
    pgVector,
  },
  // logger: createLogger({
  //   name: "Mastra",
  //   level: "info",
  // }),
});
