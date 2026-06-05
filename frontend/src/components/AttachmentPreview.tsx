import { ExternalLink, FileCode2, FileText, ImageIcon, Paperclip, Trash2 } from "lucide-react";
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
            <img
              src={url}
              alt={name}
              className="h-28 w-28 rounded-md border border-gray-200 object-cover object-left bg-white"
            />
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
  const [textPreview, setTextPreview] = useState("");

  useEffect(() => {
    if (previewKind !== "text") {
      setTextPreview("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setTextPreview(result.slice(0, 8000));
    };

    reader.readAsText(file);
  }, [file, previewKind]);

  return (
    <article className="overflow-hidden rounded-md border border-violet-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 px-3 py-2">
        <div className="min-w-0">
          <p className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-violet-900">
            <ImageIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file.name}</span>
            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">
            Pending upload
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <div className="bg-violet-50/50 p-3">
        {previewKind === "image" && (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-28 w-28 rounded-md border border-violet-200 object-cover object-left bg-white"
          />
        )}

        {previewKind === "pdf" && (
          <iframe
            src={previewUrl}
            title={file.name}
            className="h-80 w-full rounded-md border border-violet-200 bg-white"
          />
        )}

        {previewKind === "text" && (
          <pre className="max-h-64 overflow-auto rounded-md border border-violet-200 bg-white p-3 font-mono text-xs leading-6 text-gray-800">
            {textPreview || "Loading preview..."}
          </pre>
        )}

        {previewKind === "unsupported" && (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-violet-200 bg-white px-4 py-6">
            <FileText className="h-8 w-8 text-violet-800" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Preview after you save</p>
              <p className="text-xs text-gray-500">
                This file type will be uploaded when you click Update Submission.
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
