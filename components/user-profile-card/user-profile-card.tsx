import { UserProfile } from "@/interfaces/user-profile"
import styled from "styled-components";
import { UserStatusIcon } from "../user-avatar/user-avatar";
import { RiPencilFill } from "react-icons/ri";
import { UserStatus, UserStatusString } from "@/enums/user-status.enum";
import { FaAngleRight } from "react-icons/fa6";
import { useLayoutEffect, useRef, useState } from "react";
import ColorThief from "colorthief";
import { updateStatus } from "@/services/user-profiles/user-profiles.service";
import { IoIosCopy } from "react-icons/io";
import Tooltip from "../tooltip/tooltip";
import { useCurrentUserStore } from "@/app/stores/current-user-store";


const Container = styled.div`
    background-color: var(--background-surface-high);
    border-radius: 8px;
    min-width: 300px;
`


const BannerContainer = styled.div`
    min-height: 105px;
    border-radius: 8px 8px 0 0;
    width: 100%;
`

const UserAvatarContainer = styled.div`
    position: absolute;
    left: 16px;
    bottom: 0px;
    transform: translateY(50%);
`

const DisplayNameText = styled.h1`
    font-size: 20px;
    line-height: 1.2;
    font-weight: 700;
`

const UsernameText = styled.p`
    color: var(--header-primary);
    font-size: 14px;
    line-height: 18px;
`

const Body = styled.div`
    padding: 4px 8px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`

const ActionsContainer = styled.div`
    background-color: oklab(0.298112 0.00109589 -0.00903481);
    border-radius: 8px;
    padding: 8px;
`

const ActionButton = styled.div`
    cursor: pointer;
    display: flex;
    font-size: 14px;
    line-height: 16px;
    padding: 8px;
    color: var(--interactive-normal);
    gap: 8px;
    font-weight: 500;
    width: 100%;
    border-radius: 8px;
    align-items: center;
    text-align: left;
    text-wrap: nowrap;
    &:hover {
        background-color: var(--background-modifier-hover);
        color: var(--interactive-hover);
    }
`

const Divider = styled.div`
    height: 1px;
    background-color: oklab(0.678888 0.00325716 -0.011175 / 0.121569);
    margin: 8px 4px;
`

const ChangeUserStatusContainer = styled.div`
    position: fixed;
    background-color: var(--background-surface-higher);
    padding: 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    box-shadow: var(--shadow-high);
    left: 100%;
    z-index: 999;
    width: 280px;
`


const CopyUsernameButtonContainer = styled.span`
    color: var(--interactive-normal);
    transition: all ease-in 50ms;
    visibility: hidden;
    opacity: 0;
    cursor: pointer;
    position: relative;

    &.active {
        visibility: visible;
        opacity: 1;
    }
`

const AvatarImage = styled.img`
    cursor: pointer;
    transition: all ease-in 100ms;

    &:hover {
    -webkit-filter: brightness(70%);
    }
`

