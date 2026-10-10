
import { ReactNode, useEffect, useState } from "react"
import styles from "./styles.module.css"
import styled from "styled-components"
import { FaTrash } from "react-icons/fa6"
import { ChannelType } from "@/enums/channel-type.enum"
import { PiHash } from "react-icons/pi"
import { ModalType } from "@/enums/modal-type.enum"
import { useModal } from "@/contexts/modal.context"
import { ChannelOverviewSection } from "./channel-overview-section"
import { useGuildsStore } from "@/app/stores/guilds-store"
import { ChannelInvitesSection } from "./channel-invites-section"
import { ChannelPermissionsSection } from "./channel-permissions-section"
import { AnimatePresence, motion } from "framer-motion"

interface ChannelSettingsPageProps {
    guildId: string;
    channelId: string
    show: boolean;
    onClose: () => void;
}

interface SidebarItem {
    id: string;
    page?: ReactNode;
    element: ReactNode;
}

export const SettingsSectionHeader = styled.h2`
    font-weight: bold;
    font-size: 24px;
`

export default function ChannelSettingsPage({ channelId, guildId, show, onClose }: ChannelSettingsPageProps) {
    const { openModal } = useModal();
    const guild = useGuildsStore(s => s.getGuild(guildId));
    const channel = guild?.channels.find(ch => ch.id === channelId);
    const sidebarItems: SidebarItem[] = [
        {
            id: "overview",
            page: <ChannelOverviewSection channel={channel} />,
            element: <p>Overview</p>
        },
        {
            id: "permissions",
            page: <ChannelPermissionsSection channelId={channelId} guildId={guildId} />,
            element: <p>Permissions</p>
        },
        {
            id: "invites",
            page: <ChannelInvitesSection channelId={channelId} guildId={guildId} />,
            element: <p>Invites</p>,
        },
    ];

    const [activeItem, setActiveItem] = useState<string>(sidebarItems[0].id);

    useEffect(() => {
        setActiveItem(sidebarItems[0].id)
    }, [show])

    if (!channel) return;

    return (
        <AnimatePresence>
            {show && <motion.div
                className={`${styles["page"]}`}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}>
                <div className={styles["sidebar-region"]}>
                    <div className={styles["sidebar-container"]}>
                        <div className={styles["sidebar-menu"]}>
                            <div>
                                <div className={styles["section-header"]}>
                                    {channel && <h2 className="h2">
                                        <span className="span flex gap-[4px] items-center">
                                            {channel.type === ChannelType.Text ?
                                                <PiHash />
                                                :
                                                <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                                            }
                                            {channel.name}
                                        </span>
                                        {channel.type === ChannelType.Text && <p>Text Channel</p>}
                                        {channel.type === ChannelType.Voice && <p>Voice Channel</p>}
                                    </h2>}
                                </div>
                                {sidebarItems.map((item: SidebarItem) => {
                                    return (
                                        <SidebarItem isActive={item.id == activeItem} key={item.id} onClick={() => setActiveItem(item.id)}>{item.element}</SidebarItem>
                                    );
                                })}
                                <div className={styles["section-separator"]}></div>
                            </div>
                            <div>
                                <SidebarItem isActive={false} onClick={() => openModal(ModalType.DELETE_CHANNEL, { channel })}>
                                    <div className="flex justify-between items-center text-[var(--text-danger)]">
                                        <p className=".p">Delete Channel</p>
                                        <FaTrash size={14} />
                                    </div>
                                </SidebarItem>
                            </div>

                        </div>
                    </div>
                </div>
                <div className={styles["content-region"]}>
                    <div className={styles["content-container"]}>
                        {sidebarItems.find(si => {
                            if (si.id === activeItem) {
                                return si;
                            }
                        })!.page}
                    </div>
                    <div className={styles["tools-region"]}>
                        <div className={styles["close-button-container"]}>
                            <div className={styles["close-button"]} onClick={onClose}>
                                <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"></path></svg>
                            </div>
                            <p className={"p" + styles["close-label"]}>ESC</p>
                        </div>
                    </div>
                </div>
            </motion.div>}
        </AnimatePresence >
    )
}

function SidebarItem({ isActive, children, onClick }: { isActive: boolean, children: ReactNode, onClick: () => void }) {
    return (
        <div className={`${styles["sidebar-item-container"]} ${isActive ? styles["sidebar-item-container-active"] : ""}`} onClick={onClick}>
            {children}
        </div>
    )
}