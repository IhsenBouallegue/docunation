import { type FileRouter, createUploadthing } from "uploadthing/next";

const f = createUploadthing();

// Define FileRouter for document uploads
export const ourFileRouter = {
  // Define document uploader route
  documentUploader: f({ pdf: { maxFileSize: "32MB" } })
    .middleware(async () => {
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.uploadedBy);
      console.log("File URL:", file.ufsUrl);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
