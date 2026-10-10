import { Invite } from "@/interfaces/invite";
import { getChannelInvites } from "@/services/channels/channels.service";
import { useEffect, useState } from "react";
import styled from "styled-components";
import ButtonDanger from "../buttons/button-danger";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import UserAvatar from "../user-avatar/user-avatar";
import { MdClose } from "react-icons/md";
import { deleteInvite } from "@/services/invites/invites.service";
import { ModalType } from "@/enums/modal-type.enum";
import { useModal } from "@/contexts/modal.context";

interface ChannelInvitesSectionProps {
    channelId: string;
    guildId: string;
}

const Header = styled.h2`
    font-weight: bold;
    font-size: 20px;
    margin-bottom: 40px;
`

const DescriptionText = styled.p`
    font-size: 14px;
    gap: 4px;
    margin-bottom: 20px;

    a {
        color: var(--text-link);
        font-weight: var(--font-weight-regular);
        cursor: pointer;

        &:hover {
        text-decoration: underline;
        }
    }
`

const TableRow = styled.div`
    display: flex;
    padding: 0 8px;
    position: relative;

    &.header {
        height: 28px;
    }

    &.data {
        height: 62px;
        border: 1px solid transparent;
        border-bottom: 1px solid var(--border-container);

    }
`

const DeleteInviteButton = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    width: 14px;
    height: 14px;
    background-color: var(--interactive-normal);
    color: black;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(-50%) translateX(50%);
    visibility: hidden;
`


const DataRowContainer = styled.div`
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 100ms linear;
    position: relative;
    
     &:has(${TableRow}:hover) {
        border: 1px solid var(--border-container);
        background-color: var(--background-modifier-hover);
    }

     &:has(${TableRow}:hover) ${DeleteInviteButton}{
        visibility: visible;
     }

`

const InviterColumn = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`

const InviteCodeColumn = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`

const ExpiresColumn = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`

const InviterAvatarLayout = styled.div`
    margin-right: 12px;
`

const Divider = styled.div`
    min-height: 1px;
    max-height: 1px;
    background-color: var(--border-container);
    width: 100%;
    min-width: 100%;
    margin: 16px 0;
`

const ExpiryDate = styled.p`
    letter-spacing: 1px;
`

export function ChannelInvitesSection({ channelId, guildId }: ChannelInvitesSectionProps) {
    const [invites, setInvites] = useState<Invite[]>([]);
    const { getUserProfile } = useUserProfileStore();
    const [now, setNow] = useState(new Date());
    const { openModal } = useModal();
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        getChannelInvites(channelId).then(result => {
            if (result.ok) setInvites(result.data);
        });

        return () => clearInterval(interval);
    }, []);

    function formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);

        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const pad = (n: number) => n.toString().padStart(2, "0");

        return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }

    function formatCountdown(target: Date): string {
        const diff = target.getTime() - now.getTime();
        return formatDuration(Math.max(diff, 0));
    }

    return (
        <div className="flex flex-col gap-[16px] w-full relative">
            <div className="flex flex-col">
                <Header>Invites</Header>
                <DescriptionText>Here&apos;s a list of all active invite links You can revoke any one or&nbsp;<a onClick={() => openModal(ModalType.CREATE_INVITE, { channelId, guildId })}>create one</a>.</DescriptionText>
                <div>
                    <ButtonDanger>Pause Invites</ButtonDanger>
                </div>
                <Divider></Divider>
                <TableRow className="header">
                    <InviterColumn>Inviter</InviterColumn>
                    <InviteCodeColumn>Invite Code</InviteCodeColumn>
                    <ExpiresColumn>Expires</ExpiresColumn>
                </TableRow>
                {invites.map(invite => {
                    const inviter = getUserProfile(invite.inviterId);
                    return (
                        <DataRowContainer key={invite.id}>
                            <TableRow className="data">
                                <InviterColumn>
                                    {inviter && <InviterAvatarLayout><UserAvatar showStatus={false} user={inviter} size="24" /></InviterAvatarLayout>}
                                    <p>{inviter ? inviter.displayName : "Unknown User"}</p>
                                </InviterColumn>
                                <InviteCodeColumn>{invite.code}</InviteCodeColumn>
                                <ExpiresColumn>
                                    {invite.maxAge ?
                                        <ExpiryDate>{formatCountdown(new Date(invite.expiresAt))}</ExpiryDate>
                                        :
                                        'Never'}
                                </ExpiresColumn>
                                <DeleteInviteButton onClick={() => deleteInvite(invite.id)}>
                                    <MdClose size={12} />
                                </DeleteInviteButton>
                            </TableRow>
                        </DataRowContainer>
                    );
                })}
            </div>
        </div>
    );
}