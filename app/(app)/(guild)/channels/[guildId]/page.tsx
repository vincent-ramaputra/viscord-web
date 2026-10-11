"use client"
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const { guildId } = useParams<{guildId: string}>();

    const guild = useGuildsStore(s => s.getGuild(guildId));

    useEffect(() => {
        if (!guild) return;
        document.title = `Viscord | ${guild.name}`
    }, [guild])

    return <></>;
}