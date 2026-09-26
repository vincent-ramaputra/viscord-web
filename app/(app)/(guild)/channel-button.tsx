import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useGetChannelVoiceStates } from "@/app/stores/voice-state-store";
import Tooltip from "@/components/tooltip/tooltip";
import { useContextMenu } from "@/contexts/context-menu.context";
import { useModal } from "@/contexts/modal.context";
import { ChannelType } from "@/enums/channel-type.enum";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { ModalType } from "@/enums/modal-type.enum";
import { Permissions } from "@/enums/permissions.enum";
import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { checkPermission, getEffectivePermission } from "@/helpers/permissions.helper";
import { useVoice } from "@/hooks/use-voice";
import { Channel } from "@/interfaces/channel";
import { getImageURL } from "@/services/storage/storage.service";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, MouseEvent, useEffect, useState } from "react";
import { FaLock } from "react-icons/fa6";
import { PiHash } from "react-icons/pi";
import styled from "styled-components";

const ChannelInfo = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    flex-grow: 1;
    p {
        line-height: 24px;
    }

    &.highlight {
        p {
            color: var(--text-primary);
        }
    }
`

const ButtonContainer = styled.div`
    display: flex;
    color: var(--channels-default);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    position: relative;
    &:hover {
        background-color: var(--background-modifier-hover);
        color: var(--interactive-hover);
    }

    &.hidden {
        display: none
    }

    &.active {
        background-color: var(--background-modifier-selected);
        color: var(--text-primary);
    }

`

const Container = styled.div`
    position: relative;
    padding: 0 8px;
`

const ActionButtonContainer = styled.div`
    display: none;
    align-items: center;
    gap: 4px;

    &.active {
        display: flex;
    }
`

const VoiceStateContainer = styled.div`
    padding: 0px 0px 8px 36px;
`

const AvatarImage = styled.img`
    width: 24px;
    height: 24px;
    cursor: pointer;
    border-radius: 50%;
`

const VoiceStateInfo = styled.div`
    padding: 4px 8px;
    display: flex;
    gap: 8px;
    align-items: center;
`

const VoiceStateDisplayName = styled.p`
    color: var(--text-muted);
    font-weight: var(--font-weight-medium);
    font-size: var(--text-sm);
    &.active {
        color: white;
    }
`

const ChannelLockedIcon = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px;
    // border-radius: 50%;

    //  -webkit-mask-image: radial-gradient(circle 12px at 100% 0%, transparent 0%, black 100%);
    // mask-image: radial-gradient(circle 12px at 100% 0%, transparent 0%, black 100%);
    // mask-repeat: no-repeat;
    // mask-composite: exclude;
    // pointer-events: none; /* let clicks pass through */
`

const PillWrapper = styled.div`
    position: absolute;
    min-width: 8px;
    display: flex;
    align-items: center;
    left: 0;
    height: 100%;
    top: 0;
`
const Pill = styled.div`
    width: 4px;
    background-color: white;
    height: 20px;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    transform: scale(0);
    transition: all 150ms ease-in;

    &.active {
        height: 40px;
        transform: scale(1);
    }

    &.hover {
        transform: scale(1);
    }

    &.minimal {
        transform: scale(1);
        height: 8px;
    }
`

function CreateInviteButton({ onClick }: { onClick: (e: MouseEvent<HTMLDivElement>) => void }) {
    const [hover, setHover] = useState(false)
    return (

        <div className="relative"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}>
            <svg className={`${hover ? 'text-[var(--interactive-hover)]' : ''}`} aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM16.62 13.17c-.22.29-.65.37-.92.14-.34-.3-.7-.57-1.09-.82-.52-.33-.7-1.05-.47-1.63.11-.27.2-.57.26-.87.11-.54.55-1 1.1-.92 1.6.2 3.04.92 4.15 1.98.3.27-.25.95-.65.95a3 3 0 0 0-2.38 1.17ZM15.19 15.61c.13.16.02.39-.19.39a3 3 0 0 0-1.52 5.59c.2.12.26.41.02.41h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5a7.5 7.5 0 0 1 13.19-4.89ZM9.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 22Z"></path><path fill="currentColor" d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z"></path></svg>
            <Tooltip
                position="top"
                show={hover}
                text="Create Invite" />
        </div>
    )
}

