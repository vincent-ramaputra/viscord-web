"use client"

import SidebarContentContainer from "@/components/guild-sidebar/sidebar-content-container";
import SidebarHeader from "@/components/guild-sidebar/sidebar-header";
import { ChannelType } from "@/enums/channel-type.enum";
import { useParams, useRouter } from "next/navigation";
import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { FaAngleDown, FaGear } from "react-icons/fa6";
import styled from "styled-components";
import { ChannelCategory } from "./channel-category";
import styles from "./styles.module.css"
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import ChannelButton from "./channel-button";
import { useContextMenu } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { Guild } from "@/interfaces/guild";
import { LuLogOut } from "react-icons/lu";
import { useModal } from "@/contexts/modal.context";
import { ModalType } from "@/enums/modal-type.enum";
import { checkPermission, getEffectivePermission } from "@/helpers/permissions.helper";
import { Permissions } from "@/enums/permissions.enum";
import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";

const HeaderContainer = styled.div`
    padding: 12px 8px 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    cursor: pointer;
    position: relative;

    transition: background-color 100ms linear;

    &:hover:not(:has(:hover)) {
        background-color: var(--background-modifier-hover);
    }
`

const HeaderText = styled.p`
    color: var(--text-default);
    line-height: 1.25;
    font-weight: 600;
    text-overflow: ellipsis;
`

const MoreButton = styled.div`
    padding: 6px;
    color: var(--icon-tertiary);
`

const SidebarContainer = styled.div`
    width: 304px;
    display: flex;
    flex-direction: column;
    flex: 1;
`

const GuildMenuContainer = styled.div`
    position: absolute;
    background-color: var(--background-surface-higher);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 8px;
    box-shadow: var(--shadow-high);
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    z-index: 10;
`

const ListItem = styled.div`
    padding: 8px;
    border-radius: 2px;
    cursor: pointer;
    font-size: 14px;
    line-height: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
        background-color: var(--background-mod-subtle);
        
        svg {
            color: white;
        }
    }
    svg {
        color: var(--text-muted);
        
    }

    &.danger {
        color: var(--text-danger);

        svg {
            color: var(--text-danger);
        }
    }
`

const Separator = styled.div`
    border-bottom: 1px solid var(--border-subtle);
    margin: 8px;
`


function Header({ guild }: { guild: Guild }) {
    const { user } = useCurrentUserStore();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null!);
    const menuButtonRef = useRef<HTMLDivElement>(null!);
    const { openModal } = useModal();
    const { openSettings } = useSettingsOverlay();
    const effectivePermission = getEffectivePermission(guild.members.find(m => m.userId === user!.id)!, guild);

    useEffect(() => {
        const handleClickOutside = (evt: MouseEvent) => {
            if (showMenu && menuRef.current && evt.target !== menuButtonRef.current && !menuRef.current.contains(evt.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    function openGuildSettings() {
        openSettings(SettingsOverlayType.GUILD_SETTINGS, { guildId: guild.id });
        setShowMenu(false);
    }

    function openLeaveGuildModal() {
        openModal(ModalType.LEAVE_GUILD, { guildId: guild.id });
        setShowMenu(false);
    }

    return (
        <HeaderContainer onClick={() => setShowMenu(prev => !prev)} ref={menuButtonRef}>
            <HeaderText>{guild?.name}</HeaderText>
            <MoreButton>
                <FaAngleDown />
            </MoreButton>
            {showMenu && <GuildMenuContainer ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <ListItem>
                    <p>Invite People</p>
                    <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM16.62 13.17c-.22.29-.65.37-.92.14-.34-.3-.7-.57-1.09-.82-.52-.33-.7-1.05-.47-1.63.11-.27.2-.57.26-.87.11-.54.55-1 1.1-.92 1.6.2 3.04.92 4.15 1.98.3.27-.25.95-.65.95a3 3 0 0 0-2.38 1.17ZM15.19 15.61c.13.16.02.39-.19.39a3 3 0 0 0-1.52 5.59c.2.12.26.41.02.41h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5a7.5 7.5 0 0 1 13.19-4.89ZM9.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 22Z"></path><path fill="currentColor" d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z"></path></svg>
                </ListItem>
                {checkPermission(effectivePermission, Permissions.MANAGE_SERVERS) && <ListItem onClick={openGuildSettings}><p>Server Settings</p><FaGear size={16} /></ListItem>}
                {guild.ownerId !== user!.id &&
                    <>
                        <Separator />
                        <ListItem className="danger" onClick={openLeaveGuildModal}><p>Leave Server</p><LuLogOut /></ListItem>
                    </>
                }
            </GuildMenuContainer>}
        </HeaderContainer>
    );
}

export default function Page({ children }: { children: ReactNode }) {
    const { guildId } = useParams();
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildId as string);
    const { user } = useCurrentUserStore();
    const member = guild?.members.find(member => member.userId === user!.id);
    const channelsWithoutParent = guild?.channels.filter(channel => {
        if (channel.parent || channel.type === ChannelType.Category || !member) return false;

        const permission = getEffectivePermission(member, guild, channel);

        return checkPermission(permission, Permissions.VIEW_CHANNELS);
    }) ?? [];
    const parents = guild?.channels.filter(channel => {
        if (channel.type !== ChannelType.Category || !member) return false;

        const permission = getEffectivePermission(member, guild, channel);
        const visibleChildren = guild.channels.filter(ch => {
            if (!member || channel.id !== ch.parent?.id) return false;
            const permission = getEffectivePermission(member, guild, ch, channel);

            return checkPermission(permission, Permissions.VIEW_CHANNELS);
        });

        return checkPermission(permission, Permissions.VIEW_CHANNELS) || visibleChildren.length > 0;
    }) ?? [];

    const router = useRouter();
    const { showMenu } = useContextMenu();
    useEffect(() => {
        if (!guild) {
            router.push('/channels/me');
            return;
        }

    }, [guild])

    if (!guild) {
        return <div></div>
    }


    return (
        <Fragment>
            <div className={`${styles["guild-sidebar-container"]}`}>
                <SidebarContainer onContextMenu={(e) => showMenu(e, ContextMenuType.GUILD_SIDEBAR, guild)} >
                    <SidebarHeader>
                        <Header guild={guild} />
                    </SidebarHeader>
                    <SidebarContentContainer>
                        <div className="py-[8px]">
                            {channelsWithoutParent.sort((a, b) => a.createdAt > b.createdAt ? 1 : a.createdAt === b.createdAt ? 0 : -1).map(channel => {
                                return (
                                    <div className="mt-[8px]" key={channel.id}>
                                        <ChannelButton collapse={false} channel={channel} />
                                    </div>
                                );

                            }
                            )}
                            {parents.sort((a, b) => a.createdAt > b.createdAt ? 1 : a.createdAt === b.createdAt ? 0 : -1).map(channel => {
                                const visibleChannels = guild.channels.filter(ch => {
                                    if (!member || channel.id !== ch.parent?.id) return false;
                                    const permission = getEffectivePermission(member, guild, ch, channel);

                                    return checkPermission(permission, Permissions.VIEW_CHANNELS);
                                });

                                return <ChannelCategory key={channel.id} category={channel} channels={visibleChannels}></ChannelCategory>
                            })}
                        </div>
                    </SidebarContentContainer>
                </SidebarContainer>
            </div>
            <div className={styles["content-container"]}>
                {children}
            </div>
        </Fragment>
    );
}