"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { savePushPreferences } from "./push-actions";
import { formatHour, reminderHourOptions, utcHourToLocalHour } from "@/lib/reminder-window";

export interface PushDevice {
  endpoint: string;
  label: string;
  addedOn: string;
}

interface Props {
  publicKey: string;
  devices: PushDevice[];
  reminderEnabled: boolean;
  reminderHourUtc: number | null;
  wagerEnabled: boolean;
}

type Env = "checking" | "hidden" | "ios-install" | "ready";

const selectClass =
  "w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-3 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors cursor-pointer";
const noteClass = "text-[10px] text-brand-text-muted mt-1 uppercase font-bold tracking-wide";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function detectEnv(): Env {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // iOS Safari only exposes push to the installed home screen app, so in a
  // plain tab the right move is install guidance, not hiding the control.
  if (isIos && !standalone) return "ios-install";
  if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) return "ready";
  return "hidden";
}

export default function PushSettings({
  publicKey,
  devices,
  reminderEnabled: initialReminder,
  reminderHourUtc: initialHourUtc,
  wagerEnabled: initialWager,
}: Props) {
  const router = useRouter();
  const [env, setEnv] = useState<Env>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [offsetMinutes, setOffsetMinutes] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(initialReminder);
  const [localHour, setLocalHour] = useState<number | null>(null);
  const [wagerEnabled, setWagerEnabled] = useState(initialWager);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const detected = detectEnv();
      const offset = -new Date().getTimezoneOffset();
      let endpoint: string | null = null;
      if (detected === "ready") {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
          endpoint = (await reg.pushManager.getSubscription())?.endpoint ?? null;
        } catch {
          // Registration can fail in private modes; the control then just
          // reports an error when tapped.
        }
      }
      if (cancelled) return;
      setEnv(detected);
      setOffsetMinutes(offset);
      if (initialHourUtc !== null) setLocalHour(utcHourToLocalHour(initialHourUtc, offset));
      if (detected === "ready") setPermission(Notification.permission);
      setCurrentEndpoint(endpoint);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [initialHourUtc]);

  if (env === "checking" || env === "hidden") return null;

  async function post(path: string, body?: unknown): Promise<Response> {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  }

  // Runs from a tap only: this is the one place the permission prompt fires.
  async function enableOnThisDevice() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const res = await post("/api/push/subscribe", sub.toJSON());
      if (!res.ok) {
        await sub.unsubscribe();
        setMessage("Could not register this device. Try again.");
        return;
      }
      setCurrentEndpoint(sub.endpoint);
      router.refresh();
    } catch {
      setMessage("Could not turn on notifications on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(endpoint: string) {
    setBusy(true);
    setMessage(null);
    try {
      await post("/api/push/unsubscribe", { endpoint });
      if (endpoint === currentEndpoint) {
        const reg = await navigator.serviceWorker.ready;
        await (await reg.pushManager.getSubscription())?.unsubscribe();
        setCurrentEndpoint(null);
      }
      router.refresh();
    } catch {
      setMessage("Could not remove that device.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await post("/api/push/test");
      if (res.status === 429) setMessage("One test per minute. Try again shortly.");
      else if (!res.ok) setMessage("Test failed.");
      else setMessage("Test sent. It should arrive in a few seconds.");
    } catch {
      setMessage("Test failed.");
    } finally {
      setBusy(false);
    }
  }

  const options = reminderHourOptions(offsetMinutes);
  const chosen = options.find((o) => o.localHour === localHour) ?? null;
  const canSave = !reminderEnabled || chosen !== null;

  async function savePreferences() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await savePushPreferences({
        reminderEnabled,
        reminderHourUtc: chosen ? chosen.utcHour : null,
        wagerEnabled,
      });
      setMessage(res.ok ? "Notification settings saved." : "Could not save settings.");
    } catch {
      setMessage("Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  const heading = (
    <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
      <span className="w-1.5 h-4 bg-brand-orange block" />
      NOTIFICATIONS
    </h2>
  );

  if (env === "ios-install") {
    return (
      <div className="panel-aggressive">
        {heading}
        <p className="text-xs text-brand-text font-bold uppercase tracking-wider">Add to Home Screen first</p>
        <p className={noteClass}>
          On iPhone, notifications only work from the installed app. Tap Share in Safari, choose Add to
          Home Screen, then open DROPPDD from your home screen and come back here.
        </p>
      </div>
    );
  }

  const thisDeviceOn = currentEndpoint !== null && devices.some((d) => d.endpoint === currentEndpoint);

  return (
    <div className="panel-aggressive space-y-5">
      {heading}

      {permission === "denied" ? (
        <p className={noteClass}>
          Notifications are blocked for this app. To turn them back on, open your device or browser
          settings, allow notifications for DROPPDD, then reload this page.
        </p>
      ) : !thisDeviceOn ? (
        <div>
          <button type="button" className="btn-assault w-full" disabled={busy} onClick={enableOnThisDevice}>
            <span>TURN ON NOTIFICATIONS ON THIS DEVICE</span>
          </button>
          <p className={noteClass}>You will be asked for permission after you tap.</p>
        </div>
      ) : null}

      {devices.length > 0 && (
        <>
          <fieldset className="space-y-3 border border-brand-border p-4">
            <legend className="label-micro px-2">DAILY CHECK-IN REMINDER</legend>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 accent-brand-orange cursor-pointer"
              />
              <span className="text-xs font-black text-brand-text uppercase">Remind me if I haven&apos;t checked in</span>
            </label>
            {reminderEnabled && (
              <div>
                <label htmlFor="reminderTime" className="block label-micro mb-1.5">
                  REMINDER TIME (YOUR LOCAL TIME)
                </label>
                <select
                  id="reminderTime"
                  className={selectClass}
                  value={localHour ?? ""}
                  onChange={(e) => setLocalHour(e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">Pick a time</option>
                  {options.map((o) => (
                    <option key={o.localHour} value={o.localHour}>
                      {formatHour(o.localHour)}
                    </option>
                  ))}
                </select>
                <p className={noteClass}>
                  Check-in days run on UTC, so only times earlier in your day are offered. A reminder
                  never goes out if you have already checked in.
                </p>
              </div>
            )}
          </fieldset>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wagerEnabled}
              onChange={(e) => setWagerEnabled(e.target.checked)}
              className="w-4 h-4 accent-brand-orange cursor-pointer"
            />
            <span className="text-xs font-black text-brand-text uppercase">Tell me when someone challenges me</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-assault" disabled={busy || !canSave} onClick={savePreferences}>
              <span>SAVE</span>
            </button>
            <button type="button" className="btn-assault" disabled={busy} onClick={sendTest}>
              <span>SEND TEST</span>
            </button>
          </div>

          <div>
            <p className="label-micro mb-2">YOUR DEVICES</p>
            <ul className="space-y-2">
              {devices.map((d) => (
                <li
                  key={d.endpoint}
                  className="flex items-center justify-between gap-3 border border-brand-border px-3 py-2 text-xs uppercase font-bold tracking-wider"
                >
                  <span className="text-brand-text">
                    {d.label}
                    {d.endpoint === currentEndpoint ? " (this device)" : ""}
                    <span className="block text-[10px] text-brand-text-muted">Added {d.addedOn}</span>
                  </span>
                  <button
                    type="button"
                    className="text-brand-danger hover:underline"
                    disabled={busy}
                    onClick={() => removeDevice(d.endpoint)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {message && <p className="text-xs text-brand-text font-bold uppercase tracking-wider">{message}</p>}
    </div>
  );
}
