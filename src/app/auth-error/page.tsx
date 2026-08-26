const ERROR_MESSAGES: Record<string, { heading: string; message: string }> = {
  AccessDenied: {
    heading: "ACCESS DENIED",
    message:
      "That Google account isn't on the beta allowlist yet. droppdd is invite-only right now - if you were expecting access, reach out through whoever sent you the invite.",
  },
  Configuration: {
    heading: "CONFIGURATION ERROR",
    message: "Something's misconfigured on our end. Try again shortly.",
  },
  Verification: {
    heading: "LINK EXPIRED",
    message: "That sign-in link is no longer valid. Try signing in again.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { heading, message } = ERROR_MESSAGES[error ?? ""] ?? {
    heading: "SOMETHING WENT WRONG",
    message: "Try signing in again.",
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-brand-bg overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #ff5400 25%, transparent 25%, transparent 50%, #ff5400 50%, #ff5400 75%, transparent 75%, transparent)`,
          backgroundSize: "100px 100px",
        }}
      />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-danger to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-danger to-transparent opacity-50" />

      <div className="relative w-full max-w-md px-6">
        <div className="absolute -inset-1 bg-brand-danger/10 blur-2xl rounded-full pointer-events-none" />

        <div className="relative bg-brand-card border-2 border-brand-border p-10 text-center space-y-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1),21px_21px_0px_0px_rgba(34,34,38,1)]">
          <div className="space-y-2">
            <span className="font-black tracking-[0.25em] text-5xl text-brand-orange italic block transform -skew-x-6">
              DROPPDD<span className="text-brand-text">.</span>
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-brand-border" />
              <span className="text-[10px] tracking-[0.4em] font-black text-brand-text-muted uppercase">
                EST. 2026
              </span>
              <span className="h-[1px] w-8 bg-brand-border" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-xl font-black text-brand-danger uppercase tracking-tighter italic">
              {heading}
            </h1>
            <p className="text-[11px] text-brand-text-muted font-bold uppercase tracking-[0.15em] leading-relaxed">
              {message}
            </p>
          </div>

          <a
            href="/signin"
            className="btn-assault w-full py-5 inline-flex items-center justify-center cursor-pointer"
          >
            <span>BACK TO SIGN IN</span>
          </a>
        </div>
      </div>
    </div>
  );
}
