import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { StorageConfigurationError, type FileStorageProvider } from "@/lib/storage/types";

function getS3Configuration() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new StorageConfigurationError("S3 storage requires a bucket, region, and server-side credentials.");
  }

  return { bucket, region, accessKeyId, secretAccessKey };
}

let client: S3Client | undefined;

function getClient() {
  const { region, accessKeyId, secretAccessKey } = getS3Configuration();
  if (!client) {
    client = new S3Client({
      region,
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export const s3StorageProvider: FileStorageProvider = {
  name: "s3",
  async put(key, body, contentType) {
    const { bucket } = getS3Configuration();
    await getClient().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  },
  async get(key) {
    const { bucket } = getS3Configuration();
    const response = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) throw new Error("Stored resume has no content.");
    return Buffer.from(await response.Body.transformToByteArray());
  },
  async delete(key) {
    const { bucket } = getS3Configuration();
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};
