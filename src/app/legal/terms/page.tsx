export default function TermsOfServicePage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border">
        <h1 className="heading-mega">
          BETA <span className="text-brand-orange">TERMS</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          LAST UPDATED AUGUST 26, 2026 &middot; BETA V2
        </p>
      </div>

      <div className="panel-aggressive prose prose-invert prose-sm max-w-none space-y-6 text-brand-text-muted leading-relaxed">
        <p className="text-xs uppercase font-bold tracking-wide text-brand-orange">
          droppdd is a small, invite-only beta. By using it, you agree to the terms below.
        </p>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">1. Invite-only, no guarantees</h2>
          <p>
            Access is gated by a manually managed allowlist. The maintainer can suspend or remove
            your access, or archive your data, at any time and for any reason, without notice.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">2. Not medical advice - read this one</h2>
          <p>
            Workouts, meal templates, and macro targets in droppdd are informational only, not
            medical, dietary, or coaching advice from a licensed professional. Physical
            conditioning and dietary changes (including OMAD/keto protocols) carry real risk of
            injury or illness. Talk to a doctor before starting, especially with any pre-existing
            condition. Stop immediately and seek help if you feel pain, dizziness, or shortness of
            breath during any activity.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">3. Wagers are commitment devices, not gambling</h2>
          <p>
            Wagers - solo or peer challenges - are behavioral accountability tools, modeled on
            commitment-contract concepts like Beeminder or StickK: you set a target against your
            own future effort, not chance. No house, no payout. droppdd does not hold, process, or
            verify any money - the &quot;stake&quot; you write is symbolic and self-enforced. A
            peer challenge is visible to whoever you challenge or whoever challenges you.
          </p>
          <p className="mt-2">
            If a wager fails because of illness, injury, or a bug in the app that affected your
            data, that&apos;s not on you - reach out and it&apos;ll be sorted out by hand, honor
            system in both directions.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">4. Your data, our system</h2>
          <p>
            You own the data you enter. You grant the maintainer the ability to store and process
            it solely to run the app for you. The app&apos;s code, design, and shared workout/meal
            templates belong to the maintainer - don&apos;t copy, scrape, or redistribute them.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">5. Don&apos;t</h2>
          <p>
            Don&apos;t try to bypass sign-in or the allowlist, don&apos;t try to access another
            user&apos;s data outside the features designed to share it (leaderboard, wagers,
            username), don&apos;t attack the infrastructure, and don&apos;t log intentionally fake
            data to break the wager/leaderboard system for others.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">6. No warranty</h2>
          <p>
            This runs on self-hosted hardware maintained by one person. It can and will go down
            sometimes. Provided as-is, no uptime guarantee, no warranty of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">7. Liability</h2>
          <p>
            To the extent the law allows it, the maintainer isn&apos;t liable for injury, health
            outcomes, data loss, or anything related to a self-imposed wager&apos;s stake, arising
            from your use of the app.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">8. Changes</h2>
          <p>
            These terms can change as the app does. Meaningful changes will require re-acceptance
            on your next sign-in.
          </p>
        </section>
      </div>
    </div>
  );
}
