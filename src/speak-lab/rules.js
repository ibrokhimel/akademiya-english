// The page's pure rules: no DOM, no network, tested in node (rules.test.js).

// after a dropped socket: wait this long before attempt `attempt` (0-based), or give up (null) after two
export function nextReconnect(attempt) {
  return [500, 1500][attempt] ?? null;
}
