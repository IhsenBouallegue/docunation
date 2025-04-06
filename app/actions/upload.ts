"use server";

import { uploadFile } from "@/app/utils/minio";

export async function uploadDocument(
  formData: FormData,
): Promise<{ bucketName: string; objectKey: string; name: string; type: string }> {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Convert the file to a buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to MinIO and get metadata
  const { bucketName, objectKey } = await uploadFile(buffer, file.name, file.type);

  return {
    bucketName,
    objectKey,
    name: file.name,
    type: file.type,
  };
}
