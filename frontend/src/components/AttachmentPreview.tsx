import { ExternalLink, FileCode2, FileText, Paperclip, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PreviewKind = "image" | "pdf" | "text" | "unsupported";

type AttachmentPreviewProps = {
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  onRemove?: () => void;
  removeDisabled?: boolean;
  badge?: string;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const getPreviewKind = (name: string, mimeType?: string): PreviewKind => {
  const extension = getExtension(name);

  if (
    mimeType?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)
  ) {
    return "image";
  }

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    mimeType?.startsWith("text/") ||
    [
      "txt",
      "md",
      "html",
      "htm",
      "css",
      "js",
      "ts",
      "tsx",
      "jsx",
      "json",
      "liquid",
      "csv"
    ].includes(extension)
  ) {
    return "text";
  }

  return "unsupported";
};

export function AttachmentPreview({
  url,
  name,
  mimeType,
  size,
  onRemove,
  removeDisabled = false,
  badge
}: AttachmentPreviewProps) {
  const previewKind = useMemo(() => getPreviewKind(name, mimeType), [name, mimeType]);
  const [textPreview, setTextPreview] = useState("");
  const [textError, setTextError] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImagePreviewUrl(null);
    setImageError(false);
  }, [url]);

  useEffect(() => {
    if (previewKind !== "image") {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const loadImagePreview = async () => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Could not load image preview");
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setImagePreviewUrl(objectUrl);
          setImageError(false);
        }
      } catch {
        if (!cancelled) {
          setImageError(true);
        }
      }
    };

    void loadImagePreview();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [previewKind, url]);

  useEffect(() => {
    if (previewKind !== "text") {
      setTextPreview("");
      setTextError("");
      return;
    }

    const loadTextPreview = async () => {
      setIsLoadingText(true);
      setTextError("");

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Could not load file preview");
        }

        const text = await response.text();
        setTextPreview(text.slice(0, 8000));
      } catch {
        setTextError("Preview unavailable. Open the file to view full content.");
      } finally {
        setIsLoadingText(false);
      }
    };

    void loadTextPreview();
  }, [previewKind, url]);

  return (
    <article className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <div className="min-w-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-navy-800 hover:underline"
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{name}</span>
            {size !== undefined && (
              <span className="text-xs text-gray-500">({formatFileSize(size)})</span>
            )}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          {badge && (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">
              {badge}
            </p>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removeDisabled}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="bg-gray-50 p-3">
        {previewKind === "image" && (
          <a href={url} target="_blank" rel="noreferrer" className="inline-block">
            {imageError ? (
              <div className="flex h-28 w-28 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white px-2 text-center">
                <p className="text-[11px] font-semibold leading-4 text-gray-500">
                  Preview unavailable.
                  <span className="mt-1 block text-navy-800">Open file</span>
                </p>
              </div>
            ) : imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={name}
                className="h-28 w-28 rounded-md border border-gray-200 object-cover object-center bg-white"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-500">
                Loading preview...
              </div>
            )}
          </a>
        )}

        {previewKind === "pdf" && (
          <iframe
            src={url}
            title={name}
            className="h-80 w-full rounded-md border border-gray-200 bg-white"
          />
        )}

        {previewKind === "text" && (
          <div className="rounded-md border border-gray-200 bg-white">
            {isLoadingText ? (
              <p className="p-3 text-xs font-semibold text-gray-500">Loading preview...</p>
            ) : textError ? (
              <p className="p-3 text-xs font-semibold text-amber-800">{textError}</p>
            ) : (
              <pre className="max-h-64 overflow-auto p-3 font-mono text-xs leading-6 text-gray-800">
                {textPreview || "(Empty file)"}
              </pre>
            )}
          </div>
        )}

        {previewKind === "unsupported" && (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-gray-300 bg-white px-4 py-6">
            {mimeType?.includes("word") || getExtension(name) === "doc" || getExtension(name) === "docx" ? (
              <FileText className="h-8 w-8 text-navy-700" />
            ) : (
              <FileCode2 className="h-8 w-8 text-navy-700" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">No inline preview for this file type</p>
              <p className="text-xs text-gray-500">Click the file name above to open or download it.</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

type PendingFilePreviewProps = {
  file: File;
  previewUrl: string;
  onRemove: () => void;
};

export function PendingFilePreview({ file, previewUrl, onRemove }: PendingFilePreviewProps) {
  const previewKind = getPreviewKind(file.name, file.type);

  return (
    <article className="relative w-36 shrink-0 overflow-hidden rounded-md border border-violet-200 bg-white">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50"
        title="Remove file"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="flex h-28 items-center justify-center bg-violet-50/60 p-2">
        {previewKind === "image" ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full rounded-md border border-violet-200 object-cover object-center bg-white"
          />
        ) : previewKind === "pdf" ? (
          <FileText className="h-10 w-10 text-violet-800" />
        ) : previewKind === "text" ? (
          <FileCode2 className="h-10 w-10 text-violet-800" />
        ) : (
          <FileText className="h-10 w-10 text-violet-800" />
        )}
      </div>

      <div className="border-t border-violet-100 px-2 py-2">
        <p className="truncate text-xs font-semibold text-violet-900" title={file.name}>
          {file.name}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold text-gray-500">{formatFileSize(file.size)}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
          Pending
        </p>
      </div>
    </article>
  );
}
