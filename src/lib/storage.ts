import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Directorio donde se guardan las cartolas subidas (privado, no servido). */
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/** Nombre único persistido en disco (sin la ruta). */
export function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
}

/**
 * Guarda el archivo en `uploads/` y devuelve el nombre con el que quedó
 * almacenado. Lanza si falla la escritura.
 */
export async function saveUpload(file: File, storedName: string): Promise<void> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, storedName), buffer);
}

/** Ruta absoluta de un archivo subido previamente. */
export function uploadPath(storedName: string): string {
  return path.join(UPLOADS_DIR, storedName);
}