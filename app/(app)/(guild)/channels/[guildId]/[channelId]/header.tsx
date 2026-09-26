import ContentHeader from "@/app/(app)/content-header";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useIsUserTyping, useTypingUsersFromChannel } from "@/app/stores/user-typing-store";
import { useGetChannelVoiceRing } from "@/app/stores/voice-ring-state-store";
import { useGetChannelVoiceStates } from "@/app/stores/voice-state-store";
import Tooltip from "@/components/tooltip/tooltip";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { ChannelType } from "@/enums/channel-type.enum";
import { Channel } from "@/interfaces/channel";
import { UserProfile } from "@/interfaces/user-profile";
import { VoiceState } from "@/interfaces/voice-state";
import { ringChannelRecipients } from "@/services/channels/channels.service";
import { Consumer, Producer } from "mediasoup-client/types";
import { ReactNode, useEffect, useRef, useState } from "react";
import { BsMicFill, BsMicMuteFill, BsPinAngleFill } from "react-icons/bs";
import { LuHeadphoneOff, LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import { MdGroupAdd } from "react-icons/md";
import { PiHash, PiPhoneCallFill, PiVideoCameraFill } from "react-icons/pi";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { getImageURL } from "@/services/storage/storage.service";
import { ContentFooter } from "@/app/(app)/content-footer";
import { ImPhoneHangUp } from "react-icons/im";
import { VoiceRingState } from "@/interfaces/voice-ring-state";
import ColorThief from "colorthief";
import { useVoice } from "@/hooks/use-voice";


const UserProfileHeader = styled.div`
    display: flex;
    align-items: center;
    max-height: auto;
    flex-grow: 1;
    color: var(--text-muted);
`

const UserProfileHeaderText = styled.p`
    line-height: 20px;
    font-weight: var(--font-weight-semibold);
    color: var(--text-default);
    position: relative;
`

const ChannelNameTextContainer = styled.div`
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 4px;
    margin-right: 8px;
`

const HeaderActionContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 32px;
    height: 32px;
    cursor: pointer;
    color: var(--interactive-normal);

    &:hover {
        color: var(--interactive-hover);
    }

    &.active {
        color: var(--icon-primary);
    }
`

const CallHeaderContainer = styled.div`
    display: flex;
    width: 100%;
    background: black;
    flex-direction: column;
    overflow: hidden;
`

function HeaderActionButton({ children, onClick, tooltipText, active }: { children: ReactNode, onClick?: () => any, tooltipText: string, active?: boolean }) {
    const [isHovering, setIsHovering] = useState(false);


    return (
        <HeaderActionContainer
            className={active ? 'active' : ''}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={onClick}>
            {children}
            <Tooltip position="bottom" show={isHovering} text={tooltipText} fontSize="14px" />
        </HeaderActionContainer>
    )
}

const SearchBarContainer = styled.div`
    display: flex;
    height: 100%;
    width: 244px;
`

function SearchBar({ channel }: { channel: Channel }) {
    return (
        <SearchBarContainer>
            {/* <TextInputSecondary

                placeholder="Search"
                
            >

            </TextInputSecondary> */}
        </SearchBarContainer>
    );
}

const AvatarImage = styled.img`
    width: 80px;
    height: 80px;
    cursor: pointer;
    border-radius: 50%;
`

function MutedIcon() {
    return (
        <div className="absolute bottom-0 right-0 rounded-full bg-[var(--status-danger)] p-1 border-[4px] border-black border-solid translate-y-1/4">
            <BsMicMuteFill size={12} />
        </div>
    )
}

function DeafenedIcon() {
    return (
        <div className="absolute bottom-0 right-0 rounded-full bg-[var(--status-danger)] p-1 border-[4px] border-black border-solid translate-y-1/4">
            <LuHeadphoneOff size={12} />
        </div>
    )
}

const CallActionsGroup = styled.div`
    background-color: var(--background-surface-high);
    border: 1px solid var(--border-faint);
    border-radius: 12px;
    gap: 8px;
    padding: 4px;
    display: flex;
`;

const CallActionButton = styled.button`
    padding: 10px;
    border-radius: 8px;
    &:hover {
    background-color: var(--background-modifier-hover);
    }
`

const HeaderBottomGradient = styled.div`
    background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0) 20%,
        rgba(0, 0, 0, 0.03) 40%,
        rgba(0, 0, 0, 0.08) 55%,
        rgba(0, 0, 0, 0.18) 70%,
        rgba(0, 0, 0, 0.35) 85%,
        rgba(0, 0, 0, 0.6) 100%
    );
    position: absolute;
    height: 160px;
    width: 100%;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: end;
    pointer-events: none;
    
    opacity: 0;
    transform: translateY(20%);
    transition: all 200ms ease-in-out;
    
    & * {
        pointer-events: auto;
    }
    
    &.active {
        opacity: 1;
        transform: translateY(0);
    }
