export type FileStorageProviderName = "local" | "s3";

export interface FileStorageProvider {
  readonly name: FileStorageProviderName;
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export class StorageConfigurationError extends Error {
  constructor(message = "Private file storage is not configured.") {
    super(message);
    this.name = "StorageConfigurationError";
  }
}
