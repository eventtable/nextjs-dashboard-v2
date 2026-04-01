"use client";

import { useCallback, useState } from "react";
import { addFile, type UploadedFile } from "@/store/fileStore";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    Array.from(fileList).forEach((file) => {
      const id = crypto.randomUUID();
      setUploading((prev) => [...prev, id]);

      // Simulate upload delay
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        const uploaded: UploadedFile = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          url,
        };
        addFile(uploaded);
        setUploading((prev) => prev.filter((uid) => uid !== id));
      }, 800 + Math.random() * 400);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      <input
        id="file-input"
        type="file"
        multiple
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleInputChange}
        aria-label="Datei auswählen"
      />

      <svg
        className={`mb-4 h-10 w-10 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>

      <p className="text-sm font-medium text-gray-700">
        Dateien hierher ziehen oder{" "}
        <label
          htmlFor="file-input"
          className="cursor-pointer text-blue-600 hover:underline"
        >
          auswählen
        </label>
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Alle Dateitypen unterstützt · Mehrere Dateien möglich
      </p>

      {uploading.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          {uploading.length === 1
            ? "1 Datei wird hochgeladen…"
            : `${uploading.length} Dateien werden hochgeladen…`}
        </div>
      )}
    </div>
  );
}
