'use client';

import * as React from 'react';

export type ToastProps = {
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive';
};

export type ToastActionElement = React.ReactElement;

export function Toast({ children }: { children?: React.ReactNode }) {
  return <div className="toast">{children}</div>;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ToastViewport() {
  return null;
}

export function ToastTitle({ children }: { children?: React.ReactNode }) {
  return <div className="toast-title">{children}</div>;
}

export function ToastDescription({ children }: { children?: React.ReactNode }) {
  return <div className="toast-description">{children}</div>;
}

export function ToastClose() {
  return null;
}

export function ToastAction({ children }: { children?: React.ReactNode }) {
  return <button>{children}</button>;
}

export function Toaster() {
  return null;
}
