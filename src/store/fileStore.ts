"use client";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  url: string;
}

// Simple in-memory store for uploaded files (client-side only)
let files: UploadedFile[] = [];
let listeners: (() => void)[] = [];

export function getFiles(): UploadedFile[] {
  return [...files];
}

export function addFile(file: UploadedFile) {
  files = [file, ...files];
  listeners.forEach((l) => l());
}

export function removeFile(id: string) {
  files = files.filter((f) => f.id !== id);
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
