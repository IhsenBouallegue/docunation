import { type FileRouter, createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({ pdf: { maxFileSize: "32MB" }, text: { maxFileSize: "32MB" }, image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      // Optional middleware code
      return { uploadedAt: new Date() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata);
      console.log("File URL:", file.url);

      return { uploadedUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
