"use client"
import { useUserPresenceStore } from "@/app/stores/user-presence-store";
import { useGetUserProfile, useUserProfileStore } from "@/app/stores/user-profiles-store";
import Tooltip from "@/components/tooltip/tooltip";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { useContextMenu } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { RelationshipType, RelationshipTypeString } from "@/enums/relationship-type.enum";
import { UserStatus, UserStatusString } from "@/enums/user-status.enum";
import Relationship from "@/interfaces/relationship";
import { acceptFriendRequest, declineFriendRequest } from "@/services/relationships/relationships.service";
import { ReactNode, useContext } from "react";
import { IoMdMore } from "react-icons/io";
import { MdCheck, MdClose } from "react-icons/md";
import styled from "styled-components";

const UserListItemContainer = styled.div`
    min-height: 62px;
    border-bottom: 1px solid var(--border-container);
`

const UserListItemWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 1px 16px;
    border-radius: 8px;
    height: 100%;
    transition: background-color 100ms linear;
    cursor: pointer;

    &:hover {
        background-color: var(--background-mod-subtle);
    }
`

const UserInfoContainer = styled.div`
    line-height: 20px;
    font-size: 14px;
`

const UsernameText = styled.div`
    line-height: 16px;
    margin-left: 5px;
    color: var(--header-secondary);
    display: none;
    visibility: none;

    ${UserListItemWrapper}:hover & {
        display: block;
        visibility: visible;
    }
`

export default function RelationshipListItem({ relationship, children }: { relationship: Relationship, children: ReactNode }) {
    const { showMenu, hideMenu } = useContextMenu();
    const { isUserOnline } = useUserPresenceStore();
    const user = useGetUserProfile(relationship.user.id);
    
    if (!user) return;
    
    return (
        <UserListItemContainer onContextMenu={(e) => showMenu(e, ContextMenuType.USER, relationship)}>
            <UserListItemWrapper>
                <div className="flex items-center flex-1">
                    <div className="mr-[12px] bg-inherit">
                        <UserAvatar user={user} showStatus={relationship.type !== RelationshipType.PendingReceived && relationship.type !== RelationshipType.Pending} />
                    </div>
                    <UserInfoContainer>
                        <div className="flex items-center">
                            <p className="text-base leading-[20px] font-semibold">{user.displayName}</p>
                            <UsernameText>{user.username}</UsernameText>
                        </div>
                        <p>{isUserOnline(user.id) ? UserStatusString[user.status] : UserStatusString[UserStatus.Offline]}</p>
                    </UserInfoContainer>
                </div>
                {children}
            </UserListItemWrapper>
        </UserListItemContainer>
    );
}
