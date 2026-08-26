export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border">
        <h1 className="heading-mega">
          PRIVACY <span className="text-brand-orange">POLICY</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          LAST UPDATED AUGUST 26, 2026 &middot; BETA V2
        </p>
      </div>

      <div className="panel-aggressive prose prose-invert prose-sm max-w-none space-y-6 text-brand-text-muted leading-relaxed">
        <p className="text-xs uppercase font-bold tracking-wide text-brand-orange">
          droppdd is a small, invite-only beta run by a single maintainer, not a company. This
          policy describes what actually happens today - not aspirational future plans - and is
          written in plain language rather than dense legal boilerplate. It is not a substitute
          for professional legal advice.
        </p>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">1. What we collect at sign-in</h2>
          <p>
            Sign-in is Google OAuth only - no passwords. We receive your email address, display
            name, profile image, and Google&apos;s internal account ID. Your email is checked
            against a manually managed allowlist before you can use the app at all.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">2. What you enter yourself</h2>
          <p>
            Once signed in: a <strong>username</strong> (visible to every other beta user on the
            leaderboard and in wager challenges - choose accordingly), your weight (starting,
            current, target), age, height, and meal preference, workout/wager activity, and any
            wagers you create or accept, including a free-text &quot;stake description&quot; you
            write yourself.
          </p>
          <p className="mt-2">
            Your <strong>exact weight is never shown to other users</strong>. The leaderboard only
            shows a relative percentage toward your own goal and your streak - never a raw number.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">3. Peer features</h2>
          <p>
            If another beta user challenges you to a wager, they see your username and the
            challenge details. If you accept, your progress toward that specific goal is visible
            to them (still as a target/outcome, not your raw ongoing weight log).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">4. AI meal planning</h2>
          <p>
            The meal-planning feature sends your entered ingredients or macro targets to Google&apos;s
            Gemini API to generate a recipe. This is ephemeral - nothing you generate this way is
            saved to our database. Google processes that request under its own terms.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">5. Money</h2>
          <p>
            Wagers are honor-system only. droppdd does not process payments, hold funds, or verify
            that a &quot;stake&quot; was actually paid. No payment processor is integrated today.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">6. Hosting and infrastructure</h2>
          <p>
            droppdd is self-hosted on private hardware, not a hyperscaler cloud. It is publicly
            reachable at this domain, sitting behind Cloudflare (as a reverse proxy/CDN and edge
            security layer - DDoS protection, bot filtering, rate limiting) and, depending on
            current beta phase, an additional Cloudflare Access login gate. Cloudflare processes
            connection metadata (like IP address) as part of providing that security layer.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">7. Cookies and tracking</h2>
          <p>
            No third-party analytics, ad trackers, or marketing pixels. We use first-party session
            cookies solely to keep you signed in - they don&apos;t track you elsewhere.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">8. Your data, your rights</h2>
          <p>
            You can request a full export or complete deletion of your account and all associated
            records at any time - contact the maintainer through your invite channel. We&apos;ll
            verify it&apos;s really you via your registered email, then act within 30 days. Deleted
            data is removed from production immediately; it may persist in encrypted backups for
            up to 30 days before being overwritten, and is never restored.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">9. Changes</h2>
          <p>
            If this policy changes in a way that matters (new tracking, new third-party
            processors, real-money features), you&apos;ll be asked to review and accept the update
            on your next sign-in before continuing.
          </p>
        </section>
      </div>
    </div>
  );
}
