// Allowlist for push subscription endpoints. The server POSTs to whatever
// endpoint a user submits, so an unchecked https URL would let a signed-in
// user aim the server at any host it can reach (blind SSRF). Browsers only
// ever hand out endpoints on their vendor's push service, so accept those
// and nothing else. No imports, so node --test can run it directly.

const EXACT_HOSTS = new Set([
  "fcm.googleapis.com", // Chrome, Edge, Android browsers
  "web.push.apple.com", // Safari and installed iOS web apps
  "updates.push.services.mozilla.com", // Firefox
]);

const HOST_SUFFIXES = [
  ".push.apple.com",
  ".push.services.mozilla.com",
  ".notify.windows.com", // Windows Notification Service (Edge)
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  const host = url.hostname.toLowerCase();
  return EXACT_HOSTS.has(host) || HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}
