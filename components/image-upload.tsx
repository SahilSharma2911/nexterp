"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Reusable image picker. Uploads via POST /api/uploads (S3 in prod, local disk
// in dev) and hands back the stored URL. Drop it into any form:
//   <ImageUpload value={field.value} onChange={field.onChange} />
export function ImageUpload({
  value,
  onChange,
  className,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Native fetch (not the JSON axios instance) so the multipart boundary is
      // set correctly; the session cookie rides along same-origin.
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Upload failed");
      onChange(data.url as string);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {value ? (
          <Image
            src={value}
            alt="Uploaded image"
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {uploading ? "Uploading…" : value ? "Replace" : "Upload image"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={uploading}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