function EditChannelButton({ onClick }: { onClick: (e: MouseEvent<HTMLDivElement>) => void }) {
    const [hover, setHover] = useState(false);

    return (
        <div className="relative"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={onClick}>
            <svg className={`${hover ? 'text-[var(--interactive-hover)]' : ''}`} aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M10.56 1.1c-.46.05-.7.53-.64.98.18 1.16-.19 2.2-.98 2.53-.8.33-1.79-.15-2.49-1.1-.27-.36-.78-.52-1.14-.24-.77.59-1.45 1.27-2.04 2.04-.28.36-.12.87.24 1.14.96.7 1.43 1.7 1.1 2.49-.33.8-1.37 1.16-2.53.98-.45-.07-.93.18-.99.64a11.1 11.1 0 0 0 0 2.88c.06.46.54.7.99.64 1.16-.18 2.2.19 2.53.98.33.8-.14 1.79-1.1 2.49-.36.27-.52.78-.24 1.14.59.77 1.27 1.45 2.04 2.04.36.28.87.12 1.14-.24.7-.95 1.7-1.43 2.49-1.1.8.33 1.16 1.37.98 2.53-.07.45.18.93.64.99a11.1 11.1 0 0 0 2.88 0c.46-.06.7-.54.64-.99-.18-1.16.19-2.2.98-2.53.8-.33 1.79.14 2.49 1.1.27.36.78.52 1.14.24.77-.59 1.45-1.27 2.04-2.04.28-.36.12-.87-.24-1.14-.96-.7-1.43-1.7-1.1-2.49.33-.8 1.37-1.16 2.53-.98.45.07.93-.18.99-.64a11.1 11.1 0 0 0 0-2.88c-.06-.46-.54-.7-.99-.64-1.16.18-2.2-.19-2.53-.98-.33-.8.14-1.79 1.1-2.49.36-.27.52-.78.24-1.14a11.07 11.07 0 0 0-2.04-2.04c-.36-.28-.87-.12-1.14.24-.7.96-1.7 1.43-2.49 1.1-.8-.33-1.16-1.37-.98-2.53.07-.45-.18-.93-.64-.99a11.1 11.1 0 0 0-2.88 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd"></path></svg>
            <Tooltip
                position="top"
                show={hover}
                text="Edit Channel" />
        </div>
    )
}

