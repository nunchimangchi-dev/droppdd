// Local-time to UTC-hour mapping for the reminder picker. No imports, so it
// is unit-testable with node --test.
//
// The app's "has a check-in today" predicate uses the UTC calendar day, so a
// reminder is only useful at a local time whose UTC date is the same as the
// user's local date (otherwise the UTC day has already rolled over and the
// reminder would be judged against the wrong day). The picker is limited to
// those hours. For a Pacific user that is local midnight to mid-afternoon.
//
// offsetMinutes is local minus UTC (the negation of Date.getTimezoneOffset()).

export interface ReminderHourOption {
  localHour: number; // 0-23, the hour shown to the user
  utcHour: number; // 0-23, what is stored as reminderHourUtc
}

export function reminderHourOptions(offsetMinutes: number): ReminderHourOption[] {
  const options: ReminderHourOption[] = [];
  for (let localHour = 0; localHour < 24; localHour++) {
    const utcMinutes = localHour * 60 - offsetMinutes;
    if (utcMinutes >= 0 && utcMinutes < 24 * 60) {
      // Half-hour zones land mid-hour; the reminder fires in the UTC hour
      // containing that minute.
      options.push({ localHour, utcHour: Math.floor(utcMinutes / 60) });
    }
  }
  return options;
}

/** The local hour a stored UTC hour corresponds to right now, 0-23. */
export function utcHourToLocalHour(utcHour: number, offsetMinutes: number): number {
  const minutes = (((utcHour * 60 + offsetMinutes) % 1440) + 1440) % 1440;
  return Math.floor(minutes / 60);
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${suffix}`;
}
