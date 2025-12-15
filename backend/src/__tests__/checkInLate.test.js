import { isLateCheckIn, LATE_CUTOFF_TIMEZONE } from "../utils/checkInLate.js";

// Basic edge-case coverage for the 11:00 AM cutoff (Asia/Kolkata)
describe("isLateCheckIn (11:00 AM Asia/Kolkata cutoff)", () => {
  const tz = LATE_CUTOFF_TIMEZONE;

  it("treats check-ins before 11:00 AM as on-time", () => {
    // 10:59:59 AM IST -> 05:29:59 AM UTC
    const date = new Date("2024-01-01T05:29:59.000Z");
    expect(isLateCheckIn(date, tz)).toBe(false);
  });

  it("treats check-ins exactly at 11:00 AM as on-time", () => {
    // 11:00:00 AM IST -> 05:30:00 AM UTC
    const date = new Date("2024-01-01T05:30:00.000Z");
    expect(isLateCheckIn(date, tz)).toBe(false);
  });

  it("treats check-ins after 11:00 AM as late", () => {
    // 11:00:01 AM IST -> 05:30:01 AM UTC
    const date = new Date("2024-01-01T05:30:01.000Z");
    expect(isLateCheckIn(date, tz)).toBe(true);
  });
});