export default function ChannelButton({ channel, collapse }: { channel: Channel, collapse: boolean }) {
    const [hover, setHover] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { showMenu } = useContextMenu();
    const [active, setActive] = useState(false);
    const { openModal } = useModal();
    const { openSettings } = useSettingsOverlay();
    const voiceStates = useGetChannelVoiceStates(channel.id);
    const { activeSpeakers } = useMediasoupStore();
    const { join } = useVoice();
    const { user } = useCurrentUserStore();
    const { getUserProfile } = useUserProfileStore();
    const { getChannel, getGuild } = useGuildsStore();
    const guild = getGuild(channel.guildId)!;
    const member = guild.members.find(m => m.userId === user!.id);
    const parent = channel.parent ? getChannel(channel.parent.id) : undefined;
    const effectivePermission = member ? getEffectivePermission(member, guild, channel, parent) : 0n;
    const everyoneOW = channel.isSynced && parent
        ? parent!.permissionOverwrites.find(ow => ow.targetId === channel.guildId)
        : channel.permissionOverwrites.find(ow => ow.targetId === channel.guildId);

    const isHiddenFromEveryone = everyoneOW
        ? checkPermission(BigInt(everyoneOW.deny), Permissions.VIEW_CHANNELS)
        : false;

    const hasUnread = channel.userChannelState.unreadCount > 0;

    async function handleJoinVoiceCall() {
        join(channel.id);
    }

    useEffect(() => {
        setActive(pathname.includes(channel.id));
    }, [pathname]);

    function onClick() {
        if (channel.type === ChannelType.Text) {
            router.push(`/channels/${channel.guildId}/${channel.id}`)
        }
        else if (channel.type === ChannelType.Voice) {
            handleJoinVoiceCall();
        }
    }

    return (
        <Container>
            {!active && hasUnread &&
                <PillWrapper>
                    <Pill className="minimal" />
                </PillWrapper>
            }
            <ButtonContainer
                className={`${collapse ? 'hidden' : ''} ${active ? 'active' : ''} `}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={onClick}
                onContextMenu={(e) => {
                    e.stopPropagation();
                    showMenu(e, ContextMenuType.CHANNEL_BUTTON, { channelId: channel.id, guildId: channel.guildId })
                }}
            >
                {
                    channel.type === ChannelType.Text ?
                        <Fragment>
                            <ChannelInfo className={`${!active && hasUnread ? 'highlight' : ''}`} >
                                <div className="relative">
                                    <PiHash size={20} strokeWidth={5} />
                                    {isHiddenFromEveryone && <ChannelLockedIcon>
                                        <FaLock size={8} />
                                    </ChannelLockedIcon>}
                                </div>
                                <p>{channel.name}</p>
                            </ChannelInfo>
                            <ActionButtonContainer className={`${hover || active ? 'active' : ''}`}>
                                {checkPermission(effectivePermission, Permissions.CREATE_INVITES) && <CreateInviteButton onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(ModalType.CREATE_INVITE, { channelId: channel.id, guildId: channel.guildId });
                                }} />}
                                {checkPermission(effectivePermission, Permissions.MANAGE_CHANNELS) && <EditChannelButton onClick={(e) => {
                                    e.stopPropagation();
                                    openSettings(SettingsOverlayType.CHANNEL_SETTINGS, { channelId: channel.id, guildId: channel.guildId })
                                }} />}
                            </ActionButtonContainer>
                        </Fragment>
                        :
                        <Fragment>
                            <ChannelInfo>
                                <div className="relative">
                                    <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                                    {isHiddenFromEveryone && <ChannelLockedIcon>
                                        <FaLock size={8} />
                                    </ChannelLockedIcon>}
                                </div>
                                <p>{channel.name}</p>
                            </ChannelInfo>
                            <ActionButtonContainer className={`${hover || active ? 'active' : ''}`}>
                                {checkPermission(effectivePermission, Permissions.CREATE_INVITES) && <CreateInviteButton onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(ModalType.CREATE_INVITE, { channelId: channel.id, guildId: channel.guildId });
                                }} />}
                                {checkPermission(effectivePermission, Permissions.MANAGE_CHANNELS) && <EditChannelButton onClick={(e) => {
                                    e.stopPropagation();
                                    openSettings(SettingsOverlayType.CHANNEL_SETTINGS, { channelId: channel.id, guildId: channel.guildId })
                                }} />}
                            </ActionButtonContainer>
                        </Fragment>
                }

            </ButtonContainer>
            {voiceStates.map(vs => {
                const user = getUserProfile(vs.userId);
                const isSpeaking = (voiceStates.find(vs => vs.userId === vs.userId) && activeSpeakers.has(vs.userId)) ?? false;
                const avatarURL = user ? (user.avatarURL ? getImageURL('avatars', user?.avatarURL) : getImageURL('assets', user?.defaultAvatarURL)) : '';

                return (
                    <VoiceStateContainer key={vs.userId}>
                        <VoiceStateInfo>
                            {user && <AvatarImage crossOrigin="anonymous" src={avatarURL} className={`${isSpeaking ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/30' : ''}`} />}
                            <VoiceStateDisplayName className={`${isSpeaking && 'active'}`}>{user?.displayName}</VoiceStateDisplayName>
                        </VoiceStateInfo>
                    </VoiceStateContainer>
                );
            })}
        </Container>
    )
}