function CopyUsernameButton({ user, show }: { user: UserProfile, show: boolean }) {
    enum TooltipType {
        DEFAULT,
        COPIED
    };

    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipIndex, setTooltipIndex] = useState(TooltipType.DEFAULT);

    function handleClick() {
        setTooltipIndex(TooltipType.COPIED);
        navigator.clipboard.writeText(user.username);
        setTimeout(() => {
            setTooltipIndex(TooltipType.DEFAULT);
            setShowTooltip(false);
        }, 2000);
    }

    return (
        <CopyUsernameButtonContainer
            className={`${show ? 'active' : ''}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={handleClick}>
            <IoIosCopy size={14} />
            {tooltipIndex == TooltipType.DEFAULT && <Tooltip position="top" show={showTooltip} text="Copy Username" fontSize="14px" />}
            {tooltipIndex == TooltipType.COPIED && <Tooltip className="bg-[#44a25b] text-white" position="top" show={showTooltip} text="Copied!" fontSize="14px" />}

        </CopyUsernameButtonContainer>
    )
}

function Banner({ user }: { user: UserProfile }) {
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
        <div>
            <div className="relative">
                <BannerContainer style={{ backgroundColor: bannerColor ?? "" }}></BannerContainer>
                <img
                    src={avatarURL}
                    ref={imgRef}
                    style={{ display: 'none' }}
                    crossOrigin="anonymous"
                    alt="avatar"
                    onLoad={() => getBannerColor()}
                />
                <UserAvatarContainer>
                    <div className="rounded-full p-1.5 bg-[var(--background-surface-high)]">
                        <div className="rounded-full relative flex justify-center bg-inherit" >
                            <div
                                className="rounded-full self-center overflow-hidden z-0"
                                style={{ height: "80px", width: "80px" }}>
                                <AvatarImage className="" src={user.avatarURL ?? user.defaultAvatarURL} />
                            </div>
                        </div>
                    </div>
                </UserAvatarContainer>
            </div>
            <div className="h-[40px] mb-4"></div>
        </div>
    );
}

export const CurrentUserProfileCard = ({ user }: { user: UserProfile }) => {
    const [showChangeStatusContainer, setShowChangeStatusContainer] = useState(false);
    const [showCopyUsernameButton, setShowCopyUsernameButton] = useState(false);
    const updateCurrentUserStatus = useCurrentUserStore(s => s.updateStatus);
    const changeStatusContainerRef = useRef<HTMLDivElement>(null!);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (!showChangeStatusContainer || !changeStatusContainerRef.current) return;

        const container = changeStatusContainerRef.current;
        const rect = container.getBoundingClientRect();
        const { innerWidth, innerHeight } = window;

        const padding = 8;

        let newX = 0;
        let newY = 0;

        const triggerButton = container.parentElement!;
        const triggerRect = triggerButton.getBoundingClientRect();

        newX = triggerRect.right;
        newY = triggerRect.top;

        if (newX + rect.width > innerWidth) {
            newX = innerWidth - rect.width - padding;
        }

        if (newY + rect.height > innerHeight) {
            newY = innerHeight - rect.height - padding;
        }

        setPos({ x: newX, y: newY });
    }, [showChangeStatusContainer]);

    async function handleUpdateStatus(status: UserStatus) {
        const prevStatus = user.status;
        if (status == user.status) return;
        updateCurrentUserStatus(status);
        const result = await updateStatus(status);

        if (!result.ok) {
            updateCurrentUserStatus(prevStatus);
        }

        setShowChangeStatusContainer(false);
    }

    return (
        <Container onMouseEnter={() => setShowCopyUsernameButton(true)} onMouseLeave={() => setShowCopyUsernameButton(false)}>
            <Banner user={user} />
            <Body>
                <div className="">
                    <div className="flex gap-2 items-center">
                        <DisplayNameText>{user.displayName}</DisplayNameText>
                        <CopyUsernameButton show={showCopyUsernameButton} user={user} />
                    </div>
                    <UsernameText>{user.username}</UsernameText>
                </div>
                <ActionsContainer>
                    <ActionButton>
                        <RiPencilFill size={16} />
                        <span>Edit Profile</span>
                    </ActionButton>
                    <Divider />
                    <ActionButton className="relative" onMouseEnter={() => setShowChangeStatusContainer(true)} onMouseLeave={() => setShowChangeStatusContainer(false)}>
                        <div className="w-[16px]">
                            <UserStatusIcon status={user.status} size={12} />
                        </div>
                        <span className="grow flex justify-self-start">{UserStatusString[user.status]}</span>
                        <FaAngleRight />
                        {showChangeStatusContainer &&
                            <ChangeUserStatusContainer ref={changeStatusContainerRef} style={{ top: pos.y, left: pos.x === 0 ? '100%' : pos.x }}>
                                <ActionButton onClick={() => handleUpdateStatus(UserStatus.Online)}><UserStatusIcon status={UserStatus.Online} />{UserStatusString[UserStatus.Online]}</ActionButton>
                                <Divider />
                                <ActionButton onClick={() => handleUpdateStatus(UserStatus.Idle)}><UserStatusIcon status={UserStatus.Idle} />{UserStatusString[UserStatus.Idle]}</ActionButton>
                                <ActionButton onClick={() => handleUpdateStatus(UserStatus.DoNotDisturb)}><UserStatusIcon status={UserStatus.DoNotDisturb} />
                                    <div className="">
                                        <p>{UserStatusString[UserStatus.DoNotDisturb]}</p>
                                        <p className="text-[12px]">You will not receive desktop notifications</p>

                                    </div>
                                </ActionButton>
                                <ActionButton onClick={() => handleUpdateStatus(UserStatus.Invisible)}><UserStatusIcon status={UserStatus.Invisible} />
                                    <div className="">
                                        <p>{UserStatusString[UserStatus.Invisible]}</p>
                                        <p className="text-[12px]">You will appear offline</p>

                                    </div>
                                </ActionButton>
                            </ChangeUserStatusContainer>
                        }
                    </ActionButton>
                </ActionsContainer>
            </Body>
        </Container>
    );
}

export const UserProfileCard = ({ user }: { user: UserProfile }) => {
    const [showCopyUsernameButton, setShowCopyUsernameButton] = useState(false);

    return (
        <Container onMouseEnter={() => setShowCopyUsernameButton(true)} onMouseLeave={() => setShowCopyUsernameButton(false)}>
            <Banner user={user} />
            <Body>
                <div className="">
                    <div className="flex gap-2 items-center">
                        <DisplayNameText>{user.displayName}</DisplayNameText>
                        <CopyUsernameButton show={showCopyUsernameButton} user={user} />
                    </div>
                    <UsernameText>{user.username}</UsernameText>
                </div>
            </Body>
        </Container>
    );
}