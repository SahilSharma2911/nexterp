"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Camera barcode scanner: opens the device camera (rear by default), decodes
// 1D/2D barcodes live via ZXing, and calls onDetected with the first hit.
// Mount it only while scanning (conditional render) so the camera starts/stops
// with the dialog. Needs a secure context (HTTPS or localhost) for camera access.
export function BarcodeCameraScanner({
  title = "Scan a barcode",
  onDetected,
  onClose,
}: {
  title?: string;
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let done = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, _err, c) => {
          controls = c;
          if (result && !done) {
            done = true;
            c.stop();
            onDetected(result.getText());
          }
        },
      )
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Couldn't start the camera. Check permissions and use HTTPS.",
        ),
      );

    return () => {
      try {
        controls?.stop();
      } catch {
        /* already stopped */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Point the camera at the barcode — it reads automatically.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              muted
              playsInline
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
