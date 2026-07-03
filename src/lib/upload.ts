import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PRIVATE_DIR = path.join(process.cwd(), "private-uploads");
const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");

async function saveFile(file: File, dir: string) {
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return filename;
}

/** Sensitive documents (ID, business license, rider ID). Never served publicly. */
export async function savePrivateFile(file: File) {
  return saveFile(file, PRIVATE_DIR);
}

export function privateFilePath(filename: string) {
  return path.join(PRIVATE_DIR, filename);
}

/** Store logos, banners, product photos, rider photo — safe to serve publicly. */
export async function savePublicFile(file: File) {
  const filename = await saveFile(file, PUBLIC_DIR);
  return `/uploads/${filename}`;
}
