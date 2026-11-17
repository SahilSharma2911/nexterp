"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Manages an array of image URLs — add several at once, remove individually.
// Reuses POST /api/uploads (S3 in prod, local disk in dev).
export function MultiImageUpload({
  value,
  onChange,
  max = 8,
  className,
}: {
  value: string[] | null | undefined;
  onChange: (urls: string[]) => void;
  max?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const urls = value ?? [];

  async function handleFiles(files: FileList) {
    const picked = Array.from(files).slice(0, max - urls.length);
    if (!picked.length) return;
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Upload failed");
        added.push(data.url as string);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (added.length) onChange([...urls, ...added]);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {urls.map((u, i) => (
        <div
          key={`${u}-${i}`}
          className="relative size-24 overflow-hidden rounded-lg border bg-muted"
        >
          <Image src={u} alt="" fill sizes="96px" className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onChange(urls.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 rounded bg-background/80 p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      {urls.length < max && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-accent"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          <span className="text-xs">{uploading ? "Uploading…" : "Add photos"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
