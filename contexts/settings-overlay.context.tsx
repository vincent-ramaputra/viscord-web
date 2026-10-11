import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";
import ChannelSettingsPage from "@/components/channel-settings-page/channel-settings-page";
import GuildSettingsPage from "@/components/guild-settings-page/guild-settings-page";
import SettingsPage from "@/components/settings-page/settings-page";
import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { AnimatePresence } from "framer-motion";
import { ReactNode, useEffect } from "react";



export function SettingsOverlayProvider({ children }: { children: ReactNode }) {
    const closeSettings = useSettingsOverlay(s => s.closeSettings);
    const metadata = useSettingsOverlay(s => s.metadata);
    const channelSettings = metadata?.type === SettingsOverlayType.CHANNEL_SETTINGS ? metadata.data : undefined;
    const guildSettings = metadata?.type === SettingsOverlayType.GUILD_SETTINGS ? metadata.data : undefined;

    function closeSettingsKeyListener(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closeSettings();
        }
    }
    useEffect(() => {
        if (metadata) {
            document.addEventListener('keydown', closeSettingsKeyListener);
        }
        return () => {
            document.removeEventListener('keydown', closeSettingsKeyListener);
        }
    }, [metadata]);

    return (
        <div>
            {children}
            <AnimatePresence>
                {metadata?.type === SettingsOverlayType.SETTINGS && <SettingsPage key="settings" onClose={closeSettings} />}
                {channelSettings && <ChannelSettingsPage key="channel" channelId={channelSettings.channelId} guildId={channelSettings.guildId} onClose={closeSettings} />}
                {guildSettings && <GuildSettingsPage key="guild" guildId={guildSettings.guildId} onClose={closeSettings} />}
            </AnimatePresence>
        </div>
    )
}
