import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

export function truncateAddress(value: string, chars = 4) {
  if (!value) return "";
  return `${value.slice(0, chars + 2)}...${value.slice(-chars)}`;
}

export function formatRelativeTime(date: Date | string | null | undefined) {
  if (!date) return "never";
  const value = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - value.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  return `${Math.round(diff / day)}d ago`;
}

export function scoreTone(score: number) {
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}
