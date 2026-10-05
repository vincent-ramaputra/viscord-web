import { useEffect, useState } from "react";
import { Channel } from "@/interfaces/channel";

type Acknowledge = (dto: { channelId: string, messageId: string }) => unknown;

/**
 * Keeps the open channel marked as read, and returns where the "NEW" divider goes.
 *
 * Acknowledges whenever a new message arrives while the channel is open and the tab is visible,
 * instead of on unmount, so reloads/closed tabs don't lose the read state and the
 * sidebar/guild pill don't count messages you're looking at.
 */
export function useChannelReadState(channel: Channel | undefined, acknowledge: Acknowledge) {
    const lastMessageId = channel?.lastMessageId;
    const lastReadId = channel?.userChannelState.lastReadId;

    // The divider marks what was unread when you opened the channel. Acknowledging moves
    // lastReadId right away, so capture it once per channel or the divider would vanish on open.
    // Setting state during render is React's pattern for resetting state when an input changes.
    const [readMarker, setReadMarker] = useState<{ channelId?: string, dividerAfterId?: string }>({});
    if (channel && readMarker.channelId !== channel.id) {
        setReadMarker({
            channelId: channel.id,
            // Nothing unread on open: no divider, even when new messages arrive while you read.
            dividerAfterId: lastReadId !== lastMessageId ? lastReadId : undefined,
        });
    }

    useEffect(() => {
        if (!channel || !lastMessageId || lastMessageId === lastReadId) return;

        const acknowledgeIfVisible = () => {
            // A message arriving in a background tab should stay unread until you come back.
            if (document.visibilityState !== 'visible') return;
            acknowledge({ channelId: channel.id, messageId: lastMessageId });
        };

        acknowledgeIfVisible();
        document.addEventListener('visibilitychange', acknowledgeIfVisible);
        return () => document.removeEventListener('visibilitychange', acknowledgeIfVisible);
    }, [channel?.id, lastMessageId, lastReadId]);

    return {
        dividerAfterId: readMarker.channelId === channel?.id ? readMarker.dividerAfterId : undefined,
    };
}
