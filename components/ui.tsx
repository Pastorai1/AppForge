"use client";

import Link from "next/link";
import { AiError } from "@/lib/api";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}

export function Spinner({ label = "Generating…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  const isAi = error instanceof AiError;
  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="rounded-lg border border-red-700/40 bg-red-900/20 p-4 text-sm text-red-300">
      {message}
      {isAi && error.upgrade && (
        <div className="mt-2">
          <Link href="/dashboard/billing" className="font-medium underline">
            Upgrade to Pro →
          </Link>
        </div>
      )}
    </div>
  );
}

export function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color =
    value >= 70 ? "bg-green-500" : value >= 45 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-medium text-gray-200">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text)}
      className="chip hover:border-primary"
    >
      Copy
    </button>
  );
}
