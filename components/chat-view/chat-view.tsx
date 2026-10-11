import { Message } from "@/interfaces/message"
import { Fragment, KeyboardEvent, useMemo, useRef, useState } from "react"
import styled from "styled-components"
import MessageItem from "../message-item/message-item"
import { Acknowledge, useChannelReadState } from "@/hooks/use-channel-read-state"
import { Channel } from "@/interfaces/channel"
import { useSendMessageMutation } from "@/hooks/mutations"
import { Guild } from "@/interfaces/guild"
import { getRoleColor } from "@/helpers/color.helper"
import { useUserProfileStore } from "@/app/stores/user-profiles-store"
import { useTypingUsersFromChannel } from "@/app/stores/user-typing-store"
import { dateToShortDate } from "@/utils/date.utils"
import AttachmentUploadList from "../attachment-upload-list/attachment-upload-list"
import { FaCirclePlus } from "react-icons/fa6"
import { LINE_HEIGHT, MAX_LINE_COUNT, VERTICAL_PADDING } from "@/constants/user-interface"
import { SendMessageInput } from "@/interfaces/dto/create-message.dto"
import { sendTypingStatus } from "@/services/channels/channels.service"
import { LoadingIndicator } from "../loading-indicator/loading-indicator"

const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
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
    // display: flex;
    // align-items: flex-start;
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

function LastReadDivider() {
    return (
        <LastReadDividerLine>
            <span className="absolute flex right-0 text-[10px] leading-[13px] font-bold bg-[var(--status-danger)] rounded-sm px-[4px]">
                NEW
            </span>
        </LastReadDividerLine>
    )
}

function formatTyping(names: string[]): { subject: string, verb: string } {
    let subject = "";
    let verb = ""
    if (names.length == 0) { }
    if (names.length == 1) {
        subject = names[0];
        verb = 'is typing...'
    }
    else if (names.length < 3) {
        subject = names.join(" and ");
        verb = "are typing..."
    }
    else {
        subject = "Several people"
        verb = "are typing..."
    }

    return { subject, verb };
}

function TextInputItem({ channel, onSubmit, placeholder }: { channel: Channel, onSubmit: (message: SendMessageInput) => void, placeholder: string }) {
    const [inputHeight, setInputHeight] = useState(LINE_HEIGHT + VERTICAL_PADDING)
    const [isTypingStatusCooldown, setTypingStatusCooldown] = useState(false);

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const dto: SendMessageInput = { channelId: channel.id as string, content: text, mentions: [] as string[] };
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
        <TextInput value={text}
            onKeyDown={handleKeyDown}
            style={{ height: inputHeight }}
            onChange={(e) => onInputChanged(e.target.value)}
            placeholder={placeholder} />

    )
}


export function ChatView({ messages, channel, guild, acknowledge, textInputPlaceholder }: { messages: Message[], channel: Channel, guild?: Guild, acknowledge: Acknowledge, textInputPlaceholder: string }) {
    const groupedMessages = useMemo(() => messages.reduce((groups, message) => {
        const key = message.createdAt.toLocaleDateString();

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(message);

        return groups;
    }, {} as Record<string, Message[]>), [messages]);
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const typingUsers = useTypingUsersFromChannel(channel.id);
    const { mutate: sendMessage } = useSendMessageMutation(guild?.id);
    const { dividerAfterId } = useChannelReadState(channel, acknowledge);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingNames = typingUsers.flatMap(tu => {
        const profile = userProfiles.get(tu.userId);
        return profile ? [profile.displayName] : []
    })
    const { subject, verb } = formatTyping(typingNames);

    const nameColors = useMemo(() => {
        const colors = new Map<string, string>();
        if (!guild) return colors;
        for (const member of guild.members) {
            const highestRole = guild.roles
                .filter(role => member.roles.includes(role.id))
                .sort((a, b) => b.position - a.position)[0];
            if (highestRole) colors.set(member.userId, getRoleColor(highestRole.color));
        }
        return colors;
    }, [guild]);

    function handleSubmit(dto: SendMessageInput) {
        if (!dto.content.trim() && attachments.length == 0) return;

        sendMessage({ dto, attachments, clientId: crypto.randomUUID() });
        setAttachments([]);
    }



    return (
        <ChatContainer>
            <MessagesContainer>
                {Object.keys(groupedMessages).map((key) => {
                    const messages = groupedMessages[key];
                    return (
                        <Fragment key={key}>
                            {messages?.map((message, index) => {
                                const prev = messages.at(index - 1);
                                const isSubsequent = index !== 0 && (message.createdAt.getTime() - prev!.createdAt.getTime()) < 5 * 60_000 && message.senderId === prev!.senderId;
                                return (
                                    <Fragment key={message.id}>
                                        {message.id === dividerAfterId && <LastReadDivider />}
                                        <MessageItem
                                            message={message}
                                            isSubsequent={isSubsequent}
                                            sender={userProfiles.get(message.senderId)!}
                                            nameColor={nameColors.get(message.senderId)}
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
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            setAttachments(prev => [...prev, ...files]);
                            e.target.value = "";
                        }} />
                    <AttachmentUploadList files={attachments} onRemove={(i) => setAttachments(prev => prev.filter((_, j) => j !== i))} />
                    <div className="flex">
                        <UploadItemContainer onClick={() => fileInputRef.current?.click()}>
                            <FaCirclePlus size={20} />
                        </UploadItemContainer>
                        <TextInputItem channel={channel} onSubmit={handleSubmit} placeholder={textInputPlaceholder} />
                    </div>
                </InputContainer>
                {typingNames.length > 0 &&
                    <div className="ml-2 text-[12px] h-[24px] items-center flex absolute w-full">
                        <span className="mr-2">
                            <LoadingIndicator></LoadingIndicator>
                        </span>

                        <span className="font-bold">{subject}</span>&nbsp;{verb}
                    </div>}
            </ChatInputWrapper>
        </ChatContainer>

    );
}