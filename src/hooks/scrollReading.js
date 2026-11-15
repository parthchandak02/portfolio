// Which card the band bar names, and where a jump scrolls so that card is the one named.
// useScrollHighlight reads the page and calls these. The rules themselves are here.

// The hero strip hands over to the band bar once its top reaches this many px below the top of the screen.
// At 43 the strip's hairline sits exactly on the bar's, so the hand-off morph moves lines along one line.
export const STICK_AT = 43;

// The card you are on is the one in the middle of what you can see: between the band bar (with its veil)
// and the bottom of the screen.
export const BAR_CLEARANCE = 110;

export const readingLineFromRect = (rect) =>
  (rect.top + BAR_CLEARANCE + rect.bottom) / 2;

// The last cards can never scroll up to that line, so over the final stretch the line glides down
// to meet them, reaching the last card just as the page bottoms out.
export const glideReadingLine = (line, remaining, lastBottom) => {
  const target = lastBottom - remaining - 12;
  if (target > line && remaining < target - line) return target - remaining;
  return line;
};

// '--row-h' is a length such as '46px'. A missing or zero value keeps the strip's own row.
export const rowHeightOf = (raw) => parseFloat(raw) || 46;

// The bar takes over from the hero strip at the strip's own spot: while the strip is still on its way
// up the bar stays away, and scrolling back up hands the spot back to the strip. With the lanes open,
// the hand-off waits for the last lane, so the bar and the lanes are never on screen together.
// With no strip on the page, a short scroll still counts as the hero.
export const barIsStuck = ({ scrollTop, stage }) => {
  if (stage) {
    return stage.bottom - stage.rowH <= stage.containerTop + STICK_AT;
  }
  return scrollTop > 40;
};

/**
 * The card the reading line is on.
 * items: { category, title, top, bottom, left, height } in page order.
 * scroll: { top, bottom }, the scroller's box on screen.
 * line: the reading line, in the same coordinates.
 * drawers: open tile details, { top, bottom, owner, category, title } in page order, or a function
 *   that returns them. Read only when no card crosses the line. The first drawer the line crosses
 *   counts, and only when it has its tile (owner).
 * selected: { top, bottom }, or a function returning that or null. Read only when the line is in a
 *   gap and the card so far is not Selected work.
 */
export const cardOnLine = ({ items, scroll, line, drawers, selected }) => {
  let category = 'all';
  let title = null;
  let smallestDistance = Infinity;
  const crossing = [];

  items.forEach((item) => {
    if (item.top <= line && item.bottom >= line) crossing.push(item);

    // Otherwise (the line is in a gap) fall back to the closest card that is actually on screen
    const distance = Math.abs(item.top + item.height * 0.5 - line);
    const visible =
      Math.min(item.bottom, scroll.bottom) - Math.max(item.top, scroll.top);
    if (visible / item.height > 0.15 && distance < smallestDistance) {
      smallestDistance = distance;
      category = item.category || 'all';
      title = item.title;
    }
  });

  // Tiles side by side cross the line together. Hand the row's height out among them, left to right,
  // so scrolling through the row walks the highlight across it and every tile gets its turn.
  let onLine = null;
  if (crossing.length === 1) onLine = crossing[0];
  else if (crossing.length > 1) {
    const row = [...crossing].sort((a, b) => a.left - b.left);
    const top = Math.min(...row.map((c) => c.top));
    const bottom = Math.max(...row.map((c) => c.bottom));
    const progress = (line - top) / Math.max(1, bottom - top);
    onLine = row[Math.min(row.length - 1, Math.floor(progress * row.length))];
  }

  // Reading an opened tile's details, under its row: the tile they belong to stays the one you are on
  if (!onLine && drawers) {
    const list = typeof drawers === 'function' ? drawers() : drawers;
    const drawer = list.find((d) => d.top <= line && d.bottom >= line);
    if (drawer && drawer.owner) onLine = drawer;
  }

  if (onLine) {
    category = onLine.category || 'all';
    title = onLine.title;
  } else if (category === 'all') {
    // Above the first card (still in the hero) show the first band; below the last card keep the last
    const above = items[0].top > line;
    const edge = above ? items[0] : items[items.length - 1];
    category = edge.category || 'all';
    title = above ? null : edge.title;
  }

  // In the gaps around Selected work's large cards, and on the lanes after them, the bar keeps saying
  // Selected work; once a card reaches the reading line, the bar names that card.
  if (selected && category !== 'selected' && !onLine) {
    const box = typeof selected === 'function' ? selected() : selected;
    if (box && box.top < line && box.bottom > scroll.top + BAR_CLEARANCE + 60) {
      category = 'selected';
      title = null;
    }
  }

  return { category, title };
};

// Scroll so a card sits on the reading line and is the one lit. Tiles side by side share the line in
// turn, left to right, so a tile is brought to its own share of the row. A block taller than most of
// the screen (the Lab) is brought in by its top, just under the bar, so the jump lands at its start.
export const scrollTopForCard = ({ rect, row, view, scrollTop, line }) => {
  const n = Math.max(1, row.length);
  const k = Math.max(
    0,
    row.findIndex((x) => x.isTarget)
  );
  const top = Math.min(rect.top, ...row.map((x) => x.top));
  const bottom = Math.max(rect.bottom, ...row.map((x) => x.bottom));
  if (bottom - top > (view.height - BAR_CLEARANCE) * 0.7) {
    return Math.max(0, scrollTop + top - (view.top + BAR_CLEARANCE));
  }
  const anchor = top + ((bottom - top) * (k + 0.5)) / n;
  return Math.max(0, scrollTop + anchor - line);
};
