
import Modal from "@/components/modals/modal";
import { Channel } from "@/interfaces/channel";
import { MdClose } from "react-icons/md";
import styled from "styled-components";
import ButtonSecondary from "@/components/buttons/button-secondary";
import { ChannelType } from "@/enums/channel-type.enum";
import { useRouter } from "next/navigation";
import ButtonDanger from "../buttons/button-danger";
import { useGetGuild } from "@/app/stores/guilds-store";
import { useDeleteGuildChannelMutation } from "@/hooks/mutations";
import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";

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

export function DeleteChannelModal({ channel, onClose }: { channel: Channel, onClose: () => void }) {
    const router = useRouter();
    const { closeSettings } = useSettingsOverlay();
    const guild = useGetGuild(channel.guildId);
    const { mutateAsync: deleteChannel, isPending } = useDeleteGuildChannelMutation(channel.guildId);

    async function handleCreateChannel() {
        await deleteChannel(channel.id);

        const remainingChannels = guild?.channels.filter(ch => ch.id !== channel.id && ch.type === ChannelType.Text) ?? [];

        if (remainingChannels.length > 0) {
            router.push(`/channels/${guild!.id}/${remainingChannels[0].id}`);
        } else {
            router.push(`/channels/${channel.guildId}`);
        }

        onClose();
        closeSettings();
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Delete {channel.type === ChannelType.Category ? "Category" : "Channel"}</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <p>Are you sure you want to delete <b>{channel.type === ChannelType.Text ? `#${channel.name}` : channel.name}</b>? this cannot be undone.</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonDanger disabled={isPending} onClick={handleCreateChannel} size="lg">Delete Channel</ButtonDanger>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}