const CONTACT_EMAIL = "admin.nunchimangchi@gmail.com";

export default function WhyPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border">
        <h1 className="heading-mega">
          WHY WE <span className="text-brand-orange">BUILT THIS</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          THE REAL STORY, NOT A PITCH
        </p>
      </div>

      <div className="panel-aggressive prose prose-invert prose-sm max-w-none space-y-6 text-brand-text-muted leading-relaxed">
        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">Why we built it</h2>
          <p>
            OMAD (one meal a day) is what worked fastest for us, faster than anything
            else we tried. But the eating part was never really the hard part. The hard
            part was staying consistent past the first week, when nobody is checking in.
            Every tracking app we tried turned into a chore: log every bite, count every
            macro, quit by week two.
          </p>
          <p>
            droppdd doesn&apos;t care whether you do keto, OMAD, count calories, or stack
            keto and OMAD together. You pick your method in setup and the daily check-in
            matches it. The hard part was never which diet. It&apos;s doing it tomorrow,
            and the day after that. So we built the simplest version of what we actually
            needed: log one thing a day, and have someone real to answer to.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">What makes it work</h2>
          <p>
            No food diary. No macro math. You log one thing a day and get on with your
            life. Every tracking app we tried turned eating into data entry until we
            stopped opening them. This is the opposite of that.
          </p>
          <p>
            The other half is wagers. You can challenge someone you know to a friendly
            bet tied to real progress, not just a self-reported claim. The wager is honor
            system. No money changes hands. The point is having someone who&apos;ll know,
            not the stakes.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">Why we&apos;re confident</h2>
          <p>
            We&apos;ve been using droppdd ourselves, every day, since before anyone else
            ever saw it. This isn&apos;t a &quot;maybe this works&quot; pitch. It&apos;s
            something we live in daily, and we wouldn&apos;t ask you to try it if it
            wasn&apos;t.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">Want in?</h2>
          <p>
            droppdd is a capped, invite-only beta.{" "}
            <a href="/request-access" className="font-black text-brand-orange hover:text-white transition-colors no-underline">
              Request access
            </a>{" "}
            and we&apos;ll reach out if a slot opens.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">Get in touch</h2>
          <p>
            Found a bug, have feedback, or just want to say hi? We read every message.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 mt-3 text-xs font-black uppercase tracking-widest text-brand-orange hover:text-white transition-colors no-underline"
          >
            {CONTACT_EMAIL}
            <span aria-hidden="true">&rarr;</span>
          </a>
        </section>
      </div>
    </div>
  );
}
