import Script from "next/script";
import { requestAccess } from "./actions";
import { TURNSTILE_SITEKEY } from "@/lib/turnstile";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That doesn't look like a valid email. Check it and try again.",
  challenge: "The anti-bot check didn't clear. Refresh the page and try once more.",
  busy: "We're getting a lot of requests right now. Try again in a little while.",
};

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? "Something went wrong. Try again." : null;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-brand-bg overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #ff5400 25%, transparent 25%, transparent 50%, #ff5400 50%, #ff5400 75%, transparent 75%, transparent)`,
          backgroundSize: "100px 100px",
        }}
      />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50" />

      <div className="relative w-full max-w-lg px-6">
        <div className="absolute -inset-1 bg-brand-orange/10 blur-2xl rounded-full pointer-events-none" />

        <div className="relative bg-brand-card border-2 border-brand-border p-10 space-y-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1),21px_21px_0px_0px_rgba(34,34,38,1)]">
          <div className="space-y-2 text-center">
            <span className="font-black tracking-[0.25em] text-5xl text-brand-orange italic block transform -skew-x-6">
              DROPPDD<span className="text-brand-text">.</span>
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-brand-border" />
              <span className="text-[10px] tracking-[0.4em] font-black text-brand-text-muted uppercase">
                INVITE-ONLY BETA
              </span>
              <span className="h-[1px] w-8 bg-brand-border" />
            </div>
          </div>

          {sent === "1" ? (
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-black text-brand-text uppercase tracking-tighter italic">
                REQUEST RECEIVED
              </h1>
              <p className="text-[11px] text-brand-text-muted font-bold uppercase tracking-[0.15em] leading-relaxed max-w-sm mx-auto">
                If a slot opens up, you&apos;ll get an invite at the email you gave us.
                We provision by hand &mdash; it isn&apos;t instant. No account is
                created and nothing is charged.
              </p>
              <a
                href="/signin"
                className="btn-assault w-full py-5 inline-flex items-center justify-center cursor-pointer"
              >
                <span>BACK TO SIGN IN</span>
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-3 text-center">
                <h1 className="text-xl font-black text-brand-text uppercase tracking-tighter italic">
                  REQUEST ACCESS
                </h1>
                <p className="text-[11px] text-brand-text-muted font-bold uppercase tracking-[0.15em] leading-relaxed max-w-sm mx-auto">
                  droppdd is a small, capped beta: keto/OMAD training, AI meal plans,
                  streak tracking, and accountability wagers. Ask in and we&apos;ll
                  reach out if a slot opens.
                </p>
              </div>

              {errorMessage && (
                <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-[10px] font-black p-3 uppercase tracking-wider text-center">
                  {errorMessage}
                </div>
              )}

              <form action={requestAccess} className="space-y-5">
                {/* Honeypot: visually removed, ignored by humans, catches naive bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block label-micro mb-1.5">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 lowercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
                  />
                  <p className="text-[9px] text-brand-text-muted/60 font-black tracking-widest uppercase mt-1.5">
                    Use the email tied to the Google account you&apos;ll sign in with.
                  </p>
                </div>

                <div>
                  <label htmlFor="note" className="block label-micro mb-1.5">
                    ANYTHING TO ADD? <span className="text-brand-text-muted/40">(OPTIONAL)</span>
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={3}
                    maxLength={280}
                    placeholder="Who sent you, why you want in, a friend's callsign to pair with..."
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 font-bold tracking-wide focus:outline-none focus:ring-0 transition-colors resize-none"
                  />
                </div>

                <div
                  className="cf-turnstile"
                  data-sitekey={TURNSTILE_SITEKEY}
                  data-action="request_access"
                  data-theme="dark"
                />

                <button type="submit" className="btn-assault w-full py-5 cursor-pointer">
                  <span>SUBMIT REQUEST</span>
                </button>
              </form>

              <div className="pt-2 text-center">
                <a
                  href="/signin"
                  className="text-[9px] text-brand-text-muted/60 font-black tracking-widest uppercase hover:text-brand-orange transition-colors"
                >
                  &larr; ALREADY HAVE ACCESS? SIGN IN
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
