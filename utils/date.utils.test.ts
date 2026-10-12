import { describe, expect, it } from "vitest";
import { dateToAMPM, getTimePoint } from "@/utils/date.utils";

// Dates are built with the local-time constructor (months are 0-based), not ISO strings,
// because these functions read local hours and days. A UTC string would give different
// results on a UTC+7 machine and a UTC CI runner.

describe('dateToAMPM', () => {
    it.each([
        { time: '00:00', date: new Date(2026, 9, 12, 0, 0), expected: "12:00 AM" },
        { time: '00:30', date: new Date(2026, 9, 12, 0, 30), expected: "12:30 AM" },
        { time: '09:05', date: new Date(2026, 9, 12, 9, 5), expected: "9:05 AM" },
        { time: '11:59', date: new Date(2026, 9, 12, 11, 59), expected: "11:59 AM" },
        { time: '12:00', date: new Date(2026, 9, 12, 12, 0), expected: "12:00 PM" },
        { time: '12:30', date: new Date(2026, 9, 12, 12, 30), expected: "12:30 PM" },
        { time: '13:45', date: new Date(2026, 9, 12, 13, 45), expected: "1:45 PM" },
        { time: '23:59', date: new Date(2026, 9, 12, 23, 59), expected: "11:59 PM" },
    ])('formats $time as $expected', ({ date, expected }) => {
        expect(dateToAMPM(date)).toBe(expected);
    });
});

describe('getTimePoint', () => {
    const now = new Date(2026, 9, 12, 15, 0); // 12 Oct 2026, 3:00 PM

    it('returns "Today at" for earlier the same day', () => {
        expect(getTimePoint(new Date(2026, 9, 12, 0, 5), now)).toBe("Today at");
    });

    it('returns "Yesterday at" for the previous calendar day, even under 24 hours ago', () => {
        expect(getTimePoint(new Date(2026, 9, 11, 23, 59), now)).toBe("Yesterday at");
    });

    it('returns a date for the same day of the month in an earlier month', () => {
        expect(getTimePoint(new Date(2026, 8, 12, 15, 0), now)).toBe("09/12/26,");
    });

    it('returns a date for two calendar days ago, even under 48 hours ago', () => {
        const justAfterMidnight = new Date(2026, 9, 12, 0, 10);

        expect(getTimePoint(new Date(2026, 9, 10, 23, 50), justAfterMidnight)).toBe("10/10/26,");
    });

    it('returns "Yesterday at" across a month boundary', () => {
        const firstOfMonth = new Date(2026, 9, 1, 9, 0);

        expect(getTimePoint(new Date(2026, 8, 30, 20, 0), firstOfMonth)).toBe("Yesterday at");
    });

    it('returns "Yesterday at" across a year boundary', () => {
        const newYear = new Date(2027, 0, 1, 0, 10);

        expect(getTimePoint(new Date(2026, 11, 31, 23, 50), newYear)).toBe("Yesterday at");
    });
});
