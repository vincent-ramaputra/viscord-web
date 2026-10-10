"use client"

import styles from "./styles.module.css"
import { Fragment, ReactNode, useEffect, useState } from "react";
import UserArea from "@/components/user-area/user-area";
import { FaCirclePlus, FaCompass } from "react-icons/fa6";
import { HiDownload } from "react-icons/hi";
import Tooltip from "@/components/tooltip/tooltip";
import styled from "styled-components";
import { usePathname, useRouter } from "next/navigation";
import { GuildSummary } from "@/interfaces/guild-summary";
import { ContextMenuProvider } from "@/contexts/context-menu.context";
import SocketProvider, { useSocket } from "@/contexts/socket.context";
import { CLIENT_READY_EVENT, GET_USERS_PRESENCE_EVENT, SUBSCRIBE_EVENTS, USER_PRESENCE_UPDATE_EVENT, USER_PROFILE_UPDATE_EVENT } from "@/constants/events";
import { UserProfile } from "@/interfaces/user-profile";
import { useGetUserProfile, useUserProfileStore } from "../stores/user-profiles-store";
import { useChannelsStore, useGetDMChannels } from "../stores/channels-store";
import { Channel } from "@/interfaces/channel";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { VoiceAudioRenderer } from "@/components/voice-audio-renderer/voice-audio-renderer";
import { VoiceRingManager } from "@/components/voice-ring-manager/voice-ring-manager";
import { ClientReadyResponseDTO } from "@/interfaces/dto/client-ready-response.dto";
import { useCurrentUserStore } from "../stores/current-user-store";
import { useUserPresenceStore } from "../stores/user-presence-store";
import { BsGithub } from "react-icons/bs";
import { ModalProvider, useModal } from "@/contexts/modal.context";
import { ModalType } from "@/enums/modal-type.enum";
import { useGuildsStore } from "../stores/guilds-store";
import { Guild } from "@/interfaces/guild";
import { SettingsOverlayProvider } from "@/contexts/settings-overlay.context";
import { SubscribeEventDTO } from "@/interfaces/dto/subscribe-event.dto";

interface HomeLayoutProps {
    children: ReactNode
    sidebar: ReactNode
}


const GuildIconContainer = styled.div`
    width: 72px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    position: relative;
    align-items: center;
    margin-bottom: 8px; 
`

const PillWrapper = styled.div`
    position: absolute;
    min-width: 8px;
    display: flex;
    align-items: center;
    left: 0;
    height: 100%;
`
const Pill = styled.div`
    width: 4px;
    background-color: white;
    height: 20px;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    transform: scale(0);
    transition: all 150ms ease-in;


    &.minimal {
        transform: scale(1);
        height: 8px;
    }

    &.active {
        height: 40px;
        transform: scale(1);
    }

    &.hover {
        transform: scale(1);
    }
`

const IconContainer = styled.div`
    display: flex;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    justify-content: center;
    background-color: var(--background-primary);
    align-items: center;
    transition: all 200ms;
    cursor: pointer;
    overflow: hidden;

    &:hover, &.active{
        border-radius: 16px;
        background-color: var(--primary);
    }
`