`

const TileText = styled.div`
    background-color: var(--overlay-text-background);
    border-radius: 4px;
    display: flex;
    padding: 8px;
    gap: 6px;
    &:empty {
        background: none;
        padding: 0;
    }
`
const Tile = styled.div`
    width: 200px;
    display: flex;
    flex-grow: 1;
    min-height: 150px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
`
const Overlay = styled.div`
    width: 100%;
    height: 100%;
    padding: 8px;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
`
function UserTile({ user, showDisplayName, isSpeaking, isMuted = false, isDeafened = false }: { user: UserProfile, showDisplayName: boolean, isSpeaking: boolean, isMuted?: boolean, isDeafened?: boolean }) {
    const imgRef = useRef<HTMLImageElement>(null!);
    const [bannerColor, setBannerColor] = useState<string | null>();
    const avatarURL = user.avatarURL ? getImageURL('avatars', user.avatarURL) : getImageURL('assets', user.defaultAvatarURL);

    async function getBannerColor() {
        const img = imgRef.current;
        if (!img) return;
        try {
            const colorThief = new ColorThief();
            const result = colorThief.getColor(img);
            const rgb = `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
            setBannerColor(rgb);
        } catch (err) {
            console.error('Color extraction failed:', err);
        }
    }
    return (
        <div
            className={`w-full h-full flex items-center justify-center  relative rounded-lg transition-all duration-200 ${isSpeaking ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/30' : ''
                }`}
            style={{ backgroundColor: bannerColor ?? 'gray' }}
        >
            <img
                src={avatarURL}
                ref={imgRef}
                style={{ display: 'none' }}
                crossOrigin="anonymous"
                alt="avatar"
                onLoad={() => getBannerColor()}
            />
            <AvatarImage crossOrigin="anonymous" src={avatarURL} />
            <Overlay>
                <TileText>
                    {isMuted && <BsMicMuteFill />}
                    {isDeafened && <LuHeadphoneOff />}
                    {showDisplayName && <p>{user.displayName}</p>}
                </TileText>
            </Overlay>
        </div>
    )
}
// Main CallHeader component
function CallHeader({ channel }: { channel: Channel }) {
    const [isHovering, setIsHovering] = useState(false);
    const { user } = useCurrentUserStore();
    const { getUserProfile } = useUserProfileStore();
    const voiceStates = useGetChannelVoiceStates(channel.id);
    const recipient: UserProfile = getUserProfile(channel.recipients![0].id) || channel.recipients![0];
    const { join, leave } = useVoice();

    async function handleJoinVoiceCall() {
        if (voiceStates.length === 0) await ringChannelRecipients(channel.id);
        join(channel.id);
    }

    async function handleLeaveVoiceCall() {
        leave();
    }

    return (
        <CallHeaderContainer
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <CallHeaderTop
                recipient={recipient}
                channel={channel}
                isHovering={isHovering}
                onJoinCall={handleJoinVoiceCall}
            />

            <CallContent
                channel={channel}
                isHovering={isHovering}
            />

            <CallFooter
                show={isHovering}
                channel={channel}
                user={user}
                onJoinCall={handleJoinVoiceCall}
                onLeaveCall={handleLeaveVoiceCall}
            />
        </CallHeaderContainer>
    );
}

