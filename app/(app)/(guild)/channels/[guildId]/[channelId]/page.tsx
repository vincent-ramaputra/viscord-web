"use client"
import { useMessagesQuery } from "@/hooks/queries";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import styled from "styled-components";
import { GuildChannelHeader } from "./header";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useUserTypingStore, isTypingIn } from "@/app/stores/user-typing-store";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { checkPermission, getEffectivePermission } from "@/helpers/permissions.helper";
import { Permissions } from "@/enums/permissions.enum";
import { Role } from "@/interfaces/role";
import { GuildMember } from "@/interfaces/guild-member";
import { getRoleColor } from "@/helpers/color.helper";
import { ChatView } from "@/components/chat-view/chat-view";
import { useAcknowledgeGuildMessageMutation } from "@/hooks/mutations";

const MemberListContainer = styled.div`
    width: 264px;
    border-left: 1px solid var(--border-faint);
    padding-bottom: 10px;

    h3 {
        padding-top: 20px;
        padding-left: 16px;
        padding-right: 4px;
        padding-bottom: 4px;

        font-size: var(--text-sm);
        color: var(--channels-default);
    }
`

const MemberItem = styled.div`
    display: flex;
    margin-left: 8px;
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
        color: var(--text-default);
    }
`

const MemberName = styled.p`
    font-weight: 500;
    margin-right: 4px;
`

export default function Page() {
    const { guildId, channelId } = useParams<{guildId: string, channelId: string}>();
    const user = useCurrentUserStore(s => s.user);
    const guild = useGuildsStore(s => s.getGuild(guildId));
    const channel = guild?.channels.find(ch => ch.id == channelId);
    const { data: messages } = useMessagesQuery(channelId);
    const { mutateAsync: acknowledge } = useAcknowledgeGuildMessageMutation(guildId);
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const [showMemberList, setShowMemberList] = useState(true);
    const typingUsersMap = useUserTypingStore(s => s.typingUsers);
    const presenceMap = useUserPresenceStore(s => s.presenceMap);
    const allowedMembers = guild?.members.filter(member => {
        const parent = guild.channels.find(ch => ch.id === channel?.parent?.id);
        const effectivePermission = getEffectivePermission(member, guild, channel, parent);
        return checkPermission(effectivePermission, Permissions.VIEW_CHANNELS);
    }) ?? [];
    const offlineMembers = allowedMembers?.filter(re => !presenceMap.get(re.userId)) ?? [];
    const roleGroups = useMemo(() => {
        const hoistedRoles = guild?.roles.filter(role => role.isHoisted).sort((a, b) => b.position - a.position) ?? [];
        const groups: { role: Role | null, members: GuildMember[] }[] = [];

        for (const role of hoistedRoles) {
            const members = allowedMembers.filter(member => {
                const memberRoles = hoistedRoles.filter(role => member.roles.includes(role.id)).sort((a, b) => b.position - a.position);
                const highestRole = memberRoles.length > 0 ? memberRoles[0] : null;

                return highestRole?.id === role.id && member.roles.find(roleId => roleId === role.id) && !!presenceMap.get(member.userId)
            });

            if (members.length > 0) groups.push({ role, members });
        }

        const noHoistedRoleMembers = guild?.members.filter(member => {
            const roles = member.roles.map(roleId => guild.roles.find(role => roleId === role.id)).filter(role => role !== undefined);

            return !!presenceMap.get(member.userId) && !roles.some(role => role.isHoisted);
        }) ?? [];

        if (noHoistedRoleMembers.length > 0) groups.push({ role: null, members: noHoistedRoleMembers });

        return groups;
    }, [allowedMembers, guild, presenceMap]);

    if (!channel) {
        return <div>Channel not found</div>
    }

    if (!allowedMembers.find(m => m.userId === user!.id)) {
        return <div>Not allowed</div>
    }


    return (
        <div className="h-full flex flex-col">
            <GuildChannelHeader
                channel={channel}
                showMemberList={showMemberList}
                onToggleMemberList={() => setShowMemberList(!showMemberList)} />
            <div className="flex flex-1 min-h-0">
                <ChatView messages={messages ?? []} channel={channel} guild={guild} acknowledge={acknowledge} textInputPlaceholder={`Message #${channel.name}`}/>
                {showMemberList &&
                    <MemberListContainer>
                        {roleGroups.length > 0 && roleGroups.map(({ role, members }) => {
                            const roleColor = role ? getRoleColor(role?.color) : "";
                            return (
                                <div key={role?.id ?? '1'}>
                                    <h3>{role ? role.name : 'Online'} — {members.length}</h3>
                                    {members.map(member => {
                                        const user = userProfiles.get(member.userId);
                                        return (
                                            <MemberItem key={member.userId}>
                                                <div className="mr-[12px]">
                                                    {user && <UserAvatar user={user} showStatus={true} isTyping={isTypingIn(typingUsersMap, channel.id, user.id)} />}
                                                </div>
                                                <MemberName style={{ color: roleColor }}>{user?.displayName}</MemberName>
                                                {user?.id === guild?.ownerId &&
                                                    <span className="text-[var(--text-warning)]">
                                                        <svg aria-label="Server Owner" aria-hidden="false" role="img" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M5 18a1 1 0 0 0-1 1 3 3 0 0 0 3 3h10a3 3 0 0 0 3-3 1 1 0 0 0-1-1H5ZM3.04 7.76a1 1 0 0 0-1.52 1.15l2.25 6.42a1 1 0 0 0 .94.67h14.55a1 1 0 0 0 .95-.71l1.94-6.45a1 1 0 0 0-1.55-1.1l-4.11 3-3.55-5.33.82-.82a.83.83 0 0 0 0-1.18l-1.17-1.17a.83.83 0 0 0-1.18 0l-1.17 1.17a.83.83 0 0 0 0 1.18l.82.82-3.61 5.42-4.41-3.07Z"></path></svg>
                                                    </span>
                                                }
                                            </MemberItem>
                                        );
                                    })}
                                </div>);
                        })}
                        {offlineMembers.length > 0 &&
                            <>
                                <h3>Offline — {offlineMembers.length}</h3>
                                {offlineMembers.map(member => {
                                    const user = userProfiles.get(member.userId);
                                    return (
                                        <MemberItem key={member.userId}>
                                            <div className="mr-[12px]">
                                                {user && <UserAvatar user={user} showStatus={true} isTyping={isTypingIn(typingUsersMap, channel.id, user.id)} />}
                                            </div>
                                            <MemberName>{user?.displayName}</MemberName>
                                            {user?.id === guild?.ownerId &&
                                                <span className="text-[var(--text-warning)]">
                                                    <svg aria-label="Server Owner" aria-hidden="false" role="img" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M5 18a1 1 0 0 0-1 1 3 3 0 0 0 3 3h10a3 3 0 0 0 3-3 1 1 0 0 0-1-1H5ZM3.04 7.76a1 1 0 0 0-1.52 1.15l2.25 6.42a1 1 0 0 0 .94.67h14.55a1 1 0 0 0 .95-.71l1.94-6.45a1 1 0 0 0-1.55-1.1l-4.11 3-3.55-5.33.82-.82a.83.83 0 0 0 0-1.18l-1.17-1.17a.83.83 0 0 0-1.18 0l-1.17 1.17a.83.83 0 0 0 0 1.18l.82.82-3.61 5.42-4.41-3.07Z"></path></svg>
                                                </span>
                                            }
                                        </MemberItem>
                                    );
                                })}
                            </>}
                    </MemberListContainer>
                }
            </div>
        </div>
    )
}