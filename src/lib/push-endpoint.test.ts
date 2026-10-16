import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedPushEndpoint } from "./push-endpoint.ts";

test("accepts the real push services", () => {
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(isAllowedPushEndpoint("https://web.push.apple.com/QWxs"), true);
  assert.equal(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x"), true);
  assert.equal(isAllowedPushEndpoint("https://abc.notify.windows.com/w/?token=x"), true);
});

test("rejects non-https, credentials and odd ports", () => {
  assert.equal(isAllowedPushEndpoint("http://fcm.googleapis.com/x"), false);
  assert.equal(isAllowedPushEndpoint("https://user:pw@fcm.googleapis.com/x"), false);
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com:8443/x"), false);
});

test("rejects internal and attacker hosts", () => {
  assert.equal(isAllowedPushEndpoint("https://localhost/x"), false);
  assert.equal(isAllowedPushEndpoint("https://192.168.10.15/x"), false);
  assert.equal(isAllowedPushEndpoint("https://example.com/x"), false);
});

test("rejects lookalike hosts", () => {
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/x"), false);
  assert.equal(isAllowedPushEndpoint("https://evilnotify.windows.com.attacker.net/x"), false);
  assert.equal(isAllowedPushEndpoint("https://notnotify.windows.com/x"), false);
  assert.equal(isAllowedPushEndpoint("https://evil-push.apple.com.example.org/x"), false);
  assert.equal(isAllowedPushEndpoint("not a url"), false);
});
