"use client"
import { useGuildsStore } from "@/app/stores/guilds-store";
import { joinGuild } from "@/services/invites/invites.service";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";


export default function ReceiveInvitePage() {
    const { inviteCode } = useParams();
    const addGuild = useGuildsStore(s => s.upsertGuild);
    const router = useRouter();

    useEffect(() => {
        joinGuild(inviteCode as string).then(result => {
            if (!result.ok) {
                router.back()
                return;
            }
            const guild = result.data;
            addGuild(guild);
            router.push(`/channels/${guild.id}`);
        });
    }, []);

    return <div></div>;
}