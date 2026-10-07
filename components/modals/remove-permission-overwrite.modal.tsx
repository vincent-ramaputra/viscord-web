import Modal from "@/components/modals/modal";
import { Channel } from "@/interfaces/channel";
import { ReactNode, useState } from "react";
import { MdClose } from "react-icons/md";
import styled from "styled-components";
import ButtonSecondary from "@/components/buttons/button-secondary";
import { ChannelType } from "@/enums/channel-type.enum";
import { useRouter } from "next/navigation";
import ButtonDanger from "../buttons/button-danger";
import { useGetGuild } from "@/app/stores/guilds-store";
import { useDeleteGuildChannelMutation, useDeletePermissionOverwrite } from "@/hooks/mutations";
import { GuildMember } from "@/interfaces/guild-member";
import { Role } from "@/interfaces/role";
import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";

const ContentContainer = styled.div`
    background: var(--modal-background);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-faint);
    width: 400px;
`

const ContentHeader = styled.div`
    padding: 16px 24px 0;
    display: flex;
    justify-content: space-between;

    h1 {
        color: var(--header-primary);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-tight);
    }

    button {
        color: var(--interactive-normal);
        cursor: pointer;

        :hover {
            color: var(--interactive-hover);
        }
    }
`


const ContentBody = styled.div`
    padding: 8px 16px 0 24px;

    h2 {
        font-size: var(--text-base);
        color: var(--text-default);
        line-height: var(--line-height-tight);
        font-weight: var(--font-weight-regular);
        margin-bottom: 8px;
    }

    h3 {
        font-size: var(--text-xs);
        color: var(--header-primary);
        line-height: var(--line-height-tight);
        font-weight: var(--font-weight-medium);
        margin-bottom: 8px;
    }
`

const RadioButtonContainer = styled.div`
    padding: 12px 16px;
    display: flex;
    cursor: pointer;
    gap: 8px;
    align-items: center;
    border-radius: var(--rounded-lg);

    &:hover, &.selected {
        background: var(--background-mod-subtle);
    }

    margin-bottom: 4px;
`

const RadioInput = styled.div`
    height: 24px;
    width: 24px;
    border-radius: calc(infinity * 1px);
`

const ContentSection = styled.div`
    margin-bottom: 20px;
    line-height: 1.25;

    p {
        font-size: var(--text-base);
        color: var(--text-default);
        b {
        font-weight: var(--font-weight-semibold);
        }
    }
`

const ContentFooter = styled.div`
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`

export function RemovePermissionOverwriteModal({ channel, target, targetType, onClose }: { channel: Channel, target: Role | GuildMember, targetType: PermissionOverwriteTargetType, onClose: () => void }) {
    const router = useRouter();
    const { getUserProfile } = useUserProfileStore();
    const profile = targetType === PermissionOverwriteTargetType.MEMBER ? getUserProfile((target as GuildMember).userId) : undefined;
    const { mutateAsync: deletePermissionOverwrite, isPending } = useDeletePermissionOverwrite();

    async function handleRemovePermissionOverwrite() {
        const targetId = targetType === PermissionOverwriteTargetType.MEMBER ? (target as GuildMember).userId : (target as Role).id;

        const response = await deletePermissionOverwrite({ channelId: channel.id, targetId });
        if (!response.success) {
            return;
        }

        onClose();
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Delete Permission Settings</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <p>Are you sure you want to delete <b>{targetType === PermissionOverwriteTargetType.MEMBER ? profile?.username : (target as Role).name}</b>? this action cannot be undone.</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonDanger disabled={isPending} onClick={handleRemovePermissionOverwrite} size="lg">Delete</ButtonDanger>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}