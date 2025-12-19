export type AppLogEventKind = 'request' | 'api' | 'error';

export type AppLogEvent = {
  kind: AppLogEventKind;
  ts: string;
  method?: string;
  path?: string;
  status?: number;
  dur_ms?: number;
  ua?: string | null;
  ip?: string | null;
  notes?: string;
  [key: string]: unknown;
};

/**
 * Lightweight JSON logger for the web app.
 * - Uses console.log so it works in both Node.js and edge runtimes.
 * - One-line JSON per log entry for easy CloudWatch Logs search.
 */
export function logAppEvent(event: AppLogEvent) {
  try {
    // Keep payload small and stable – prepend an app identifier for filtering.
    const payload = {
      app: 'sigbang-web',
      ...event,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  } catch {
    // Best-effort only – never throw from logger.
  }
}

