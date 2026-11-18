import "server-only";
import { localStorageProvider } from "@/lib/storage/local";
import { s3StorageProvider } from "@/lib/storage/s3";
import { StorageConfigurationError, type FileStorageProvider, type FileStorageProviderName } from "@/lib/storage/types";

export function getStorageProvider(name?: string): FileStorageProvider | null {
  const selected = (name ?? (process.env.NODE_ENV === "production" ? "database" : process.env.STORAGE_PROVIDER ?? "local")) as string;

  if (selected === "database") return null;

  if (selected === "local") {
    if (process.env.NODE_ENV === "production") {
      throw new StorageConfigurationError("Local file storage is available only in development.");
    }
    return localStorageProvider;
  }

  if (selected === "s3") return s3StorageProvider;
  throw new StorageConfigurationError("Choose the database, local, or S3 private storage provider.");
}

export function isStorageProviderName(value: string): value is FileStorageProviderName {
  return value === "database" || value === "local" || value === "s3";
}
