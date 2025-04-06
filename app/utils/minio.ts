import * as Minio from "minio";

// Server-side check
if (typeof window !== "undefined") {
  throw new Error("MinIO utilities can only be used on the server side");
}

// Initialize MinIO client
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number.parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "documents";

// Ensure bucket exists
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
  }
}

// Generate a presigned URL for accessing a file
export async function generatePresignedUrl(
  bucketName: string,
  objectKey: string,
  expirySeconds = 3600,
): Promise<string> {
  return await minioClient.presignedGetObject(bucketName, objectKey, expirySeconds);
}

// Upload file and return metadata
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<{ bucketName: string; objectKey: string }> {
  await ensureBucket();

  const objectKey = `${Date.now()}-${filename}`;

  await minioClient.putObject(BUCKET_NAME, objectKey, buffer, buffer.length, { "Content-Type": contentType });

  return {
    bucketName: BUCKET_NAME,
    objectKey,
  };
}
