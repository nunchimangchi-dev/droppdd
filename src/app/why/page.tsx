const CONTACT_EMAIL = "admin.nunchimangchi@gmail.com";

export default function WhyPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto px-4 py-10 sm:px-6 sm:py-12">
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
            OMAD is what worked fastest for us. But the eating was never the hard
            part. The hard part was staying consistent past the first week, when
            nobody&apos;s checking. Every tracking app we tried made that worse: log
            every bite, count every macro, quit by week two.
          </p>
          <p>
            So we built the simplest thing that keeps you honest. Pick your method in
            setup: keto, OMAD, calorie targets, or both. Once a day you check in and
            it matches whatever you picked. No food diary. No macro math. The other
            half is a friendly wager with someone you know. Honor system, no money,
            just someone who&apos;ll notice if you slip.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">Why we&apos;re confident</h2>
          <p>
            We&apos;ve used droppdd every day since before anyone else saw it. We
            wouldn&apos;t ask you to try it if we didn&apos;t.
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
