import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { getVoiceRingKey, useVoiceRingStateStore } from "@/app/stores/voice-ring-state-store";
import { UserProfile } from "@/interfaces/user-profile";
import { VoiceRingState } from "@/interfaces/voice-ring-state";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { PiPhoneCallFill } from "react-icons/pi";
import styled from "styled-components";
import Tooltip from "../tooltip/tooltip";
import { useVoiceRingEvents } from "@/app/(auth)/hooks/socket-events";
import { useSocket } from "@/contexts/socket.context";
import { GET_VOICE_RINGS_EVENT, VOICE_RING_DISMISS_EVENT, VOICE_RING_EVENT } from "@/constants/events";
import { playSound, stopSound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useChannelsStore } from "@/app/stores/channels-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useVoice } from "@/hooks/use-voice";

const PopupContainer = styled.div`
    background-color: var(--modal-background);
    border-radius: 8px;
    min-height: 267px;
    width: 232px;
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    z-index: 10;
`

const AvatarImage = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    pointer-events: none;
`

type ButtonType = 'positive' | 'danger';

interface Pos {
    x: number;
    y: number;
}

function PopupActionButton({ onClick, tooltipText, type }: { onClick: () => void, tooltipText: string, type: ButtonType }) {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <button className={`relative p-[10px] ${type === 'positive' ? 'bg-[var(--status-positive)]' : 'bg-[var(--status-danger)]'} rounded-lg`}
            onClick={onClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="px-[10px] py-[4px]">
                {type === 'positive' ?
                    <PiPhoneCallFill className="" size={20} />
                    :
                    <IoMdClose className="" size={20} />
                }
            </div>
            <Tooltip position="top" show={isHovering} text={tooltipText} fontSize="14" />
        </button>);
}


function VoiceRingPopupCard({ user, onAccept, onDismiss, initPos }: { user: UserProfile, onAccept: () => void, onDismiss: () => void, initPos: Pos }) {
    const [pos, setPos] = useState<Pos>(initPos);
    // Where inside the card the pointer grabbed it; null when not dragging.
    // A ref, not state: it changes nothing on screen, so it shouldn't cause re-renders.
    const grabOffset = useRef<Pos | null>(null);

    // Listeners live on this card only, so dragging one popup can't move the others.
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Presses on the buttons are clicks, not drags.
        if ((e.target as HTMLElement).closest('button')) return;

        grabOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        // Keep receiving pointermove/up even if the pointer leaves the card mid-drag.
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const offset = grabOffset.current;
        if (!offset) return;
        setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        grabOffset.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <PopupContainer
            className="shadow-xl"
            // touch-action: none stops touch drags from scrolling the page; user-select: none stops drags selecting the name.
            style={{ top: pos.y, left: pos.x, position: 'absolute', touchAction: 'none', userSelect: 'none', cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <div className="my-[16px]">
                <AvatarImage src={user.avatarURL ?? user.defaultAvatarURL} />
            </div>
            <div className="flex gap-[4px] flex-col items-center mb-[24px]">
                <h3 className="font-bold text-[20px]">{user.displayName}</h3>
                <p>Incoming Call...</p>
            </div>
            <div className="flex gap-[8px]">
                <PopupActionButton onClick={onDismiss} tooltipText="Dismiss" type="danger" />
                <PopupActionButton onClick={onAccept} tooltipText="Join Call" type="positive" />
            </div>
        </PopupContainer>
    );
}

// Rings are normally DM calls, but fall back to the guild route if the channel belongs to a guild.
function getChannelPath(channelId: string) {
    if (useChannelsStore.getState().getChannel(channelId)) return `/channels/me/${channelId}`;

    for (const guild of useGuildsStore.getState().guilds.values()) {
        if (guild.channels.some(ch => ch.id === channelId)) return `/channels/${guild.id}/${channelId}`;
    }
    return `/channels/me/${channelId}`;
}

export function VoiceRingManager() {
    const { voiceRingStates } = useVoiceRingStateStore();
    const { getUserProfile } = useUserProfileStore();
    const { user } = useCurrentUserStore();
    const pathname = usePathname();
    const router = useRouter();
    const { join } = useVoice();
    const { socket } = useSocket();
    const { emitDismissVoiceRing } = useVoiceRingEvents();
    const { batchUpdateVoiceRingState, removeVoiceRingState, setVoiceRingStates } = useVoiceRingStateStore();

    const handleVoiceRingDismiss = (channelId: string, userId: string) => {
        emitDismissVoiceRing(channelId, userId);
    };

    const handleVoiceRingAccept = (channelId: string, userId: string) => {
        emitDismissVoiceRing(channelId, userId);
        join(channelId);
        // The popup only shows outside the ringing channel, so take the user to the call view.
        router.push(getChannelPath(channelId));
    };

    const handleGetVoiceRingStates = (payload: VoiceRingState[]) => {
        const map: Map<string, VoiceRingState> = new Map();
        for (const vs of payload) {
            map.set(getVoiceRingKey(vs.channelId, vs.recipientId), vs);
        }

        setVoiceRingStates(map);
    }

    const onVoiceRing = (payload: VoiceRingState[]) => {
        const { user } = useCurrentUserStore.getState();
        batchUpdateVoiceRingState(payload.map(p => new VoiceRingState(p.initiatorId, p.channelId, p.recipientId)));
        if (payload.find(vr => vr.initiatorId === user?.id)) {
            playSound('ring');
        }
        if (payload.find(vr => vr.recipientId === user?.id)) {
            playSound('call');
        }
    }

    const onVoiceRingDismiss = (payload: VoiceRingState) => {
        const { user } = useCurrentUserStore.getState();
        removeVoiceRingState(payload.channelId, payload.recipientId);
        if (payload.initiatorId === user?.id) {
            stopSound('ring')
        }
        if (payload.recipientId === user?.id) {
            stopSound('call')
        }
    }


    useEffect(() => {
        socket?.on(GET_VOICE_RINGS_EVENT, handleGetVoiceRingStates);
        socket?.on(VOICE_RING_EVENT, onVoiceRing);
        socket?.on(VOICE_RING_DISMISS_EVENT, onVoiceRingDismiss);
        return () => {
            socket?.removeListener(GET_VOICE_RINGS_EVENT, handleGetVoiceRingStates);
            socket?.removeListener(VOICE_RING_EVENT, onVoiceRing);
            socket?.removeListener(VOICE_RING_DISMISS_EVENT, onVoiceRingDismiss);
        }
    }, [socket])

    return (
        <div>
            {Array.from(voiceRingStates.entries()).map(([k, v], i) => {
                const pos: Pos = { x: window.innerWidth / 2 + (i * 10), y: window.innerHeight / 2 };

                const initiator = getUserProfile(v.initiatorId);
                if (v.recipientId !== user?.id || pathname.endsWith(v.channelId) || !initiator) {
                    return null;
                }

                return (
                    <VoiceRingPopupCard
                        key={k}
                        onAccept={() => handleVoiceRingAccept(v.channelId, v.recipientId)}
                        onDismiss={() => handleVoiceRingDismiss(v.channelId, v.recipientId)}
                        user={initiator}
                        initPos={pos}
                    />
                );
            })}
        </div>
    );
}