import { ReactNode, useState } from "react"
import styles from "./styles.module.css"
import { LuLogOut } from "react-icons/lu"
import IconTwitter from "../social-media/twitter"
import Link from "next/link"
import IconInstagram from "../social-media/instagram"
import IconFacebook from "../social-media/facebook"
import IconYoutube from "../social-media/youtube"
import IconTiktok from "../social-media/tiktok"
import { HiMagnifyingGlass } from "react-icons/hi2"
import { useRouter } from "next/navigation"
import { useLogoutMutation } from "@/hooks/mutations"
import { MediaSettingsSection } from "./media-settings-section"
import styled from "styled-components"
import { AnimatePresence, motion } from "framer-motion"
import { UserProfileSection } from "./user-profile-section"

interface SettingsPageProps {
    show: boolean
    onClose: () => void
}

interface SidebarItem {
    id: string
    page?: ReactNode
    element: ReactNode
}

export const SettingsSectionHeader = styled.h3`
    font-weight: bold;
    font-size: 24px;
`

export default function SettingsPage({ show, onClose }: SettingsPageProps) {
    const headers: string[] = ["User Settings", "Billing Settings", "App Settings", "Activity Settings"];
    const { mutateAsync: logoutMutation } = useLogoutMutation();

    const sidebarItems: Record<string, SidebarItem[]> = {
        "User Settings": [
            {
                id: "my-account",
                page: undefined,
                element: <p>My Account</p>
            },
            {
                id: "profiles",
                page: <UserProfileSection />,
                element: <p>Profiles</p>
            },
            {
                id: "content-and-socials",
                page: undefined,
                element: <p>Content & Socials</p>,
            },
            {
                id: "data-and-privacy",
                page: undefined,
                element: <p>Data & Privacy</p>
            },
            {
                id: "family-center",
                page: undefined,
                element: <p>Family Center</p>
            },
            {
                id: "authorized-apps",
                page: undefined,
                element: <p>Authorized Apps</p>
            },
            {
                id: "devices",
                page: undefined,
                element: <p>Devices</p>
            },
            {
                id: "connections",
                page: undefined,
                element: <p>Connections</p>
            },
            {
                id: "clips",
                page: undefined,
                element: <p>Clips</p>
            },
        ],
        "Billing Settings": [
            {
                id: "nitro",
                page: undefined,
                element: <p>Nitro</p>
            },
            {
                id: "server-boost",
                page: undefined,
                element: <p>Server Boost</p>
            },
            {
                id: "subcsriptions",
                page: undefined,
                element: <p>Subscriptions</p>
            },
            {
                id: "gift-inventory",
                page: undefined,
                element: <p>Gift Inventory</p>
            },
            {
                id: "billing",
                page: undefined,
                element: <p>Billing</p>
            },
        ],
        "App Settings": [
            {
                id: "appearance",
                page: undefined,
                element: <p>Appearance</p>
            },
            {
                id: "accessibility",
                page: undefined,
                element: <p>Accessibility</p>
            },
            {
                id: "Voice & Video",
                page: <MediaSettingsSection />,
                element: <p>Voice & Video</p>
            },
            {
                id: "chat",
                page: undefined,
                element: <p>Chat</p>
            },
            {
                id: "notifications",
                page: undefined,
                element: <p>Notifiactions</p>
            },
            {
                id: "keybinds",
                page: undefined,
                element: <p>Keybinds</p>
            },
            {
                id: "language",
                page: undefined,
                element: <p>Language</p>
            },
            {
                id: "streamer-mode",
                page: undefined,
                element: <p>Streamer Mode</p>
            },
            {
                id: "advanced",
                page: undefined,
                element: <p>Advanced</p>
            },
        ],
        "Activity Settings": [
            {
                id: "activity-privacy",
                page: undefined,
                element: <p>Activity Privacy</p>
            },
        ]
    }

    const [activeItem, setActiveItem] = useState<string>(sidebarItems[headers[0]][0].id);
    const router = useRouter();

    async function handleLogout() {
        await logoutMutation();
        router.push("/login");
        onClose();
    }

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
                        <div className={styles["search-bar"]}>
                            <input className={styles["search-input"]} placeholder="Search" />
                            <HiMagnifyingGlass className={styles["search-icon"]} size={20} />
                        </div>
                        <div className={styles["sidebar-menu"]}>
                            {headers.map((header) => {
                                return (
                                    <div key={header}>
                                        <div className={styles["section-header"]}>
                                            <h2>{header}</h2>
                                        </div>
                                        {sidebarItems[header].map((item: SidebarItem) => {
                                            return (
                                                <SidebarItem isActive={item.id == activeItem} key={item.id} onClick={() => setActiveItem(item.id)}>{item.element}</SidebarItem>
                                            );
                                        })}
                                        <div className={styles["section-separator"]}></div>
                                    </div>
                                );
                            })}
                            <div>
                                <SidebarItem isActive={false} onClick={() => { }}><p>What&apos;s New</p></SidebarItem>
                                <SidebarItem isActive={false} onClick={() => { }}><p>Merch</p></SidebarItem>
                                <SidebarItem isActive={false} onClick={() => { }}><p>HypeSquad</p></SidebarItem>
                                <div className={styles["section-separator"]}></div>
                            </div>
                            <div>
                                <SidebarItem isActive={false} onClick={() => handleLogout()}>
                                    <div className="flex justify-between text-[var(--text-danger)]">
                                        <p>Log out</p>
                                        <LuLogOut />
                                    </div>
                                </SidebarItem>
                                <div className={styles["section-separator"]}></div>
                                <div className={styles["socials-wrapper"]}>
                                    <Link className={styles["link"]} href={"x.com"}><IconTwitter /></Link>
                                    <Link className={styles["link"]} href={"https://www.instagram.com/vincent.ramaputra/"}><IconInstagram /></Link>
                                    <Link className={styles["link"]} href={""}><IconFacebook /></Link>
                                    <Link className={styles["link"]} href={""}><IconYoutube /></Link>
                                    <Link className={styles["link"]} href={""}><IconTiktok /></Link>
                                </div>
                                <div className={styles["notes"]}>
                                    <p>By VR23-2</p>
                                    <p>Vincent Ramaputra</p>
                                </div>
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
        </AnimatePresence>
    )
}

function SidebarItem({ isActive, children, onClick }: { isActive: boolean, children: ReactNode, onClick: () => void }) {
    return (
        <div className={`${styles["sidebar-item-container"]} ${isActive ? styles["sidebar-item-container-active"] : ""}`} onClick={onClick}>
            {children}
        </div>
    )
}