// Header with user profile and actions
function CallHeaderTop({
    recipient,
    channel,
    isHovering,
    onJoinCall
}: {
    recipient: UserProfile;
    channel: Channel;
    isHovering: boolean;
    onJoinCall: () => void;
}) {
    const [isHoveringName, setIsHoveringName] = useState(false);
    const { getUserProfile } = useUserProfileStore();
    const recipientProfile = getUserProfile(channel.recipients![0].id) || channel.recipients![0];
    const isTyping = useIsUserTyping(channel.id, recipient.id);

    return (
        <ContentHeader hide={!isHovering}>
            <UserProfileHeader>
                <div className="ml-[4px] mr-[8px]">
                    <UserAvatar user={recipient} size="24" isTyping={isTyping} />
                </div>
                <ChannelNameTextContainer
                    onMouseEnter={() => setIsHoveringName(true)}
                    onMouseLeave={() => setIsHoveringName(false)}
                >
                    <UserProfileHeaderText>
                        {recipient.displayName}
                    </UserProfileHeaderText>
                    <Tooltip
                        position="bottom"
                        show={isHoveringName}
                        text={recipient.username}
                        fontSize="14px"
                    />
                </ChannelNameTextContainer>
            </UserProfileHeader>

            <CallHeaderActions onJoinCall={onJoinCall} channel={channel} />
        </ContentHeader>
    );
}

// Header action buttons
function CallHeaderActions({
    onJoinCall,
    channel
}: {
    onJoinCall: () => void;
    channel: Channel;
}) {
    return (
        <div className="flex items-center text-[var(--interactive-normal)] gap-[8px]">
            <HeaderActionButton tooltipText="Join Voice Call" onClick={onJoinCall}>
                <PiPhoneCallFill size={20} />
            </HeaderActionButton>
            <HeaderActionButton tooltipText="Start Video Call">
                <PiVideoCameraFill size={20} />
            </HeaderActionButton>
            <HeaderActionButton tooltipText="Pinned Message">
                <BsPinAngleFill size={20} />
            </HeaderActionButton>
            <HeaderActionButton tooltipText="Add Friends to DM">
                <MdGroupAdd size={20} />
            </HeaderActionButton>
            <SearchBar channel={channel} />
        </div>
    );
}

function CallContent({
    channel,
    isHovering
}: {
    channel: Channel;
    isHovering: boolean;
}) {
    const { consumers, producers } = useMediasoupStore();
    const screenShareConsumers = Array.from(consumers.values()).filter(c => c.appData.mediaTag === 'screen');
    const screenShareProducer = Array.from(producers.values()).find(c => c.appData.mediaTag === 'screen');
    const hasScreenShare = screenShareConsumers.length > 0 || screenShareProducer;

    return (
        <div className="flex justify-center items-center gap-3 my-[16px] w-full px-[12px] py-[8px]">
            {hasScreenShare ? (
                <VideoView
                    channel={channel}
                    isHovering={isHovering}
                />
            ) : (
                <VoiceOnlyView
                    channel={channel}
                    isHovering={isHovering}
                />
            )}
        </div>
    );
}

function VideoView({
    channel,
    isHovering
}: {
    channel: Channel;
    isHovering: boolean;
}) {
    const { consumers, producers, activeSpeakers } = useMediasoupStore();
    const { getUserProfile } = useUserProfileStore();
    const voiceRings = useGetChannelVoiceRing(channel.id);
    const voiceStates = useGetChannelVoiceStates(channel.id);

    const screenShareConsumers = Array.from(consumers.values()).filter(c => c.appData.mediaTag === 'screen');
    const screenShareProducer = Array.from(producers.values()).find(c => c.appData.mediaTag === 'screen');
    const [focusedTile, setFocusedTile] = useState<ReactNode | undefined>();


    const tiles = [
        ...screenShareConsumers,
        ...(screenShareProducer ? [screenShareProducer] : []),
        ...Array.from(voiceRings),
        ...Array.from(voiceStates),
    ];

    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {focusedTile ?
                <div className="flex items-center justify-center relative w-1/2 bg-black" onClick={() => setFocusedTile(null)}>
                    {focusedTile}
                </div>
                :
                tiles.map(tile => (
                    <CallTile
                        key={getTileKey(tile)}
                        tile={tile}
                        isHovering={isHovering}
                        activeSpeakers={activeSpeakers}
                        voiceStates={voiceStates}
                        onClick={() => setFocusedTile(
                            <CallTile
                                key={getTileKey(tile)}
                                tile={tile}
                                isHovering={isHovering}
                                activeSpeakers={activeSpeakers}
                                voiceStates={voiceStates}
                                getUserProfile={getUserProfile}
                            />
                        )}
                        getUserProfile={getUserProfile}
                    />
                ))}
        </div>
    );
}

