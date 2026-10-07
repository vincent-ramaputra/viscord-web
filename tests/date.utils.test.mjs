import assert from "node:assert/strict";
import test from "node:test";
import { dateToAMPM, getTimePoint, isWithinMessageGroup } from "../utils/date.utils.ts";

test("12-hour times handle noon and midnight", () => {
    for (const [hour, expected] of [[0, "12:05 AM"], [12, "12:05 PM"], [13, "1:05 PM"], [23, "11:05 PM"]]) {
        assert.equal(dateToAMPM(new Date(2026, 9, 7, hour, 5)), expected);
    }
});

test("relative labels compare full local calendar dates", () => {
    const now = new Date(2026, 9, 1, 9);
    assert.equal(getTimePoint(new Date(2026, 9, 1, 0), now), "Today at");
    assert.equal(getTimePoint(new Date(2026, 8, 30, 23), now), "Yesterday at");
    assert.equal(getTimePoint(new Date(2026, 8, 1), now), "09/01/26,");
    assert.equal(getTimePoint(new Date(2025, 9, 1), now), "10/01/25,");
    assert.equal(getTimePoint(new Date(2026, 0, 1), new Date(2026, 0, 2)), "Yesterday at");
    assert.equal(getTimePoint(new Date(2025, 11, 31), new Date(2026, 0, 1)), "Yesterday at");
});

test("yesterday follows the calendar across daylight-saving changes", () => {
    assert.equal(getTimePoint(new Date(2026, 2, 8, 0, 30), new Date(2026, 2, 9, 0, 15)), "Yesterday at");
    assert.equal(getTimePoint(new Date(2026, 10, 1, 0, 30), new Date(2026, 10, 2, 0, 15)), "Yesterday at");
});

test("message grouping uses ordered elapsed milliseconds across the hour", () => {
    const previous = new Date(2026, 9, 7, 10, 58);
    assert.equal(isWithinMessageGroup(previous, new Date(2026, 9, 7, 11, 2)), true);
    assert.equal(isWithinMessageGroup(previous, new Date(2026, 9, 7, 11, 30)), false);
    assert.equal(isWithinMessageGroup(previous, new Date(2026, 9, 7, 11, 3)), false);
    assert.equal(isWithinMessageGroup(previous, new Date(2026, 9, 7, 10, 57)), false);
    assert.equal(isWithinMessageGroup(previous, previous), true);
});
