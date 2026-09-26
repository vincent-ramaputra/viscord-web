import {  UserStatusString } from "@/enums/user-status.enum";
import { BsMicFill, BsMicMuteFill } from "react-icons/bs";
import { LuHeadphoneOff, LuHeadphones } from "react-icons/lu";
import { FaGear } from "react-icons/fa6";
import TransparentButton from "../transparent-button/transparent-button";
import { Fragment, useEffect, useRef, useState } from "react";
import UserAvatar from "../user-avatar/user-avatar";
import { CurrentUserProfileCard } from "../user-profile-card/user-profile-card";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import styled from "styled-components";
import { useGetChannel } from "@/app/stores/channels-store";
import { Channel } from "@/interfaces/channel";
import { ImPhoneHangUp } from "react-icons/im";
import { useRouter } from "next/navigation";
import { ChannelType } from "@/enums/channel-type.enum";
import { useGetGuildChannel } from "@/app/stores/guilds-store";
import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";
import { useVoice } from "@/hooks/use-voice";

const Container = styled.div`
  width: 100%;
  background-color: oklab(0.338524 0.00199042 -0.0121031);
  flex-direction: column;
  display: flex;
  /* align-items: center; */
  justify-content: center;
  position: relative;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
`

const UserContainer = styled.div`
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    padding: 12px 12px;
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  background-color: inherit;
  border-radius: 8px;
  border-top-left-radius: 24px;
  border-bottom-left-radius: 24px;
  padding: 4px 8px;
  cursor: pointer;
  flex-grow: 1;
  margin-right: 8px;
  cursor: pointer;

  &:hover {
    background-color: var(--background-modifier-selected);
  }
`

const UserIdentifier = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  padding: 0 4px;
  padding-left: 8px;
  line-height: 13px;
`

const DisplayName = styled.p`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: var(--header-primary);
  line-height: 18px;
  font-size: 14px;
  font-weight: 500;
`

const Subtext = styled.div`
    color: var(--header-secondary);
    line-height: 13px;
    text-overflow: ellipsis;
    position: relative;

    &.username-text {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        transform: translate3d(0, 107%, 0);
        transition: all 200ms ease;
        opacity: 0;
    }

    &.username-text-active {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }

    &.status-text {
        transform: translateZ(0);
        transition: all 200ms ease;
        opacity: 1;
    }

    &.status-text-active {
        transform: translate3d(0, -107%, 0);
        opacity: 0;
    }
`

const SettingsWrapper = styled.div`
  display: flex;
  flex: 0 1 auto;
  justify-content: center;
  align-items: center;
`

const IconContainer = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: var(--background-modifier-selected);
  }

  &.active {
  color: var(--text-danger);
  }

`

const VoiceContainer = styled.div`
    padding: 12px;
    border-bottom: 1px solid var(--border-container);
`

const VoiceStatus = styled.h2`
    color: var(--text-positive);
`

const VoiceChannelInfo = styled.p`
    font-size: var(--text-xs);
    color: var(--header-secondary);
    cursor: pointer;
    &:hover {
    text-decoration: underline;
    }
`

function Voice() {
    const { channelId } = useMediasoupStore();
    const channel: Channel = (useGetChannel(channelId!) ?? useGetGuildChannel(channelId!))!;
    const router = useRouter();
    const { leave } = useVoice();

    function navigateToChannel() {
        if (channel.type === ChannelType.DM) router.push(`/channels/me/${channelId}`);
        else router.push(`/channels/${channel.guildId}`);
    }

    async function handleLeaveVoiceCall() {
        leave();
    }
    return (
        <VoiceContainer>
            <div className="flex">
                <div className="flex flex-col flex-1">
                    <VoiceStatus>Voice Connected</VoiceStatus>
                    <VoiceChannelInfo onClick={navigateToChannel}>VR</VoiceChannelInfo>
                </div>
                <IconContainer onClick={handleLeaveVoiceCall}><ImPhoneHangUp /></IconContainer>
            </div>
        </VoiceContainer>
    );
}

export default function UserArea() {
    const { user } = useCurrentUserStore();
    const [isHovering, setIsHovering] = useState(false);
    const [showProfileCard, setShowProfileCard] = useState(false);
    const profileCardRef = useRef<HTMLDivElement>(null!)
    const { getUserProfile } = useUserProfileStore();
    const {isDeafened, isMuted, isMicOff, toggleDeafened, toggleMute} = useVoice();
    const { channelId } = useMediasoupStore();
    const { openSettings } = useSettingsOverlay();

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (showProfileCard && profileCardRef.current && !profileCardRef.current.contains(e.target as Node)) {
                setShowProfileCard(false);
            }
        }

        document.addEventListener("click", handleOutsideClick);

        return () => {
            document.removeEventListener("click", handleOutsideClick);
        }
    }, [showProfileCard])


    if (!user) {
        return <div></div>;
    }

    return (
        <Container onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            {channelId && <Voice />}
            <UserContainer>
                <UserInfo onClick={() => setShowProfileCard(true)}>
                    <UserAvatar user={user.profile} showStatus={true} />
                    <UserIdentifier>
                        <DisplayName>{user!.profile.displayName}</DisplayName>
                        <Subtext>
                            <Subtext className={`status-text ${(isHovering || showProfileCard) && "status-text-active"}`}>{UserStatusString[user!.profile.status]}</Subtext>
                            <Subtext className={`username-text ${(isHovering || showProfileCard) && "username-text-active"}`}>{user!.profile.username}</Subtext>
                        </Subtext>
                    </UserIdentifier>
                </UserInfo>
                <SettingsWrapper>
                    <TransparentButton
                        tooltipSize="14px"
                        tooltip={isMicOff ? "Turn On Microphone" : "Turn Off Microphone"}
                        tooltipPosition="top"
                        onClick={toggleMute}
                    >
                        <IconContainer className={`${isMicOff && 'active'}`}>
                            {isMicOff ? <BsMicMuteFill size={18} /> : <BsMicFill size={18} />}
                        </IconContainer>
                    </TransparentButton>
                    <TransparentButton
                        tooltipSize="14px"
                        tooltip={isDeafened ? "Undeafen" : "Deafen"}
                        tooltipPosition="top"
                        onClick={toggleDeafened}
                    >
                        <IconContainer className={`${isDeafened && 'active'}`}>
                            {isDeafened ? <LuHeadphoneOff size={18} /> : <LuHeadphones size={18} />}
                        </IconContainer>
                    </TransparentButton>
                    <TransparentButton
                        onClick={() => openSettings(SettingsOverlayType.SETTINGS)}
                        tooltipSize="14px"
                        tooltip="User Settings"
                        tooltipPosition="top">
                        <IconContainer>
                            <FaGear size={18} />
                        </IconContainer>
                    </TransparentButton>
                </SettingsWrapper>
                {showProfileCard &&
                    <div className="absolute bottom-full z-50" ref={profileCardRef}>
                        <CurrentUserProfileCard user={user.profile} />
                    </div>
                }


            </UserContainer>
        </Container>
    );
}