/**
 * Syncs row drawer tracking by entry key across renders, dropping entries
 * whose key disappeared or shifted to another row (for example when expanding
 * a preview list inserts earlier cards), and resets when column count changes.
 */
export const syncShownRows = ({ shown, entries, openKey, cols, prevCols }) => {
  const indexByKey = new Map(entries.map((e, i) => [e.key, i]));
  const openIndex = openKey != null ? (indexByKey.get(openKey) ?? -1) : -1;
  const openRow = openIndex < 0 ? -1 : Math.floor(openIndex / cols);

  const next = {};
  if (prevCols === cols) {
    for (const [rowKey, key] of Object.entries(shown)) {
      const row = Number(rowKey);
      const index = indexByKey.get(key);
      if (index != null && Math.floor(index / cols) === row) {
        next[row] = key;
      }
    }
  }
  if (openIndex >= 0) next[openRow] = openKey;

  return { shown: next, openIndex, openRow };
};

/**
 * Resolves stored row entry keys back to current entry objects and indices.
 */
export const resolveShownRows = (shown, entries) => {
  const indexByKey = new Map(entries.map((e, i) => [e.key, i]));
  const rows = [];
  const byRow = {};
  for (const [rowKey, key] of Object.entries(shown)) {
    const index = indexByKey.get(key);
    if (index == null) continue;
    const item = { row: Number(rowKey), index, entry: entries[index] };
    rows.push(item);
    byRow[item.row] = item;
  }
  return { rows, byRow };
};
