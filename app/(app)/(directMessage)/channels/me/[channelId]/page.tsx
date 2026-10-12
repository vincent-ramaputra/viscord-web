"use client"
import { useChannelsStore, } from "@/app/stores/channels-store";
import { useMessagesQuery } from "@/hooks/queries";
import { useParams } from "next/navigation"
import { useEffect } from "react";
import { DMChannelHeader } from "./channel-header";
import { ChatView } from "@/components/chat-view/chat-view";
import { useAcknowledgeMessageMutation } from "@/hooks/mutations";
import { useDMRecipient } from "@/app/stores/user-profiles-store";


export default function Page() {
    const { channelId } = useParams<{channelId: string}>();
    const channel = useChannelsStore(s => s.getChannel(channelId));
    const { data: messages } = useMessagesQuery(channelId);
    const { mutateAsync: acknowledge } = useAcknowledgeMessageMutation();
    const recipientName = useDMRecipient(channel)?.displayName;

    useEffect(() => {
        if (!recipientName) return;

        document.title = `Viscord | @${recipientName}`
    }, [recipientName]);


    if (!channel) {
        return <p></p>
    }

    return (
        <div className="h-full flex flex-col">
            <DMChannelHeader channel={channel} />
            <ChatView messages={messages ?? []} channel={channel} acknowledge={acknowledge} textInputPlaceholder={recipientName ? `Message @${recipientName}` : "Message"}/>
        </div>
    )
}