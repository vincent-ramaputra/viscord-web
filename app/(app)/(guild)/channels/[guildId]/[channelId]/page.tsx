"use client"
import { useMessagesQuery } from "@/hooks/queries";
import { useParams, useRouter } from "next/navigation";
import { Fragment, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useChannelReadState } from "@/hooks/use-channel-read-state";
import styled from "styled-components";
import { GuildChannelHeader } from "./header";
import { CreateMessageDto } from "@/interfaces/dto/create-message.dto";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { MessageStatus } from "@/enums/message-status.enum";
import { Message } from "@/interfaces/message";
import MessageItem from "@/components/message-item/message-item";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { dateToShortDate } from "@/utils/date.utils";
import { FaCirclePlus } from "react-icons/fa6";
import { Channel } from "@/interfaces/channel";
import { LINE_HEIGHT, MAX_LINE_COUNT, VERTICAL_PADDING } from "@/constants/user-interface";
import { sendTypingStatus } from "@/services/channels/channels.service";
import { LoadingIndicator } from "@/components/loading-indicator/loading-indicator";
import { useIsUserTyping, useTypingUsersFromChannel, useUserTypingStore } from "@/app/stores/user-typing-store";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useAcknowledgeGuildMessageMutation, useAcknowledgeMessageMutation, useSendMessageGuildMutation } from "@/hooks/mutations";
import { checkPermission, getEffectivePermission } from "@/helpers/permissions.helper";
import { Permissions } from "@/enums/permissions.enum";
import { Role } from "@/interfaces/role";
import { GuildMember } from "@/interfaces/guild-member";
import { getRoleColor } from "@/helpers/color.helper";

const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
    // margin-bottom: 40px;
`

const MessagesContainer = styled.div`
    flex-grow: 1;
    width: auto;
    overflow-y: auto;
    padding-top: 24px;
    padding-bottom: 12px;
    display: flex;
    flex-direction: column-reverse;
    overflow-anchor: auto;

    &::-webkit-scrollbar {
        width: 16px;
    }

    &::-webkit-scrollbar-thumb {
        border: 4px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 10px;
        background-color: #888;
    }
`

const ChatInputWrapper = styled.div`
    padding: 0 8px;
    margin-bottom: 24px;
    position: relative;
`

const InputContainer = styled.div`
    width: 100%;
    background-color: var(--chat-background-default);
    border-radius: 8px;
    border: 1px solid var(--border-faint);
    display: flex;
    align-items: flex-start;
`

const TextInput = styled.textarea`
    padding: 16px 0;
    line-height: 22px;
    flex-grow: 1;
    background-color: initial;
    margin-left: 10px;
    min-height: 54px;
    resize: none;
    color: var(--text-normal);

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: var(--placeholder);
    }

    &::-ms-input-placeholder {
        color: var(--placeholder);
    }

    &::-webkit-scrollbar {
        width: 10px;
    }

    &::-webkit-scrollbar-thumb {
        border: 3px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 10px;
        background-color: #888;
    }
`

const UploadItemContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 10px 16px;
    color: var(--interactive-normal);
    cursor: pointer;
    min-height: 54px;
    
    &:hover {
        color: var(--interactive-hover);
    }
`

const MessageDivider = styled.div`
    height: 0;
    border-top: 1px solid rgba(151, 151, 159, 0.12);
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 16px;
    margin-top: 24px;
    p {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);   
        background-color: var(--background-secondary);
        padding: 0 4px;
    }
`

const LastReadDividerLine = styled.div`
    height: 0;
    border-top: 1px solid var(--status-danger);
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 6px 16px;
    position: relative;
    p {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-danger);   
        background-color: var(--background-secondary);
        padding: 0 4px;
    }
`

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

function LastReadDivider() {
    return (
        <LastReadDividerLine>
            <span className="absolute flex right-0 text-[10px] leading-[13px] font-bold bg-[var(--status-danger)] rounded-sm px-[4px]">
                NEW
            </span>
        </LastReadDividerLine>
    )
}

function TextInputItem({ channel, onSubmit }: { channel: Channel, onSubmit: (message: CreateMessageDto) => any }) {
    const [inputHeight, setInputHeight] = useState(LINE_HEIGHT + VERTICAL_PADDING)
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isTypingStatusCooldown, setTypingStatusCooldown] = useState(false);

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const dto: CreateMessageDto = { channelId: channel.id as string, content: text, attachments: attachments, mentions: [] as string[] };
            onSubmit(dto);
            onInputChanged('');
        }
    }

    function onInputChanged(text: string) {
        setText(text);
        const lineCount = 1 + (text.match(/\n/g) || []).length;
        setInputHeight((lineCount > MAX_LINE_COUNT ? MAX_LINE_COUNT : lineCount) * LINE_HEIGHT + VERTICAL_PADDING);
        if (!isTypingStatusCooldown) {
            sendTypingStatus(channel.id);
            setTypingStatusCooldown(true);
            setTimeout(() => {
                setTypingStatusCooldown(false);
            }, 8000)
        }
    }

    const [text, setText] = useState('');
    return (
        <TextInput value={text} onKeyDown={handleKeyDown} style={{ height: inputHeight }} onChange={(e) => onInputChanged(e.target.value)} placeholder={`Message #${channel.name}`} />

    )
}

function formatTyping(names: string[]) {
    if (names.length <= 0) return "";
    if (names.length == 1) return names[0];
    else return names.concat(", ");
}

