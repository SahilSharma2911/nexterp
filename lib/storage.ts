import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Pluggable image storage. Uses AWS S3 when configured (production); otherwise
// falls back to writing under public/uploads so `next dev` works with no AWS
// setup. Note: the local driver is dev-only — serverless hosts (Vercel) have a
// read-only filesystem, so a real deployment must set the S3 env vars.

const BUCKET = process.env.AWS_S3_BUCKET;
const REGION = process.env.AWS_REGION;
const s3Configured = !!(
  BUCKET &&
  REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

export const storageDriver = s3Configured ? "s3" : "local";

let _s3: S3Client | null = null;
function s3() {
  // The SDK reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the env.
  if (!_s3) _s3 = new S3Client({ region: REGION });
  return _s3;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function extFor(contentType: string) {
  return EXT[contentType] ?? "bin";
}

export async function putImage(
  buf: Buffer,
  contentType: string,
): Promise<string> {
  const key = `uploads/${new Date().getFullYear()}/${randomUUID()}.${extFor(contentType)}`;

  if (s3Configured) {
    await s3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType,
      }),
    );
    const base =
      process.env.AWS_S3_PUBLIC_URL?.replace(/\/$/, "") ??
      `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
    return `${base}/${key}`;
  }

  // Local dev fallback → public/uploads/...
  const abs = path.join(process.cwd(), "public", key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  return `/${key}`;
}
