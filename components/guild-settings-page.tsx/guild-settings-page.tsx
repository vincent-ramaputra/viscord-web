
import { Fragment, ReactNode, useEffect, useMemo, useState } from "react"
import styles from "./styles.module.css"
import styled from "styled-components"
import { FaTrash } from "react-icons/fa6"
import { useGuildsStore } from "@/app/stores/guilds-store"
import { RoleSettingsSection } from "./roles-settings-section"
import { AnimatePresence, motion } from "framer-motion"
import { GuildProfileSection } from "./guild-profile-section"
import { GuildInvitesSection } from "./guild-invites-section"

interface GuildSettingsPageProps {
    guildId: string;
    show: boolean;
    onClose: () => any;
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

export default function GuildSettingsPage({ guildId, show, onClose }: GuildSettingsPageProps) {
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildId);
    const sidebarItems: Record<string, SidebarItem[]> = {
        [guild?.name ?? 'Server']: [
            {
                id: 'server-profile',
                page: <GuildProfileSection guildId={guildId} />,
                element: <p>Server Profile</p>
            }
        ],
        "People": [
            {
                id: 'members',
                page: undefined,
                element: <p>Members</p>
            },
            {
                id: 'roles',
                page: <RoleSettingsSection guildId={guildId} />,
                element: <p>Roles</p>
            },
            {
                id: 'invites',
                page: <GuildInvitesSection guildId={guildId}/>,
                element: <p>Invites</p>
            },
        ]
    };
    const headers = Object.keys(sidebarItems);
    const [activeItem, setActiveItem] = useState<string>(sidebarItems[headers[0]][0].id);



    function getActivePage(): ReactNode {
        for (const section of headers) {
            const item = sidebarItems[section].find(i => i.id === activeItem);
            if (item) return item.page ?? <div></div>;
        }
        return <div></div>;
    }

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
                            {headers.map((header) => {
                                return (
                                    <div key={header}>
                                        <div className={styles["section-header"]}>
                                            <h2 className="h2">{header}</h2>
                                        </div>
                                        {sidebarItems[header].map((item: SidebarItem, index: number) => {
                                            return (
                                                <SidebarItem isActive={item.id == activeItem} key={item.id} onClick={() => setActiveItem(item.id)}>{item.element}</SidebarItem>
                                            );
                                        })}
                                        <div className={styles["section-separator"]}></div>
                                    </div>
                                );
                            })}
                            <div>
                                <SidebarItem isActive={false} onClick={() => { }} >
                                    <div className="flex justify-between items-center text-[var(--text-danger)]">
                                        <p>Delete Server</p>
                                        <FaTrash size={14} />
                                    </div>
                                </SidebarItem>
                            </div>

                        </div>
                    </div>
                </div>
                <div className={styles["content-region"]}>
                    <div className={styles["content-container"]}>
                        {getActivePage()}
                    </div>
                    <div className={styles["tools-region"]}>
                        <div className={styles["close-button-container"]}>
                            <div className={styles["close-button"]} onClick={onClose}>
                                <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"></path></svg>
                            </div>
                            <p className={styles["close-label"]}>ESC</p>
                        </div>
                    </div>
                </div>
            </motion.div>}
        </AnimatePresence >
    )
}

function SidebarItem({ isActive, children, onClick }: { isActive: boolean, children: ReactNode, onClick: () => any }) {
    return (
        <div className={`${styles["sidebar-item-container"]} ${isActive ? styles["sidebar-item-container-active"] : ""}`} onClick={onClick}>
            {children}
        </div>
    )
}