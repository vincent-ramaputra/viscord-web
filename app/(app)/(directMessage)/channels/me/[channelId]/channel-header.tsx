import ContentHeader from "@/app/(app)/content-header";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useIsUserTyping } from "@/app/stores/user-typing-store";
import { getChannelVoiceStates, useChannelVoiceStates } from "@/app/stores/voice-state-store";
import Tooltip from "@/components/tooltip/tooltip";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { Channel } from "@/interfaces/channel";
import { UserProfile } from "@/interfaces/user-profile";
import { VoiceState } from "@/interfaces/voice-state";
import { ringChannelRecipients } from "@/services/channels/channels.service";
import { Consumer, Producer } from "mediasoup-client/types";
import { ReactNode, useEffect, useRef, useState } from "react";
import { BsMicFill, BsMicMuteFill, BsPinAngleFill } from "react-icons/bs";
import { LuHeadphoneOff, LuScreenShare, LuScreenShareOff } from "react-icons/lu";
import { MdGroupAdd } from "react-icons/md";
import { PiPhoneCallFill, PiVideoCameraFill } from "react-icons/pi";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { ContentFooter } from "@/app/(app)/content-footer";
import { ImPhoneHangUp } from "react-icons/im";
import { VoiceRingState } from "@/interfaces/voice-ring-state";
import ColorThief from "colorthief";
import { useVoice } from "@/hooks/use-voice";
import { UserData } from "@/interfaces/user-data";
import { useShallow } from "zustand/shallow";
import { useVoiceRingStateStore } from "@/app/stores/voice-ring-state-store";


const UserProfileHeader = styled.div`
    display: flex;
    align-items: center;
    max-height: auto;
    flex-grow: 1;
`

const UserProfileHeaderText = styled.p`
    color: var(--text-default);
    line-height: 20px;
    font-weight: 500;
    position: relative;
`

const UserProfileHeaderTextContainer = styled.div`
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 4px;
    margin-right: 8px;
    cursor: pointer;
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
`

const CallHeaderContainer = styled.div`
    display: flex;
    width: 100%;
    background: black;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
`

function HeaderActionButton({ children, onClick, tooltipText }: { children: ReactNode, onClick?: () => void, tooltipText: string }) {
    const [isHovering, setIsHovering] = useState(false);


    return (
        <HeaderActionContainer
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={onClick}>
            {children}
            <Tooltip position="bottom" show={isHovering} text={tooltipText} fontSize="14px" />
        </HeaderActionContainer>
    )
}

