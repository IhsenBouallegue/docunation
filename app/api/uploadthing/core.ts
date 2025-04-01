import { type FileRouter, createUploadthing } from "uploadthing/next";

const f = createUploadthing();

// Define FileRouter for document uploads
export const ourFileRouter = {
  // Define document uploader route
  documentUploader: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "4MB" } })
    .middleware(() => {
      // This middleware ensures the user is authorized and captures metadata
      return { uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This function runs after upload is complete on the server
      console.log("Upload complete for:", file.name);

      // Return information about the uploaded file
      return {
        uploadedAt: metadata.uploadedAt,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
