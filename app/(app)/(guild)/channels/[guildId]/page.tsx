"use client"
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const { guildId } = useParams();

    const {getGuild} = useGuildsStore();
    const guild = getGuild(guildId as string); 

    useEffect(() => {
        if (!guild) return;
        document.title = `Viscord | ${guild.name}`
    }, [guild])

    return <></>;
}