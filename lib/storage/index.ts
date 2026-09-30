import "server-only";
import { localStorageProvider } from "@/lib/storage/local";
import { s3StorageProvider } from "@/lib/storage/s3";
import { StorageConfigurationError, type FileStorageProvider, type FileStorageProviderName } from "@/lib/storage/types";

export function getStorageProvider(name?: string): FileStorageProvider {
  const selected = (name ?? process.env.STORAGE_PROVIDER ?? (process.env.NODE_ENV === "production" ? "s3" : "local")) as string;

  if (selected === "local") {
    if (process.env.NODE_ENV === "production") {
      throw new StorageConfigurationError("Local file storage is available only in development.");
    }
    return localStorageProvider;
  }

  if (selected === "s3") return s3StorageProvider;
  throw new StorageConfigurationError("Choose the local or S3 private storage provider.");
}

export function isStorageProviderName(value: string): value is FileStorageProviderName {
  return value === "local" || value === "s3";
}
