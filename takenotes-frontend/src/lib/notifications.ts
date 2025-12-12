"use client";

import type { AxiosError } from "axios";

export type NotificationType = "info" | "success" | "warning" | "error";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
};

type Listener = (n: Notification) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(n: Omit<Notification, "id"> & { id?: string }): Notification {
  const withId: Notification = { id: n.id || cryptoRandomId(), ...n } as Notification;
  for (const l of listeners) l(withId);
  return withId;
}

export function notifyInfo(message: string, title?: string) {
  return notify({ type: "info", message, title });
}
export function notifySuccess(message: string, title?: string) {
  return notify({ type: "success", message, title });
}
export function notifyWarning(message: string, title?: string) {
  return notify({ type: "warning", message, title });
}
export function notifyError(message: string, title?: string) {
  return notify({ type: "error", message, title });
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2);
}

export function extractAxiosErrorMessage(err: unknown): string {
  // Default fallback
  let fallback = "An unexpected error occurred";
  const ax = err as Partial<AxiosError> & { message?: string };
  if (!ax) return fallback;

  // Network errors
  if ((ax as any).code === "ERR_NETWORK") {
    return "Network error. Please check your connection.";
  }

  // If server provided data, try to parse common DRF shapes
  const resp = ax.response as any;
  const data = resp?.data;
  if (data == null) {
    return ax.message || fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.join("\n");
  }

  // DRF common patterns
  if (typeof data === "object") {
    // detail: "..."
    if (typeof data.detail === "string") return data.detail;
    // message or error string
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;

    // non_field_errors: ["..."]
    const nfe = data.non_field_errors;
    if (Array.isArray(nfe) && nfe.length) return nfe.join("\n");

    // field errors: { field: ["msg1", "msg2"], ... }
    const parts: string[] = [];
    for (const [key, val] of Object.entries<any>(data)) {
      if (key === "errors" && typeof val === "object") {
        for (const [f, msgs] of Object.entries<any>(val)) {
          if (Array.isArray(msgs)) parts.push(`${f}: ${msgs.join(", ")}`);
          else if (typeof msgs === "string") parts.push(`${f}: ${msgs}`);
        }
      } else if (Array.isArray(val)) {
        parts.push(`${key}: ${val.join(", ")}`);
      } else if (typeof val === "string") {
        parts.push(`${key}: ${val}`);
      }
    }
    if (parts.length) return parts.join("\n");
  }

  return ax.message || fallback;
}

export function notifyErrorFromAxios(err: unknown, title = "Request failed") {
  const msg = extractAxiosErrorMessage(err);
  return notifyError(msg, title);
}