function SearchBar({ }: { channel: Channel }) {
    return <input />;
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
    const avatarURL = user.avatarURL ?? user.defaultAvatarURL;

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
    const user = useCurrentUserStore(s => s.user);
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const recipient: UserProfile = userProfiles.get(channel.recipients![0].id) || channel.recipients![0];
    const { join, leave } = useVoice();

    async function handleJoinVoiceCall() {
        const voiceStates = getChannelVoiceStates(channel.id);
        if (voiceStates.length === 0) await ringChannelRecipients(channel.id);
        join(channel.id);
    }

    async function handleLeaveVoiceCall() {
        leave();
    }

    if (!user) {
        return <></>;
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
    const isTyping = useIsUserTyping(channel.id, recipient.id);

    return (
        <ContentHeader hide={!isHovering}>
            <UserProfileHeader>
                <div className="ml-[4px] mr-[8px]">
                    <UserAvatar user={recipient} size="24" isTyping={isTyping} />
                </div>
                <UserProfileHeaderTextContainer
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
                </UserProfileHeaderTextContainer>
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
    const { channelId } = useVoice();
    const isInCall = channelId === channel.id;

    return (
        <div className="flex items-center text-[var(--interactive-normal)] gap-[8px]">
            {!isInCall && (
                <HeaderActionButton tooltipText="Join Voice Call" onClick={onJoinCall}>
                    <PiPhoneCallFill size={20} />
                </HeaderActionButton>
            )}
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
    const consumers = useMediasoupStore(s => s.consumers);
    const producers = useMediasoupStore(s => s.producers);
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
    const consumers = useMediasoupStore(s => s.consumers);
    const producers = useMediasoupStore(s => s.producers);
    const activeSpeakers = useMediasoupStore(s => s.activeSpeakers);
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const voiceRings = useVoiceRingStateStore(useShallow(s => {
        return Array.from(s.voiceRingStates.entries())
            .filter(([key]) => key.startsWith(channel.id))
            .map(([, state]) => state);
    }));
    const voiceStates = useChannelVoiceStates(channel.id);

    const screenShareConsumers = Array.from(consumers.values()).filter(c => c.appData.mediaTag === 'screen');
    const screenShareProducer = Array.from(producers.values()).find(c => c.appData.mediaTag === 'screen');
    // Store which tile is focused, not the rendered element: an element kept in state keeps the props it was
    // created with, so the focused tile would stop updating (speaking, mute, a new video track).
    const [focusedTileKey, setFocusedTileKey] = useState<string | null>(null);


    const tiles = [
        ...screenShareConsumers,
        ...(screenShareProducer ? [screenShareProducer] : []),
        ...Array.from(voiceRings),
        ...Array.from(voiceStates),
    ];
    // If the focused tile goes away (they left, or stopped sharing), this is undefined and the grid shows again.
    const focusedTile = focusedTileKey ? tiles.find(tile => getTileKey(tile) === focusedTileKey) : undefined;

    function renderTile(tile: (typeof tiles)[number], onClick?: () => void) {
        return (
            <CallTile
                key={getTileKey(tile)}
                tile={tile}
                isHovering={isHovering}
                activeSpeakers={activeSpeakers}
                voiceStates={voiceStates}
                onClick={onClick}
                getUserProfile={id => userProfiles.get(id)}
            />
        );
    }

    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {focusedTile ?
                <div className="flex items-center justify-center relative bg-black" onClick={() => setFocusedTileKey(null)}>
                    {renderTile(focusedTile)}
                </div>
                :
                tiles.map(tile => renderTile(tile, () => setFocusedTileKey(getTileKey(tile))))}
        </div>
    );
}

function VoiceOnlyView({
    channel,
}: {
    channel: Channel;
    isHovering: boolean;
}) {
    const user = useCurrentUserStore(s => s.user);
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const activeSpeakers = useMediasoupStore(s => s.activeSpeakers);
    const voiceRings = useVoiceRingStateStore(useShallow(s => {
        return Array.from(s.voiceRingStates.entries())
            .filter(([key]) => key.startsWith(channel.id))
            .map(([, state]) => state);
    }));
    const voiceStates = useChannelVoiceStates(channel.id);

    return (
        <AnimatePresence>
            {voiceRings.map(vr => {
                const userProfile = userProfiles.get(vr.recipientId);
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
                                src={userProfile.avatarURL ?? userProfile.defaultAvatarURL}
                            />
                        )}
                    </motion.div>
                );
            })}

            {voiceStates.map((vs) => {
                const participant = userProfiles.get(vs.userId);
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
                                    src={participant.avatarURL ?? participant.defaultAvatarURL}
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
    const { resumeConsumer } = useVoice();

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
    user: UserData;
    onJoinCall: () => void;
    onLeaveCall: () => void;
}) {
    const consumers = useMediasoupStore(s => s.consumers);
    const producers = useMediasoupStore(s => s.producers);
    const voiceStates = useChannelVoiceStates(channel.id);
    const { channelId } = useVoice();
    const screenShareConsumers = Array.from(consumers.values()).filter(c => c.appData.mediaTag === 'screen');
    const screenShareProducer = Array.from(producers.values()).find(c => c.appData.mediaTag === 'screen');
    const hasActiveStream = screenShareConsumers.length > 0 || screenShareProducer;

    if (hasActiveStream) {
        return (
            <CallFooterWithGradient
                show={show}
                voiceStates={voiceStates}
                isInCall={channelId === channel.id}
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
            isInCall={channelId === channel.id}
            voiceStates={voiceStates}
            user={user}
            onJoinCall={onJoinCall}
            onLeaveCall={onLeaveCall}
        />
    );
}

function CallFooterWithGradient({
    show,
    isInCall,
    onJoinCall,
    onLeaveCall,
    screenShareProducer,
}: {
    show: boolean;
    isInCall: boolean;
    voiceStates: VoiceState[];
    user: UserData;
    onJoinCall: () => void;
    onLeaveCall: () => void;
    screenShareProducer?: Producer;
}) {
    return (
        <HeaderBottomGradient className={`${show ? 'active' : ''}`}>
            <ContentFooter hide={false}>
                {isInCall && (
                    <CallControls screenShareProducer={screenShareProducer} />
                )}
                <CallJoinLeaveButton
                    isInCall={isInCall}
                    onJoin={onJoinCall}
                    onLeave={onLeaveCall}
                />
            </ContentFooter>
        </HeaderBottomGradient>
    );
}

function CallFooterSimple({
    show,
    isInCall,
    onJoinCall,
    onLeaveCall
}: {
    show: boolean;
    isInCall: boolean;
    voiceStates: VoiceState[];
    user: UserData;
    onJoinCall: () => void;
    onLeaveCall: () => void;
}) {
    return (
        <ContentFooter hide={!show}>
            {isInCall && (
                <CallControls />
            )}
            <CallJoinLeaveButton
                isInCall={isInCall}
                onJoin={onJoinCall}
                onLeave={onLeaveCall}
            />
        </ContentFooter>
    );
}

function CallControls({ screenShareProducer }: { screenShareProducer?: Producer }) {
    const { isMuted, isMicOff, toggleMute, startScreenShare, stopScreenShare } = useVoice();

    return (
        <CallActionsGroup>
            <CallActionButton
                className={`${isMuted ? 'bg-[var(--opacity-red-12)]' : ''}`}
                onClick={toggleMute}
            >
                <div className="h-[20px] w-[20px] flex items-center justify-center">
                    {isMicOff ?
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



export function DMChannelHeader({ channel }: { channel: Channel }) {
    const [isHoveringName, setIsHoveringName] = useState(false);
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const recipient: UserProfile = userProfiles.get(channel.recipients![0].id) || channel.recipients![0];
    const isTyping = useIsUserTyping(channel.id, recipient.id);
    const voiceStates = useChannelVoiceStates(channel.id);
    const { join } = useVoice();

    async function handleJoinVoiceCall() {
        if (voiceStates.length === 0) await ringChannelRecipients(channel.id);
        join(channel.id);
    }

    if (voiceStates.length > 0) {
        return <CallHeader channel={channel} />
    }

    return (
        <ContentHeader>
            <UserProfileHeader>
                <div className="ml-[4px] mr-[8px]">
                    <UserAvatar user={recipient} size="24" isTyping={isTyping} />
                </div>
                <UserProfileHeaderTextContainer onMouseEnter={() => setIsHoveringName(true)} onMouseLeave={() => setIsHoveringName(false)}>
                    <UserProfileHeaderText>
                        {recipient.displayName}
                    </UserProfileHeaderText>
                    <Tooltip
                        position="bottom"
                        show={isHoveringName}
                        text={recipient.username}
                        fontSize="14px" />
                </UserProfileHeaderTextContainer>
            </UserProfileHeader>
            <div className="flex items-center text-[var(--interactive-normal)] gap-[8px]">
                <HeaderActionButton tooltipText={"Start Voice Call"} onClick={handleJoinVoiceCall}><PiPhoneCallFill size={20} /></HeaderActionButton>
                <HeaderActionButton tooltipText="Start Video Call"><PiVideoCameraFill size={20} /></HeaderActionButton>
                <HeaderActionButton tooltipText="Pinned Message"><BsPinAngleFill size={20} /></HeaderActionButton>
                <HeaderActionButton tooltipText="Add Friends to DM"><MdGroupAdd size={20} /></HeaderActionButton>
                <SearchBar channel={channel} />
            </div>
        </ContentHeader>

    )
}
