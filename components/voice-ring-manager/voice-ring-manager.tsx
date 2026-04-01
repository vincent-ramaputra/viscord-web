import { useGetUserProfile, useUserProfileStore } from "@/app/stores/user-profiles-store";
import { getVoiceRingKey, useVoiceRingStateStore } from "@/app/stores/voice-ring-state-store";
import { UserProfile } from "@/interfaces/user-profile";
import { VoiceRingState } from "@/interfaces/voice-ring-state";
import { getImageURL } from "@/services/storage/storage.service";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { PiPhoneCallFill } from "react-icons/pi";
import styled from "styled-components";
import Tooltip from "../tooltip/tooltip";
import { useVoiceRingEvents } from "@/app/(auth)/hooks/socket-events";
import { useSocket } from "@/contexts/socket.context";
import { GET_VOICE_RINGS_EVENT, VOICE_RING_DISMISS_EVENT, VOICE_RING_EVENT } from "@/constants/events";
import { usePlaySound, useStopSound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";

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
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

    const onMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.popup-draggable')) {
            setDragging(true);
            setOffset({
                x: e.clientX - pos.x,
                y: e.clientY - pos.y,
            });
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        setPos({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
        });
    };

    const onMouseUp = () => {
        setDragging(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragging, pos, offset]);

    return (
        <PopupContainer
            className="shadow-xl popup-draggable"
            style={{ top: pos.y, left: pos.x, position: 'absolute' }}
        >
            <div className="my-[16px]">
                <AvatarImage src={user.avatarURL ? getImageURL('avatars', user.avatarURL) : getImageURL('assets', user.defaultAvatarURL)} />
            </div>
            <div className="flex gap-[4px] flex-col items-center mb-[24px]">
                <h3 className="font-bold text-[20px]">{user.displayName}</h3>
                <p>Incoming Call...</p>
            </div>
            <div className="flex gap-[8px]">
                <PopupActionButton onClick={() => !dragging && onDismiss()} tooltipText="Dismiss" type="danger" />
                <PopupActionButton onClick={() => !dragging && onAccept} tooltipText="Join Call" type="positive" />
            </div>
        </PopupContainer>
    );
}

export function VoiceRingManager() {
    const { voiceRingStates } = useVoiceRingStateStore();
    const { getUserProfile } = useUserProfileStore();
    const { user } = useCurrentUserStore();
    const pathname = usePathname();
    const { socket } = useSocket();
    const { emitDismissVoiceRing } = useVoiceRingEvents();
    const { batchUpdateVoiceRingState, removeVoiceRingState, setVoiceRingStates } = useVoiceRingStateStore();

    const handleVoiceRingDismiss = (channelId: string, userId: string) => {
        emitDismissVoiceRing(channelId, userId);
    };

    const handleVoiceRingAccept = (channelId: string, userId: string) => {
        emitDismissVoiceRing(channelId, userId);
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
            usePlaySound('ring');
        }
        if (payload.find(vr => vr.recipientId === user?.id)) {
            usePlaySound('call');
        }
    }

    const onVoiceRingDismiss = (payload: VoiceRingState) => {
        const { user } = useCurrentUserStore.getState();
        removeVoiceRingState(payload.channelId, payload.recipientId);
        if (payload.initiatorId === user?.id) {
            useStopSound('ring')
        }
        if (payload.recipientId === user?.id) {
            useStopSound('call')
        }
    }


    useEffect(() => {
        socket?.on(GET_VOICE_RINGS_EVENT, handleGetVoiceRingStates);
        socket?.on(VOICE_RING_EVENT, onVoiceRing);
        socket?.on(VOICE_RING_DISMISS_EVENT, onVoiceRingDismiss);
        return () => {
            socket?.removeListener(GET_VOICE_RINGS_EVENT, handleGetVoiceRingStates);
            socket?.removeListener(VOICE_RING_EVENT, onVoiceRing);
            socket?.removeListener(VOICE_RING_DISMISS_EVENT, handleVoiceRingDismiss);
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