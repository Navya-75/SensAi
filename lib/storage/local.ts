import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorageProvider } from "@/lib/storage/types";

const storageRoot = path.resolve(process.cwd(), ".private-uploads");

function resolveStoragePath(key: string) {
  const normalizedKey = key.replace(/[\\]/g, "/");
  const target = path.resolve(storageRoot, normalizedKey);
  if (!target.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Invalid private storage key.");
  }
  return target;
}

export const localStorageProvider: FileStorageProvider = {
  name: "local",
  async put(key, body) {
    const target = resolveStoragePath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx", mode: 0o600 });
  },
  async get(key) {
    return readFile(resolveStoragePath(key));
  },
  async delete(key) {
    try {
      await unlink(resolveStoragePath(key));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
      throw error;
    }
  },
};
