/**
 * Shared timing for UITypewriter and its card highlight window.
 * Kept in one place so the highlight stays on until just before deletion starts.
 */
export const BACK_DELAY_MS = 24000;
export const HIGHLIGHT_SETTLE_MS = 300;
export const HIGHLIGHT_CLEAR_LEAD_MS = 300;

/**
 * Delay from onStringTyped until the highlight clears, ending `lead` ms
 * before `backDelay` finishes and backspacing begins.
 */
export const highlightHoldMs = (
  backDelay = BACK_DELAY_MS,
  lead = HIGHLIGHT_CLEAR_LEAD_MS
) => Math.max(0, backDelay - lead);

export const clearHighlightTimers = (highlightTimerRef, clearTimerRef) => {
  if (highlightTimerRef.current) {
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = null;
  }
  if (clearTimerRef.current) {
    clearTimeout(clearTimerRef.current);
    clearTimerRef.current = null;
  }
};

export const scheduleRoleHighlight = ({
  title,
  updateCurrentPhrase,
  highlightTimerRef,
  clearTimerRef,
  settleMs = HIGHLIGHT_SETTLE_MS,
  backDelayMs = BACK_DELAY_MS,
  clearLeadMs = HIGHLIGHT_CLEAR_LEAD_MS,
}) => {
  clearHighlightTimers(highlightTimerRef, clearTimerRef);

  const clearAtMs = highlightHoldMs(backDelayMs, clearLeadMs);

  // Start highlighting after a brief settle delay once the sentence finishes typing.
  highlightTimerRef.current = setTimeout(() => {
    updateCurrentPhrase(title);
  }, settleMs);

  // Clear highlighting before backDelay ends so cards dim just before deletion starts.
  clearTimerRef.current = setTimeout(() => {
    clearHighlightTimers(highlightTimerRef, clearTimerRef);
    updateCurrentPhrase('');
  }, clearAtMs);
};