export function GuildIcon({ children, guildSummary, onClick }: { children: ReactNode, guildSummary: GuildSummary, onClick?: () => void }) {
    const pathName = usePathname();
    const router = useRouter();
    const [isHovering, setIsHovering] = useState(false);
    const targetPath = `/channels/${guildSummary.id}`;
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildSummary.id);
    const hasUnread = !!(guild?.channels.find(ch => ch.userChannelState.unreadCount > 0));
    const isActive = pathName.includes(targetPath);

    function onMouseEnter() {
        setIsHovering(true);
    }

    function onMouseLeave() {
        setIsHovering(false);
    }

    return (
        <GuildIconContainer>
            <PillWrapper>
                <Pill className={`${hasUnread ? 'minimal' : ''} ${isHovering ? 'hover' : ''} ${isActive ? 'active' : ''}`} />
            </PillWrapper>
            <IconContainer
                className={`${pathName.includes(targetPath) ? 'active' : ''}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={(onClick ? onClick : () => {
                    if (pathName.includes(targetPath)) return;
                    router.push(targetPath)
                })}>
                {children}
            </IconContainer>
            <Tooltip show={isHovering} text={guildSummary.name} position="right" />
        </GuildIconContainer>
    )
}

function DMButton({ active }: { active: boolean }) {
    const pathName = usePathname();
    const router = useRouter();
    const [isHovering, setIsHovering] = useState(false);
    const targetPath = '/channels/me';

    function onMouseEnter() {
        setIsHovering(true);
    }

    function onMouseLeave() {
        setIsHovering(false);
    }

    return (
        <GuildIconContainer>
            <PillWrapper>
                <Pill className={`${isHovering ? 'hover' : ''} ${active ? 'active' : ''}`} />
            </PillWrapper>
            <IconContainer
                className={`${active ? 'active' : ''}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={(() => {
                    if (pathName.includes(targetPath)) return;
                    router.push(targetPath)
                })}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0.840821 3.3614 21.83 16.8" width={29} height={29}>
                    <path d="M 19.3354 4.7726 a 17.836 17.836 90 0 0 -4.508 -1.4112 c -0.2058 0.392 -0.392 0.784 -0.5684 1.1858 c -1.6562 -0.245 -3.332 -0.245 -4.998 0 c -0.1764 -0.4018 -0.3626 -0.8036 -0.5782 -1.176 c -1.568 0.2646 -3.0772 0.735 -4.508 1.4014 A 18.6592 18.6592 90 0 0 0.9408 17.346 a 18.0614 18.0614 90 0 0 5.5174 2.8126 c 0.4508 -0.6076 0.8428 -1.2544 1.176 -1.9404 c -0.637 -0.245 -1.2642 -0.539 -1.862 -0.9016 c 0.1666 -0.1176 0.3136 -0.2352 0.4606 -0.3626 c 3.5084 1.666 7.546 1.666 11.0544 0 l 0.4508 0.3626 c -0.588 0.3528 -1.225 0.6566 -1.862 0.9016 c 0.343 0.686 0.735 1.323 1.176 1.9404 c 1.9894 -0.6174 3.8612 -1.568 5.5272 -2.8126 c 0.4606 -4.7726 -0.7644 -8.9082 -3.234 -12.5734 Z M 8.134 14.8176 c -1.078 0 -1.96 -0.9996 -1.96 -2.2246 c 0 -1.2152 0.8624 -2.2148 1.96 -2.2148 s 1.9796 0.9996 1.96 2.2148 c 0 1.225 -0.8722 2.2246 -1.96 2.2246 Z m 7.252 0 c -1.078 0 -1.96 -0.9996 -1.96 -2.2246 c 0 -1.2152 0.8624 -2.2148 1.96 -2.2148 s 1.9796 0.9996 1.96 2.2148 c 0 1.225 -0.8624 2.2246 -1.96 2.2246 Z" fill="#dbdee1" />
                </svg>
            </IconContainer>
            <Tooltip show={isHovering} text={'Direct Messages'} position="right" />
        </GuildIconContainer>
    );
}

const UnreadMessageCount = styled.div`
    background-color: var(--status-danger);
    font-size: 12px;
    font-weight: bold;
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 100%;
    // text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 0;
    bottom: 0;
    box-sizing: content-box;
    border: 3px solid var(--background-tertiary);
`

const UnreadDMWrapper = styled.div`
    position: relative;
    transform: scale(0);
    animation: scaleBounceIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    cursor: pointer;

    @keyframes scaleBounceIn {
        0% {
            transform: scale(0);
        }
        80% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
`

function UnreadDMChannel({ channel }: { channel: Channel }) {
    const recipient = useGetUserProfile(channel.recipients![0].id);
    const router = useRouter();
    const [isHovering, setIsHovering] = useState(false);
    if (!recipient) {
        return;
    }

    return (
        <GuildIconContainer>
            <PillWrapper>
                <Pill className={`${isHovering ? 'hover' : 'minimal'}`} />
            </PillWrapper>
            <UnreadDMWrapper
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => router.push(`/channels/me/${channel.id}`)}
            >
                <UserAvatar user={recipient} showStatus={false} size="48" />
                <UnreadMessageCount className="absolute">{channel.userChannelState.unreadCount}</UnreadMessageCount>
            </UnreadDMWrapper>
            <Tooltip show={isHovering} text={recipient.displayName} position="right" />
        </GuildIconContainer>

    );
}


function GuildListSidebar() {
    const { openModal } = useModal();
    const { guilds } = useGuildsStore();

    const pathname = usePathname();
    const dmChannels = useGetDMChannels();

    const channelId = pathname.startsWith("/channels/me/")
        ? pathname.split("/").pop()
        : null;

    const unreadDMs = dmChannels.filter(channel => channel.userChannelState.unreadCount > 0 && channel.id !== channelId);


    const dmPaths = [
        "/channels/me",
        "/store",
        "/shop"
    ];

    return (
        <div className={styles["guild-list-container"]}>
            <DMButton active={dmPaths.find(path => pathname.startsWith(path)) ? true : false} />
            {unreadDMs.length > 0 && unreadDMs.map((ch) => <UnreadDMChannel key={ch.id} channel={ch} />)}
            <div className={styles["horizontal-divider"]}></div>
            {guilds && Array.from(guilds.values()).map(guild => {
                const initials = guild.name.split(' ').map(s => s[0]).join(' ');
                return (
                    <GuildIcon key={guild.id} guildSummary={guild}>
                        {guild.iconURL ?
                            <img
                                className="w-full h-full"
                                src={guild.iconURL} alt="initials" />
                            :
                            <p>{initials}</p>
                        }
                    </GuildIcon>
                )
            })}
            <div className="">
                <GuildIcon guildSummary={{ id: 'create', name: 'Add a server' }} onClick={() => { openModal(ModalType.CREATE_GUILD) }}>
                    <FaCirclePlus size={20} />
                </GuildIcon>
                <GuildIcon guildSummary={{ id: 'discovery', name: 'Discover' }}>
                    <FaCompass size={20} />
                </GuildIcon>
                <GuildIcon guildSummary={{ id: 'download', name: 'Download app' }}>
                    <HiDownload size={20} />
                </GuildIcon>
            </div>
        </div>
    );
}



