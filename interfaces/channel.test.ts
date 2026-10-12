import { describe, expect, it } from "vitest";
import { DMChannel, getDMRecipientId } from "@/interfaces/channel";
import { ChannelType } from "@/enums/channel-type.enum";
import { UserProfile } from "@/interfaces/user-profile";

const profile = (id: string) => ({ id }) as UserProfile;

const dmChannel = (recipients: UserProfile[]): DMChannel => ({
    id: "channel-1",
    type: ChannelType.DM,
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
    userChannelState: { unreadCount: 0, mentionCount: 0 },
    recipients,
});

describe('getDMRecipientId', () => {
    it('returns the other user (the server leaves the current user out of recipients)', () => {
        expect(getDMRecipientId(dmChannel([profile("other-user")]))).toBe("other-user");
    });
});
