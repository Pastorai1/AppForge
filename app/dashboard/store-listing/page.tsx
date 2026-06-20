"use client";

import { useEffect, useState } from "react";
import { callAi } from "@/lib/api";
import type { SavedListing, StoreListing } from "@/lib/types";
import {
  getListings,
  saveListing,
  deleteListing,
} from "@/lib/listings-store";
import { isSupabaseConfigured } from "@/lib/env";
import { PageHeader, Spinner, ErrorBanner } from "@/components/ui";

type FieldKey =
  | "title"
  | "subtitle"
  | "promotionalText"
  | "description"
  | "keywords"
  | "shortDescription"
  | "fullDescription";

const LIMITS: Record<FieldKey, number> = {
  title: 30,
  subtitle: 30,
  promotionalText: 170,
  description: 4000,
  keywords: 100,
  shortDescription: 80,
  fullDescription: 4000,
};

export default function StoreListingPage() {
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [listing, setListing] = useState<StoreListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [saved, setSaved] = useState<SavedListing[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const synced = isSupabaseConfigured();

  useEffect(() => {
    getListings()
      .then(setSaved)
      .catch(() => {
        /* non-fatal: saved-listings panel just stays empty */
      });
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    setJustSaved(false);
    try {
      const { data } = await callAi<StoreListing>("/api/ai/store-listing", {
        appName,
        description,
        audience,
      });
      setListing(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!listing || saving) return;
    setSaving(true);
    setError(null);
    try {
      const record = await saveListing({
        appName: appName.trim() || "Untitled app",
        listing,
      });
      setSaved((prev) => [record, ...prev]);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  function load(record: SavedListing) {
    setAppName(record.appName);
    setListing(record.listing);
    setError(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function remove(id: string) {
    const snapshot = saved;
    setSaved((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteListing(id);
    } catch (e) {
      setError(e);
      setSaved(snapshot);
    }
  }

  function setField(
    platform: "appStore" | "playStore",
    field: FieldKey,
    value: string,
  ) {
    setListing((prev) =>
      prev
        ? { ...prev, [platform]: { ...prev[platform], [field]: value } }
        : prev,
    );
  }

  return (
    <div>
      <PageHeader
        title="Store Listing Generator"
        subtitle="App Store + Play Store copy with live character counters and per-field AI rewrites."
      />

      <div className="card mb-6 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">App name</label>
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g. TrailMate"
            className="input"
          />
        </div>
        <div>
          <label className="label">What it does</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One-line description"
            className="input"
          />
        </div>
        <div>
          <label className="label">Target audience</label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Who it's for"
            className="input"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            onClick={generate}
            disabled={loading || !appName.trim()}
            className="btn-primary"
          >
            {loading ? "Generating…" : "Generate listings"}
          </button>
        </div>
      </div>

      {saved.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Saved listings
          </h2>
          <div className="flex flex-wrap gap-2">
            {saved.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5"
              >
                <button
                  onClick={() => load(s)}
                  className="text-sm text-gray-200 hover:text-primary"
                  title="Load this listing"
                >
                  {s.appName || "Untitled app"}
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="text-xs text-gray-500 hover:text-red-400"
                  aria-label="Delete saved listing"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner label="Writing your listings…" />}
      {error ? <ErrorBanner error={error} /> : null}

      {listing && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save listing"}
            </button>
            <span className="text-xs text-gray-500">
              {synced
                ? "Saved to your account."
                : "Saved in your browser (connect Supabase to sync)."}
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-semibold text-white">App Store</h2>
            <Field
              label="Title"
              field="title"
              value={listing.appStore.title}
              appName={appName}
              onChange={(v) => setField("appStore", "title", v)}
            />
            <Field
              label="Subtitle"
              field="subtitle"
              value={listing.appStore.subtitle}
              appName={appName}
              onChange={(v) => setField("appStore", "subtitle", v)}
            />
            <Field
              label="Promotional text"
              field="promotionalText"
              value={listing.appStore.promotionalText}
              appName={appName}
              textarea
              onChange={(v) => setField("appStore", "promotionalText", v)}
            />
            <Field
              label="Keywords"
              field="keywords"
              value={listing.appStore.keywords}
              appName={appName}
              onChange={(v) => setField("appStore", "keywords", v)}
            />
            <Field
              label="Description"
              field="description"
              value={listing.appStore.description}
              appName={appName}
              textarea
              rows={10}
              onChange={(v) => setField("appStore", "description", v)}
            />
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-white">Google Play</h2>
            <Field
              label="Title"
              field="title"
              value={listing.playStore.title}
              appName={appName}
              onChange={(v) => setField("playStore", "title", v)}
            />
            <Field
              label="Short description"
              field="shortDescription"
              value={listing.playStore.shortDescription}
              appName={appName}
              textarea
              onChange={(v) => setField("playStore", "shortDescription", v)}
            />
            <Field
              label="Full description"
              field="fullDescription"
              value={listing.playStore.fullDescription}
              appName={appName}
              textarea
              rows={10}
              onChange={(v) => setField("playStore", "fullDescription", v)}
            />
          </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  field,
  value,
  appName,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  field: FieldKey;
  value: string;
  appName: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  const limit = LIMITS[field];
  const over = value.length > limit;
  const [rewriting, setRewriting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function rewrite() {
    setRewriting(true);
    try {
      const res = await fetch("/api/ai/store-listing/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, current: value, appName }),
      });
      const json = await res.json();
      if (res.ok && json.data?.text) onChange(json.data.text);
      else alert(json.error ?? "Rewrite failed.");
    } finally {
      setRewriting(false);
    }
  }

  function copy() {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <span
          className={`text-xs ${over ? "text-red-400" : "text-gray-500"}`}
        >
          {value.length}/{limit}
        </span>
      </div>
      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={`input resize-none ${over ? "border-red-500" : ""}`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`input ${over ? "border-red-500" : ""}`}
        />
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={rewrite}
          disabled={rewriting}
          className="chip hover:border-primary"
        >
          {rewriting ? "Rewriting…" : "AI rewrite"}
        </button>
        <button onClick={copy} className="chip hover:border-primary">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
