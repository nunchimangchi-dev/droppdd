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
            OMAD (one meal a day) has always been the fastest thing that&apos;s actually
            worked for us &mdash; faster than anything else we&apos;ve tried. The eating part
            was never really the hard part. The hard part was staying consistent past the
            first week, when nobody&apos;s checking in. Every tracking app we tried turned
            into a chore &mdash; log every bite, count every macro, quit by week two. So we
            built the simplest version of what we actually needed: log one thing a day, and
            have someone real to answer to.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">What makes it work</h2>
          <p>
            Two things, on purpose. First, it&apos;s simple &mdash; no macro math, no
            elaborate meal plans, just one meal and a daily check-in. Second, and the part
            we&apos;re proudest of: wagers. You can challenge someone you know to a friendly
            bet tied to real progress, not just a self-reported claim. Having a little skin
            in the game with someone you actually know changes everything &mdash;
            accountability that&apos;s actually fun instead of one more chore.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-black text-brand-text uppercase tracking-wider mb-2">Why we&apos;re confident</h2>
          <p>
            We&apos;ve been using droppdd ourselves, every day, since before anyone else ever
            saw it. This isn&apos;t a &quot;maybe this works&quot; pitch &mdash; it&apos;s
            something we live in daily, and we wouldn&apos;t ask you to try it if it
            wasn&apos;t.
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
