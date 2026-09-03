// The public /request-access form is Turnstile-gated. This is a second,
// coarse backstop: cap total NEW self-service invite requests created in a
// rolling hour, so a flood that somehow clears the challenge still can't
// fill the admin queue unbounded. Peer-wager invite requests don't count
// against this.
export const SELF_REQUEST_HOURLY_CAP = 20;
