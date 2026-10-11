"use client"
import { useChannelsStore, } from "@/app/stores/channels-store";
import { useMessagesQuery } from "@/hooks/queries";
import { useParams } from "next/navigation"
import { useEffect } from "react";
import { DMChannelHeader } from "./channel-header";
import { ChatView } from "@/components/chat-view/chat-view";
import { useAcknowledgeMessageMutation } from "@/hooks/mutations";


export default function Page() {
    const { channelId } = useParams();
    const channel = useChannelsStore(s => s.getChannel(channelId as string));
    const { data: messages } = useMessagesQuery(channelId as string);
    const { mutateAsync: acknowledge } = useAcknowledgeMessageMutation();

    useEffect(() => {
        if (!channel) return;

        document.title = `Viscord | @${channel.recipients![0].displayName}`
    }, [channel]);


    if (!channel) {
        return <p></p>
    }

    return (
        <div className="h-full flex flex-col">
            <DMChannelHeader channel={channel} />
            <ChatView messages={messages ?? []} channel={channel} acknowledge={acknowledge} textInputPlaceholder={`Message @${channel.recipients![0].displayName}`}/>
        </div>
    )
}