"use client"
import { useGetDMChannels } from "@/app/stores/channels-store";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useUserTypingStore, isTypingIn } from "@/app/stores/user-typing-store";
import SidebarContentContainer from "@/components/guild-sidebar/sidebar-content-container";
import SidebarHeader from "@/components/guild-sidebar/sidebar-header";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { usePathname, useRouter } from "next/navigation";
import { Fragment } from "react";
import styled from "styled-components";

const Container = styled.div`
    padding: 8px 0;
    padding-right: 4px;
    `
const MenuContainer = styled.div`
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    `

const MenuItem = styled.div`
    display: flex;
    align-items: center;
    height: 42px;
    padding: 0 8px;
    color: var(--interactive-normal);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 4px;
    &:hover {
    background: var(--background-modifier-hover);
    color: var(--interactive-hover);
    }

    &.menu-item-active {
    background: var(--background-modifier-selected);
    color: var(--interactive-hover);
    }
`

const IconContainer = styled.div`
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    svg {
    flex-shrink: 0;
    width: 24px !important;
    height: 24px;
    }
`

const DMListContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const DMListHeader = styled.div`
    color: var(--interactive-normal);
    font-size: 14px;
    font-weight: 500;
    padding-left: 16px;
    padding-right: 8px;
    padding-bottom: 4px;
    line-height: 18px;

    &:hover {
        color: var(--interactive-hover);
    }
`

const DMListWrapper = styled.div`
    display: flex;
    flex-direction: column;
`

const Divider = styled.div`
    height: 1px;
    background-color: var(--divider-subtle);
    margin: 12px 8px;
`

const DMItemWrapper = styled.div`
    padding-left: 8px;
    position: relative;
`

const DMItemContainer = styled.div`
    display: flex;
    padding-left: 8px;
    padding-right: 16px;
    border-radius: 8px;
    align-items: center;
    height: 42px;
    color: var(--interactive-normal);
    cursor: pointer;
    &:hover {
        color: var(--interactive-hover);
        background: var(--background-mod-subtle);
    }

    &.active {
        background: var(--background-modifier-selected);
        color: var(--text-primary);
    }

    &.unread {
        color: var(--text-primary);
    }
`

const DMRecipientName = styled.p`
    font-weight: 500;
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

    &.active {
        height: 40px;
        transform: scale(1);
    }

    &.hover {
        transform: scale(1);
    }

    &.minimal {
        transform: scale(1);
        height: 10px;
    }
`
export default function MeSidebarContent() {
    const pathname = usePathname();
    const router = useRouter();
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const typingUsers = useUserTypingStore(s => s.typingUsers);
    const dmChannels = useGetDMChannels();


    const menuItems = [
        {
            id: "friends",
            path: '/channels/me',
            menuItem:
                <Fragment>
                    <IconContainer>
                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"></path></svg>
                    </IconContainer>
                    <p>Friends</p>
                </Fragment>,
        },
        {
            id: "nitro",
            path: '/store',
            menuItem:
                <Fragment>
                    <IconContainer>
                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M15 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path fill="currentColor" fillRule="evenodd" d="M7 4a1 1 0 0 0 0 2h3a1 1 0 1 1 0 2H5.5a1 1 0 0 0 0 2H8a1 1 0 1 1 0 2H6a1 1 0 1 0 0 2h1.25A8 8 0 1 0 15 4H7Zm8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd"></path><path fill="currentColor" d="M2.5 10a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2h.5Z"></path></svg>
                    </IconContainer>
                    <p>Nitro</p>
                </Fragment>,
        },
        {
            id: "shop",
            path: '/shop',
            menuItem:
                <Fragment>
                    <IconContainer>
                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M2.63 4.19A3 3 0 0 1 5.53 2H7a1 1 0 0 1 1 1v3.98a3.07 3.07 0 0 1-.3 1.35A2.97 2.97 0 0 1 4.98 10c-2 0-3.44-1.9-2.9-3.83l.55-1.98ZM10 2a1 1 0 0 0-1 1v4a3 3 0 0 0 3 3 3 3 0 0 0 3-2.97V3a1 1 0 0 0-1-1h-4ZM17 2a1 1 0 0 0-1 1v3.98a2.43 2.43 0 0 0 0 .05A2.95 2.95 0 0 0 19.02 10c2 0 3.44-1.9 2.9-3.83l-.55-1.98A3 3 0 0 0 18.47 2H17Z"></path><path fill="currentColor" d="M21 11.42V19a3 3 0 0 1-3 3h-2.75a.25.25 0 0 1-.25-.25V16a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v5.75c0 .14-.11.25-.25.25H6a3 3 0 0 1-3-3v-7.58c0-.18.2-.3.37-.24a4.46 4.46 0 0 0 4.94-1.1c.1-.12.3-.12.4 0a4.49 4.49 0 0 0 6.58 0c.1-.12.3-.12.4 0a4.45 4.45 0 0 0 4.94 1.1c.17-.07.37.06.37.24Z"></path></svg>
                    </IconContainer>
                    <p>Shop</p>
                </Fragment>,
        }
    ]


    return (
        <Fragment>
            <SidebarHeader>
                <div className={"w-full p-[10px] rounded-sm"}>
                    <p className={"text-[var(--text-muted)] bg-[var(--background-tertiary)] leading-[28px] text-sm py-[1px]] px-[6px] cursor-pointer font-medium"}>Find or start a conversation</p>
                </div>
            </SidebarHeader>
            <SidebarContentContainer>
                <Container>
                    <MenuContainer>
                        {router && menuItems.map((item) => {
                            return (
                                <MenuItem key={item.id} className={`${pathname === item.path ? "menu-item-active" : ""}`} onClick={() => router.push(item.path)}>
                                    {item.menuItem}
                                </MenuItem>
                            );
                        })}
                    </MenuContainer>
                    <Divider />
                    <DMListContainer>
                        <DMListHeader>
                            <p>Direct Messages</p>
                        </DMListHeader>
                        <DMListWrapper>
                            {dmChannels?.map((channel) => {
                                const recipient = userProfiles.get(channel.recipients![0].id)!;
                                const isActive = pathname === `/channels/me/${channel.id}`;
                                const hasNewMessage = channel.userChannelState.unreadCount > 0;
                                return (
                                    <DMItemWrapper key={channel.id} >
                                        <DMItemContainer className={`${isActive && 'active'} ${!isActive && hasNewMessage && 'unread'}`} onClick={() => router.push(`/channels/me/${channel.id}`)}>
                                            {!isActive && hasNewMessage &&
                                                <PillWrapper>
                                                    <Pill className="minimal" />
                                                </PillWrapper>
                                            }
                                            <div className="mr-[12px]">
                                                <UserAvatar user={recipient} showStatus={true} isTyping={isTypingIn(typingUsers, channel.id, recipient.id)} />
                                            </div>
                                            <DMRecipientName>{recipient.displayName}</DMRecipientName>
                                        </DMItemContainer>
                                    </DMItemWrapper>);
                            })}
                        </DMListWrapper>
                    </DMListContainer>
                </Container>
            </SidebarContentContainer>
        </Fragment>
    )
}