function VoiceOnlyView({
    channel,
    isHovering
}: {
    channel: Channel;
    isHovering: boolean;
}) {
    const { user } = useCurrentUserStore();
    const { getUserProfile } = useUserProfileStore();
    const { activeSpeakers } = useMediasoupStore();
    const voiceRings = useGetChannelVoiceRing(channel.id);
    const voiceStates = useGetChannelVoiceStates(channel.id);

    return (
        <AnimatePresence>
            {voiceRings.map(vr => {
                const userProfile = getUserProfile(vr.recipientId);
                return (
                    <motion.div
                        key={vr.recipientId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                    >
                        {userProfile && (
                            <AvatarImage
                                className="brightness-50"
                                src={userProfile.avatarURL ?
                                    getImageURL('avatars', userProfile.avatarURL) :
                                    getImageURL('assets', userProfile.defaultAvatarURL)
                                }
                            />
                        )}
                    </motion.div>
                );
            })}

            {voiceStates.map((vs) => {
                const participant = getUserProfile(vs.userId);
                const isSpeaking = voiceStates.find(state => state.userId === user!.id) && activeSpeakers.has(vs.userId);

                return (
                    <motion.div
                        key={vs.userId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                    >
                        {participant && (
                            <>
                                <AvatarImage
                                    className={`${isSpeaking ? 'ring-2 ring-green-500 p-[1px]' : ''}`}
                                    src={participant.avatarURL ?
                                        getImageURL('avatars', participant.avatarURL) :
                                        getImageURL('assets', participant.defaultAvatarURL)
                                    }
                                />
                                {vs.isDeafened ? <DeafenedIcon /> : vs.isMuted && <MutedIcon />}
                            </>
                        )}
                    </motion.div>
                );
            })}
        </AnimatePresence>
    );
}

function CallTile({
    tile,
    isHovering,
    activeSpeakers,
    voiceStates,
    getUserProfile,
    onClick
}: {
    tile: Consumer | Producer | VoiceRingState | VoiceState;
    isHovering: boolean;
    activeSpeakers: Map<string, boolean>;
    voiceStates: VoiceState[];
    getUserProfile: (id: string) => UserProfile | undefined;
    onClick?: () => void;
}) {
    const [activeStream, setActiveStream] = useState<Consumer | undefined>();
    const activeStreamVideoRef = useRef<HTMLVideoElement>(null!);
    const producerVideoRef = useRef<HTMLVideoElement>(null!);
    const { consumers, resumeConsumer } = useMediasoupStore();

    useEffect(() => {
        if (tile instanceof Consumer && tile.appData.mediaTag === 'screen') {
            if (tile.paused) {
                resumeConsumer(tile.id);
            }
            setActiveStream(tile);
        }
    }, [tile, resumeConsumer]);

    useEffect(() => {
        if (!activeStream) return;
        const stream = new MediaStream([activeStream.track]);
        activeStreamVideoRef.current.srcObject = stream;
    }, [activeStream]);

    useEffect(() => {
        if (!(tile instanceof Producer)) return;
        const stream = new MediaStream([tile.track!]);
        producerVideoRef.current.srcObject = stream;
    }, [tile]);

    if (tile instanceof Consumer) {
        return (
            <Tile onClick={onClick}>
                <video
                    ref={activeStream?.id === tile.id ? activeStreamVideoRef : undefined}
                    className="w-full h-full object-cover rounded-lg bg-black"
                    autoPlay
                />
            </Tile>
        );
    }

    if (tile instanceof Producer) {
        return (
            <Tile onClick={onClick}>
                <video
                    ref={producerVideoRef}
                    className="w-full h-full object-cover rounded-lg bg-black"
                    autoPlay
                />
            </Tile>
        );
    }

    if (tile instanceof VoiceRingState) {
        const user = getUserProfile(tile.recipientId);
        const isSpeaking = (voiceStates.find(vs => vs.userId === tile.recipientId) && activeSpeakers.has(tile.recipientId)) ?? false;

        if (user) {
            return (
                <Tile>
                    <UserTile user={user} isSpeaking={isSpeaking} showDisplayName={isHovering} />
                </Tile>
            );
        }
    }

    if (tile instanceof VoiceState) {
        const user = getUserProfile(tile.userId);
        const isSpeaking = (voiceStates.find(vs => vs.userId === tile.userId) && activeSpeakers.has(tile.userId)) ?? false;

        if (user) {
            return (
                <Tile key={user.id} onClick={onClick}>
                    <UserTile
                        user={user}
                        isSpeaking={isSpeaking}
                        showDisplayName={isHovering}
                        isMuted={tile.isMuted}
                        isDeafened={tile.isDeafened}
                    />
                </Tile>
            );
        }
    }

    return null;
}

function CallFooter({
    show,
    channel,
    user,
    onJoinCall,
    onLeaveCall,
}: {
    show: boolean;
    channel: Channel;
    user: any;
    onJoinCall: () => void;
    onLeaveCall: () => void;
}) {
    const { consumers, producers } = useMediasoupStore();
    const voiceStates = useGetChannelVoiceStates(channel.id);
    const screenShareConsumers = Array.from(consumers.values()).filter(c => c.appData.mediaTag === 'screen');
    const screenShareProducer = Array.from(producers.values()).find(c => c.appData.mediaTag === 'screen');
    const hasActiveStream = screenShareConsumers.length > 0 || screenShareProducer;

    if (hasActiveStream) {
        return (
            <CallFooterWithGradient
                show={show}
                voiceStates={voiceStates}
                user={user}
                onJoinCall={onJoinCall}
                onLeaveCall={onLeaveCall}
                screenShareProducer={screenShareProducer}
            />
        );
    }

    return (
        <CallFooterSimple
            show={true}
            voiceStates={voiceStates}
            user={user}
            onJoinCall={onJoinCall}
            onLeaveCall={onLeaveCall}
        />
    );
}

function CallFooterWithGradient({
    show,
    voiceStates,
    user,
    onJoinCall,
    onLeaveCall,
    screenShareProducer,
}: {
    show: boolean;
    voiceStates: VoiceState[];
    user: any;
    onJoinCall: () => void;
    onLeaveCall: () => void;
    screenShareProducer?: Producer;
}) {
    return (
        <HeaderBottomGradient className={`${show ? 'active' : ''}`}>
            <ContentFooter hide={false}>
                {voiceStates.find(vs => vs.userId === user.id) && (
                    <CallControls screenShareProducer={screenShareProducer} />
                )}
                <CallJoinLeaveButton
                    isInCall={!!voiceStates.find(vs => vs.userId === user?.id)}
                    onJoin={onJoinCall}
                    onLeave={onLeaveCall}
                />
            </ContentFooter>
        </HeaderBottomGradient>
    );
}

function CallFooterSimple({
    show,
    voiceStates,
    user,
    onJoinCall,
    onLeaveCall
}: {
    show: boolean;
    voiceStates: VoiceState[];
    user: any;
    onJoinCall: () => void;
    onLeaveCall: () => void;
}) {
    return (
        <ContentFooter hide={!show}>
            {voiceStates.find(vs => vs.userId === user.id) && (
                <CallControls />
            )}
            <CallJoinLeaveButton
                isInCall={!!voiceStates.find(vs => vs.userId === user?.id)}
                onJoin={onJoinCall}
                onLeave={onLeaveCall}
            />
        </ContentFooter>
    );
}

function CallControls({ screenShareProducer }: { screenShareProducer?: Producer }) {
    const { isMuted, isDeafened, startScreenShare, stopScreenShare, toggleMute} = useVoice();

    return (
        <CallActionsGroup>
            <CallActionButton
                className={`${isMuted ? 'bg-[var(--opacity-red-12)]' : ''}`}
                onClick={toggleMute}
            >
                <div className="h-[20px] w-[20px] flex items-center justify-center">
                    {(isMuted || isDeafened) ?
                        <BsMicMuteFill className="text-[var(--red-400)]" size={18} /> :
                        <BsMicFill size={18} />
                    }
                </div>
            </CallActionButton>

            {screenShareProducer ? (
                <CallActionButton onClick={stopScreenShare} className="bg-[var(--opacity-green-12)]">
                    <div className="h-[20px] w-[20px] flex items-center justify-center">
                        <LuScreenShareOff className="text-[var(--green-300)]" size={18} />
                    </div>
                </CallActionButton>
            ) : (
                <CallActionButton onClick={startScreenShare}>
                    <div className="h-[20px] w-[20px] flex items-center justify-center">
                        <LuScreenShare size={18} />
                    </div>
                </CallActionButton>
            )}
        </CallActionsGroup>
    );
}

function CallJoinLeaveButton({
    isInCall,
    onJoin,
    onLeave
}: {
    isInCall: boolean;
    onJoin: () => void;
    onLeave: () => void;
}) {
    if (isInCall) {
        return (
            <button className="p-[10px] bg-[var(--status-danger)] rounded-lg" onClick={onLeave}>
                <div className="px-[12px] py-[4px]">
                    <ImPhoneHangUp size={18} />
                </div>
            </button>
        );
    }

    return (
        <button className="p-[10px] bg-[var(--status-positive)] rounded-lg" onClick={onJoin}>
            <div className="px-[12px] py-[4px]">
                <PiPhoneCallFill size={18} />
            </div>
        </button>
    );
}

function getTileKey(tile: Consumer | Producer | VoiceRingState | VoiceState): string {
    if (tile instanceof Consumer || tile instanceof Producer) {
        return tile.id;
    }
    if (tile instanceof VoiceRingState) {
        return `ring-${tile.recipientId}`;
    }
    if (tile instanceof VoiceState) {
        return `voice-${tile.userId}`;
    }
    return 'unknown';
}



export function GuildChannelHeader({ channel, showMemberList, onToggleMemberList }: { channel: Channel, showMemberList: boolean, onToggleMemberList: () => void }) {
    const [isHoveringName, setIsHoveringName] = useState(false);

    return (
        <ContentHeader>
            <UserProfileHeader>
                <div className="ml-[4px] mr-[8px]">
                    {channel.type === ChannelType.Text ?
                        <PiHash size={20} strokeWidth={5} />
                        :
                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                    }
                </div>
                <ChannelNameTextContainer onMouseEnter={() => setIsHoveringName(true)} onMouseLeave={() => setIsHoveringName(false)}>
                    <UserProfileHeaderText>
                        {channel.name}
                    </UserProfileHeaderText>
                </ChannelNameTextContainer>
            </UserProfileHeader>
            <div className="flex items-center text-[var(--interactive-normal)] gap-[8px]">
                <HeaderActionButton tooltipText="Pinned Message"><BsPinAngleFill size={20} /></HeaderActionButton>
                <HeaderActionButton tooltipText="Show Member List" active={showMemberList} onClick={onToggleMemberList}>
                    <svg x="0" y="0" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM18.44 17.27c.15.43.54.73 1 .73h1.06c.83 0 1.5-.67 1.5-1.5a7.5 7.5 0 0 0-6.5-7.43c-.55-.08-.99.38-1.1.92-.06.3-.15.6-.26.87-.23.58-.05 1.3.47 1.63a9.53 9.53 0 0 1 3.83 4.78ZM12.5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 20.5a7.5 7.5 0 0 1 15 0c0 .83-.67 1.5-1.5 1.5a.2.2 0 0 1-.2-.16c-.2-.96-.56-1.87-.88-2.54-.1-.23-.42-.15-.42.1v2.1a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5Z"></path></svg>
                </HeaderActionButton>
                <SearchBar channel={channel} />
            </div>
        </ContentHeader>

    )
}