function AppInitializer({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const { socket, isReady } = useSocket();
    // const { data: relationships } = useRelationshipsQuery({ enabled: !!user });
    // const { data: dmChannels } = useDMChannelsQuery({ enabled: !!user })
    const { setUserProfiles } = useUserProfileStore();
    const { setPresenceMap, updatePresence } = useUserPresenceStore();
    const { setChannels } = useChannelsStore();
    const { setCurrentUser } = useCurrentUserStore();
    const { setGuilds } = useGuildsStore();


    useEffect(() => {
        if (!isReady) return;
        socket?.emit(CLIENT_READY_EVENT, (data: ClientReadyResponseDTO) => {
            const currentUser = data.user;
            const guildsMap: Map<string, Guild> = new Map();
            const eventSubscriptions: SubscribeEventDTO[] = [];

            if (data.guilds) {
                for (const guild of data.guilds) {
                    guildsMap.set(guild.id, guild);
                }
            }

            const userProfiles: UserProfile[] = [currentUser.profile].concat(data.relationships?.map(rel => rel.user) ?? []);
            const dmRecipients = data.dmChannels ? data.dmChannels
                .map(channel => channel.recipients?.find(rep => rep.id !== currentUser.id))
                .filter(rep => rep !== undefined) : [];

            const uniqueUsers = new Map<string, UserProfile>();
            [...userProfiles, ...dmRecipients, currentUser.profile, ...Array.from(guildsMap.values()).flatMap(guild => guild.members.map(m => m.profile))].forEach(user => {
                if (!uniqueUsers.has(user.id)) {
                    uniqueUsers.set(user.id, user);
                }
            });

            const userProfilesMap: Map<string, UserProfile> = new Map();
            for (const [key, value] of uniqueUsers) {
                eventSubscriptions.push({ event: USER_PROFILE_UPDATE_EVENT, targetId: value.id });
                eventSubscriptions.push({ event: USER_PRESENCE_UPDATE_EVENT, targetId: value.id });
                userProfilesMap.set(key, value);
            }

            const channelMap: Map<string, Channel> = new Map();

            if (data.dmChannels) {
                for (const channel of data.dmChannels) {
                    channelMap.set(channel.id, channel);
                }
            }

            setChannels(channelMap);
            setUserProfiles(userProfilesMap);
            setCurrentUser(currentUser);
            setGuilds(guildsMap);

            const presenceMap: Map<string, boolean> = new Map();
            for (const user of data.presences) {
                presenceMap.set(user, true);
            }

            setPresenceMap(presenceMap);

            socket.emit(SUBSCRIBE_EVENTS, eventSubscriptions);
            socket.emit(GET_USERS_PRESENCE_EVENT, Array.from(uniqueUsers.values()).map(u => u.id), (userIds: string[]) => {
                for (const id of userIds) {
                    updatePresence(id, true);
                }
                setIsLoading(false);
            });
        });

    }, [isReady])

    // useEffect(() => {
    //     if (!user || /*!relationships || !dmChannels*/ || !isReady) return;


    // }, [user, isReady, relationships, dmChannels]);

    if (isLoading) {
        return (
            <div className="w-full h-dvh flex justify-center items-center">
                <div className="flex flex-col ">
                    <video autoPlay loop playsInline muted width={200} height={200}>
                        <source src="/assets/app-loading-spinner2.webm" type="video/webm" />
                        <img alt="true" src="/assets/app-loading.png" />
                    </video>
                    <div className="text-center top-[-20px] relative">
                        <p className="text-[12px] leading-[16px] mb-[8px] uppercase font-semibold">Did you know</p>
                        <p>I dont know.</p>
                    </div>
                    <div className="absolute bottom-0 pb-[32px] text-center ">
                        <p className="text-[14px] mb-[8px]">Connection problems? Let us know!</p>
                        <p className="flex items-center justify-center gap-[8px] text-[var(--text-link)] font-[500]"><BsGithub />Check out my Github</p>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}


export default function HomeLayout({ children }: HomeLayoutProps) {
    // if (!isAuthorized) {
    //     return <div></div>;
    // }

    return (
        // <AppStateProvider>
        // {/* <UserPresenceProvider> */ }
        <SocketProvider>
            <AppInitializer>
                <ModalProvider>
                    <ContextMenuProvider>
                        <SettingsOverlayProvider>
                            <div className={styles["page"]}>
                                <Fragment>
                                    <div className={`${styles["main-content"]}`}>
                                        <GuildListSidebar />
                                        <div className="absolute bottom-[8px] left-[8px] w-[358px]">
                                            <UserArea />
                                        </div>
                                        {children}
                                    </div>
                                </Fragment>
                            </div>
                            <VoiceRingManager />
                        </SettingsOverlayProvider>
                    </ContextMenuProvider>
                </ModalProvider>
            </AppInitializer>
            <VoiceAudioRenderer />
        </SocketProvider >
        // {/* </UserPresenceProvider> */ }
        // </AppStateProvider>
    );
}

