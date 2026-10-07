import { Message } from "@/interfaces/message";
import styled from "styled-components";
import UserAvatar from "../user-avatar/user-avatar";
import { UserProfile } from "@/interfaces/user-profile";
import { dateToAMPM, datetoFullDateString } from "@/utils/date.utils";
import { ReactNode, useState } from "react";
import Tooltip from "../tooltip/tooltip";
import { MessageStatus } from "@/enums/message-status.enum";
import { useContextMenu } from "@/contexts/context-menu.context";
import { useRelationshipsQuery } from "@/hooks/queries";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { Guild } from "@/interfaces/guild";
import { numberToHex } from "@/helpers/color.helper";
import { Attachment } from "@/interfaces/attachment";
import { useUploadProgressStore } from "@/app/stores/upload-progress-store";
import GenericFileIcon from "../generic-file-icon/generic-file-icon";
import { formatFileSize } from "@/utils/file.utils";

const Container = styled.div`
    display: flex;
    padding: 2px 24px;
    max-width: 100%;
    width: auto;

    &:hover {
    background-color: var(--background-message-hover);
    }
`

const DetailContainer = styled.div`
    width: 40px;
    white-space: nowrap;
    display: flex;
    align-items: start;
    flex-shrink: 0;
`

const ContentContainer = styled.div`
    margin-left: 16px;
    font-size: 16px;
    line-height: 22px;
    user-select: text;
    max-width: 100%;
    word-break: break-all;
    flex-grow: 1;
`

const ContentText = styled.p`
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 22px;

    &.pending {
        opacity: 0.5;
    }

    &.error {
        color: var(--text-danger);
    }

`

const SubsequentMessageHelper = styled.div`
    display: flex;
    gap: 8px;
    align-items: end;
`

const TimeText = styled.p`
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    line-height: 20px;
    display: none;

    &.active {
        display: block;
    }
`

const SenderNameText = styled.p`
    color: var(--header-primary);
    line-height: 22px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
`

function getTimePoint(date: Date) {
    const now = new Date();
    const timeDifference = now.getDate() - date.getDate();
    if (timeDifference === 0) {
        return `Today at`;
    }

    if (timeDifference === 1) {
        return 'Yesterday at';
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

    return `${formattedDate},`;
}

function Time({ date, children, className }: { date: Date, children: ReactNode, className?: string }) {
    return (
        <div className="relative">
            <TimeText
                className={className ?? ''}>
                {children}
            </TimeText>
        </div>
    )
}

const AttachmentCard = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 432px;
    margin-top: 8px;
    padding: 16px;
    background-color: var(--background-primary);
    border: 1px solid var(--border-faint);
    border-radius: 8px;
`

const AttachmentDetails = styled.div`
    flex-grow: 1;
    min-width: 0;
    word-break: normal;
`

const AttachmentName = styled.a`
    display: block;
    font-size: 16px;
    line-height: 22px;
    color: var(--text-link);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &[href]:hover {
        text-decoration: underline;
    }

    &:not([href]) {
        color: var(--text-default);
    }
`

const AttachmentSize = styled.p`
    font-size: 12px;
    line-height: 16px;
    color: var(--text-muted);
`

// While uploading: "name — size" on one line. Only the name shrinks, so the size stays visible.
const UploadingHeader = styled.div`
    display: flex;
    min-width: 0;
    font-size: 16px;
    line-height: 22px;
    white-space: nowrap;
`

const UploadingName = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-default);
`

const UploadingSize = styled.span`
    flex-shrink: 0;
    color: var(--text-muted);
`

const ProgressTrack = styled.div`
    height: 8px;
    margin-top: 6px;
    border-radius: 4px;
    background-color: var(--background-modifier-accent);
    overflow: hidden;
`

const ProgressFill = styled.div`
    height: 100%;
    border-radius: 4px;
    background-color: var(--primary);
    transition: width 150ms linear;
`

function AttachmentPreview({ attachment, isPending }: { attachment: Attachment, isPending: boolean }) {
    const progress = useUploadProgressStore(s => s.progressMap.get(attachment.id) ?? 0);
    // Pending and failed messages point at a local blob: URL, which shares the app's origin
    // (an opened .html would run as Viscord), so only server URLs are linked.
    const isLocal = attachment.url.startsWith('blob:');

    if (isPending) {
        return (
            <AttachmentCard>
                <GenericFileIcon width={30} />
                <AttachmentDetails>
                    <UploadingHeader title={attachment.filename}>
                        <UploadingName>{attachment.filename}</UploadingName>
                        <UploadingSize>&nbsp;— {formatFileSize(attachment.size)}</UploadingSize>
                    </UploadingHeader>
                    <ProgressTrack><ProgressFill style={{ width: `${progress}%` }} /></ProgressTrack>
                </AttachmentDetails>
            </AttachmentCard>
        );
    }

    return (
        <AttachmentCard>
            <GenericFileIcon width={30} />
            <AttachmentDetails>
                <AttachmentName
                    href={isLocal ? undefined : attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={attachment.filename}>
                    {attachment.filename}
                </AttachmentName>
                <AttachmentSize>{formatFileSize(attachment.size)}</AttachmentSize>
            </AttachmentDetails>
        </AttachmentCard>
    );
}


export default function MessageItem({ sender, message, isSubsequent = false, guild }: { sender: UserProfile, guild?: Guild, message: Message, isSubsequent?: boolean }) {
    const time = dateToAMPM(message.createdAt);
    const [hover, setHover] = useState(false);
    const { data: relationships } = useRelationshipsQuery();
    const { showMenu } = useContextMenu();
    const highestRole = guild?.roles.filter(role => {
        const member = guild?.members.find(m => m.userId === sender.id);

        return member?.roles.find(roleId => roleId === role.id);
    }).sort((a, b) => b.position - a.position)[0];


    return (
        <Container className={`${!isSubsequent ? 'mt-[17px]' : ''} ${hover ? 'active' : ''}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <DetailContainer>
                {isSubsequent ?
                    <TimeText className={`text-[11px] ${hover ? 'active' : ''}`}>{time}</TimeText>
                    :
                    <div className="cursor-pointer" onContextMenu={(e) => {
                        const relationship = relationships?.find(rel => rel.user.id === sender.id)
                        if (relationship) {
                            showMenu(e, ContextMenuType.USER, relationship);
                        }
                    }}><UserAvatar user={sender} size="40" showStatus={false} /></div>}
            </DetailContainer>
            <ContentContainer >
                {!isSubsequent &&
                    <SubsequentMessageHelper>
                        <SenderNameText
                            style={{ color: highestRole ? numberToHex(highestRole.color!) : '' }}
                            onContextMenu={(e) => {
                                const relationship = relationships?.find(rel => rel.user.id === sender.id)
                                if (relationship) {
                                    showMenu(e, ContextMenuType.USER, relationship)
                                }
                            }}>{sender.displayName}</SenderNameText>
                        <Time date={message.createdAt} className="active">{getTimePoint(message.createdAt)} {time}</Time>
                    </SubsequentMessageHelper>
                }
                <ContentText className={`${message.status !== undefined && message.status === MessageStatus.Pending ? 'pending' : message.status !== undefined && message.status === MessageStatus.Error ? 'error' : ''}`}>{message.content}</ContentText>
                {message.attachments.length > 0 && message.attachments.map(att => <AttachmentPreview key={att.id} attachment={att} isPending={message.status === MessageStatus.Pending} />)}
            </ContentContainer>
        </Container >
    );
}