export default function Page() {
    const { guildId, channelId } = useParams();
    const { user } = useCurrentUserStore();
    const { getGuild, getChannel } = useGuildsStore();
    const guild = getGuild(guildId as string);
    const channel = guild?.channels.find(ch => ch.id == channelId);
    const { data: messages } = useMessagesQuery(channelId! as string);
    const { mutateAsync: sendMessage } = useSendMessageGuildMutation(guildId as string);
    const { mutateAsync: acknowledgeMessage } = useAcknowledgeGuildMessageMutation(guildId as string);
    const { dividerAfterId } = useChannelReadState(channel, acknowledgeMessage);
    const groupedMessages = messages?.reduce((groups, message) => {
        const key = message.createdAt.toLocaleDateString();

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(message);

        return groups;
    }, {} as Record<string, Message[]>);
    const { getUserProfile } = useUserProfileStore();
    const [showMemberList, setShowMemberList] = useState(true);
    const typingUsers = useTypingUsersFromChannel(channelId as string);
    const { isUserTyping } = useUserTypingStore();
    const { presenceMap, isUserOnline } = useUserPresenceStore();
    const allowedMembers = guild?.members.filter(member => {
        const parent = guild.channels.find(ch => ch.id === channel?.parent?.id);
        const effectivePermission = getEffectivePermission(member, guild, channel, parent);
        return checkPermission(effectivePermission, Permissions.VIEW_CHANNELS);
    }) ?? [];
    const offlineMembers = allowedMembers?.filter(re => !isUserOnline(re.userId)) ?? [];
    const roleGroups = useMemo(() => {
        const hoistedRoles = guild?.roles.filter(role => role.isHoisted).sort((a, b) => b.position - a.position) ?? [];
        const groups: { role: Role | null, members: GuildMember[] }[] = [];

        for (const role of hoistedRoles) {
            const members = allowedMembers.filter(member => {
                const memberRoles = hoistedRoles.filter(role => member.roles.includes(role.id)).sort((a, b) => b.position - a.position);
                const highestRole = memberRoles.length > 0 ? memberRoles[0] : null;

                return highestRole?.id === role.id && member.roles.find(roleId => roleId === role.id) && isUserOnline(member.userId)
            });

            if (members.length > 0) groups.push({ role, members });
        }

        const noHoistedRoleMembers = guild?.members.filter(member => {
            const roles = member.roles.map(roleId => guild.roles.find(role => roleId === role.id)).filter(role => role !== undefined);

            return isUserOnline(member.userId) && !roles.some(role => role.isHoisted);
        }) ?? [];

        if (noHoistedRoleMembers.length > 0) groups.push({ role: null, members: noHoistedRoleMembers });

        return groups;
    }, [allowedMembers, guild]);



    if (!channel) {
        return <div>bingbong</div>
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
                <ChatContainer>
                    <MessagesContainer>
                        {groupedMessages && Object.keys(groupedMessages).map((key) => {
                            const messages = groupedMessages[key];
                            return (
                                <Fragment key={key}>
                                    {messages?.map(message => {
                                        const index = messages.findIndex(m => m.id === message.id)
                                        const prev = messages.at(index - 1);
                                        const isSubsequent = index !== 0 && (message.createdAt.getMinutes() - prev!.createdAt.getMinutes()) < 5 && message.senderId === prev!.senderId;
                                        return (
                                            <Fragment key={message.id}>
                                                {message.id === dividerAfterId && <LastReadDivider />}
                                                <MessageItem
                                                    message={{ ...message }}
                                                    isSubsequent={isSubsequent}
                                                    sender={getUserProfile(message.senderId)!}
                                                    guild={guild}
                                                />
                                            </Fragment>
                                        )
                                    }).reverse()}
                                    <MessageDivider><p>{dateToShortDate(messages[0].createdAt)}</p></MessageDivider>
                                </Fragment>)
                        }).reverse()}
                    </MessagesContainer>
                    <ChatInputWrapper>
                        <InputContainer>
                            <UploadItemContainer><FaCirclePlus size={20} /></UploadItemContainer>
                            <TextInputItem channel={channel} onSubmit={sendMessage} />
                        </InputContainer>
                        {typingUsers.length > 0 &&
                            <div className="ml-2 text-[12px] h-[24px] items-center flex absolute w-full">
                                <span className="mr-2">
                                    <LoadingIndicator></LoadingIndicator>
                                </span>

                                <span className="font-bold">{formatTyping(typingUsers.map(tu => getUserProfile(tu.userId)!.displayName))}</span>&nbsp;is typing...
                            </div>}
                    </ChatInputWrapper>
                </ChatContainer>
                {showMemberList &&
                    <MemberListContainer>
                        {roleGroups.length > 0 && roleGroups.map(({ role, members }) => {
                            const roleColor = role ? getRoleColor(role?.color) : "";
                            return (
                                <div key={role?.id ?? '1'}>
                                    <h3>{role ? role.name : 'Online'} — {members.length}</h3>
                                    {members.map(member => {
                                        const user = getUserProfile(member.userId);
                                        return (
                                            <MemberItem key={member.userId}>
                                                <div className="mr-[12px]">
                                                    {user && <UserAvatar user={user} showStatus={true} isTyping={isUserTyping(channel.id, user.id)} />}
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
                                    const user = getUserProfile(member.userId);
                                    return (
                                        <MemberItem key={member.userId}>
                                            <div className="mr-[12px]">
                                                {user && <UserAvatar user={user} showStatus={true} isTyping={isUserTyping(channel.id, user.id)} />}
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