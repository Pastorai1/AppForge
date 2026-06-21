"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppOpportunity, SavedItemKind, TopApp } from "@/lib/types";
import { getSavedItems, saveItem, deleteSavedItem } from "@/lib/saved-store";

/**
 * Manages the saved/bookmarked state for one list kind. Tracks which item keys
 * are saved (and their row ids) so cards can toggle without a full reload.
 */
export function useSaved(kind: SavedItemKind) {
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    try {
      const items = await getSavedItems(kind);
      const map: Record<string, string> = {};
      for (const i of items) map[i.itemKey] = i.id;
      setSavedMap(map);
    } catch {
      /* non-fatal */
    }
  }, [kind]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isSaved = useCallback(
    (itemKey: string) => itemKey.trim().toLowerCase() in savedMap,
    [savedMap],
  );

  const isBusy = useCallback(
    (itemKey: string) => busy.has(itemKey.trim().toLowerCase()),
    [busy],
  );

  const toggle = useCallback(
    async (itemKey: string, payload: TopApp | AppOpportunity) => {
      const key = itemKey.trim().toLowerCase();
      if (!key || busy.has(key)) return;
      setBusy((prev) => new Set(prev).add(key));
      try {
        if (key in savedMap) {
          const id = savedMap[key];
          setSavedMap((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          await deleteSavedItem(id);
        } else {
          const saved = await saveItem({ kind, itemKey: key, payload });
          setSavedMap((prev) => ({ ...prev, [key]: saved.id }));
        }
      } catch {
        await reload(); // resync on failure
      } finally {
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [busy, savedMap, kind, reload],
  );

  return { isSaved, isBusy, toggle };
}
