"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GripVertical, ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { cn, createId, fileToDataUrl, validateImageFile } from "@/lib/utils";

export interface UploadedPhoto {
  id: string;
  /** Data URL (instant preview) — replaced by the CDN URL after upload. */
  previewUrl: string;
  remoteUrl?: string;
  name: string;
  uploading: boolean;
}

export interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  maxFiles?: number;
  maxMb?: number;
  /**
   * Uploads a single file and resolves its remote URL. Used when `uploadFiles`
   * is not supplied.
   */
  uploadFile?: (file: File) => Promise<string>;
  /**
   * Batch uploads several files in ONE multipart request and resolves their
   * remote URLs in the same order. Preferred over `uploadFile` because the
   * backend accepts up to `maxFiles` files per request under the `photos` key.
   */
  uploadFiles?: (files: File[]) => Promise<string[]>;
  className?: string;
}

const ACCEPT = "image/png,image/jpeg,image/webp";

/**
 * Drag-and-drop photo intake with live thumbnails, reordering and a
 * primary-photo marker. Files under `maxMb` only, images only.
 */
export function PhotoUploader({
  photos,
  onChange,
  maxFiles = 3,
  maxMb = 8,
  uploadFile,
  uploadFiles,
  className,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const [reorderIndex, setReorderIndex] = useState<number | null>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const accepted: UploadedPhoto[] = [];
      const pending: { photo: UploadedPhoto; file: File }[] = [];
      let slots = photos.length;

      for (const file of incoming) {
        const verdict = validateImageFile(file, {
          maxMb,
          maxFiles,
          currentCount: slots,
        });
        if (!verdict.ok) {
          toastError(verdict.reason);
          continue;
        }

        let previewUrl: string;
        try {
          previewUrl = await fileToDataUrl(file);
        } catch {
          toastError("Could not read the file.");
          continue;
        }

        const photo: UploadedPhoto = {
          id: createId("photo"),
          previewUrl,
          name: file.name,
          uploading: Boolean(uploadFile || uploadFiles),
        };
        accepted.push(photo);
        pending.push({ photo, file });
        slots += 1;
      }

      if (accepted.length === 0) return;

      // Show instant local previews while the upload is in flight.
      const committed = [...photos, ...accepted];
      onChange(committed);

      if (pending.length === 0) return;

      /** Mark the given photos as settled, optionally attaching a remote URL. */
      const settle = (ids: Set<string>, urls: Map<string, string>) => {
        onChange(
          committed.map((item) =>
            ids.has(item.id)
              ? { ...item, remoteUrl: urls.get(item.id) ?? item.remoteUrl, uploading: false }
              : item,
          ),
        );
      };

      try {
        if (uploadFiles) {
          // One multipart request for the whole batch (`photos` field name).
          const urls = await uploadFiles(pending.map((entry) => entry.file));
          const map = new Map<string, string>();
          const ids = new Set<string>();
          pending.forEach((entry, index) => {
            const url = urls[index];
            if (url) map.set(entry.photo.id, url);
            ids.add(entry.photo.id);
          });
          settle(ids, map);
          toastSuccess("Photos uploaded successfully.");
        } else if (uploadFile) {
          const map = new Map<string, string>();
          const ids = new Set<string>();
          await Promise.all(
            pending.map(async (entry) => {
              try {
                const url = await uploadFile(entry.file);
                map.set(entry.photo.id, url);
              } finally {
                ids.add(entry.photo.id);
              }
            }),
          );
          settle(ids, map);
          toastSuccess("Photos uploaded successfully.");
        }
      } catch {
        settle(
          new Set(pending.map((entry) => entry.photo.id)),
          new Map(),
        );
        toastError("Photo upload failed.");
      }
    },
    [photos, onChange, maxFiles, maxMb, uploadFile, uploadFiles, toastError, toastSuccess],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingOver(false);
    if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
  };

  const remove = (id: string) => {
    onChange(photos.filter((photo) => photo.id !== id));
  };

  const makePrimary = (id: string) => {
    const target = photos.find((photo) => photo.id === id);
    if (!target) return;
    onChange([target, ...photos.filter((photo) => photo.id !== id)]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const full = photos.length >= maxFiles;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDraggingOver(true);
        }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={onDrop}
        onClick={() => !full && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "relative grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center",
          "transition-all duration-250 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[#FFC107]/70",
          draggingOver
            ? "border-[#FFC107] bg-[#FFC107]/10 ring-4 ring-[#FFC107]/20"
            : "border-white/15 bg-white/[0.02] hover:border-[#FFC107]/45 hover:bg-white/[0.04]",
          full && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <motion.div
          animate={draggingOver ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-gradient text-white shadow-lg shadow-[#006A4E]/40">
            {draggingOver ? <ImagePlus className="size-6" /> : <UploadCloud className="size-6" />}
          </span>
          <p className="text-sm font-semibold text-white">
            Drag and drop photos or click here
          </p>
          <p className="text-xs text-white/45">
            Up to {maxFiles} photos • PNG, JPG, WebP • max {maxMb}MB
          </p>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {photos.length > 0 && (
          <motion.ul layout className="grid grid-cols-3 gap-2.5">
            {photos.map((photo, index) => (
              <motion.li
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable
                onDragStart={() => setReorderIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (reorderIndex !== null) move(reorderIndex, index);
                  setReorderIndex(null);
                }}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl border bg-[#0D1117]",
                  index === 0 ? "border-[#FFC107]/70" : "border-white/10",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  className="size-full object-cover"
                  draggable={false}
                />

                {photo.uploading && (
                  <span className="absolute inset-0 grid place-items-center bg-[#0D1117]/70">
                    <Loader2 className="size-5 animate-spin text-[#FFC107]" />
                  </span>
                )}

                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[#FFC107] px-1.5 py-0.5 text-[0.6rem] font-bold text-[#0D1117]">
                    <Star className="size-2.5" /> Primary
                  </span>
                )}

                <span className="absolute right-1.5 top-1.5 grid size-5 cursor-grab place-items-center rounded-md bg-[#0D1117]/70 text-white/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="size-3" />
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-[#0D1117] to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      makePrimary(photo.id);
                    }}
                    aria-label="Make primary photo"
                    className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-[#FFC107]"
                  >
                    <Star className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(photo.id);
                    }}
                    aria-label="Remove photo"
                    className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-[#F42A41]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <p className="text-[0.7rem] text-white/35">
        The first photo will be used as the primary portrait.
      </p>
    </div>
  );
}
