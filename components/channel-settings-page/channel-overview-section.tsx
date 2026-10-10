import styled from "styled-components"
import TextInputSecondary from "../text-input/text-input-secondary"
import { Channel } from "@/interfaces/channel"
import { useState } from "react"
import ButtonTertiary from "../buttons/button-tertiary"
import ButtonSuccess from "../buttons/button-success"
import { useGuildsStore } from "@/app/stores/guilds-store"
import { updateChannel } from "@/services/channels/channels.service"
import { MdInfo } from "react-icons/md"

const Header = styled.h2`
    font-weight: bold;
    font-size: 20px;
    margin-bottom: 20px;
`

const Label = styled.h4`
    margin-bottom: 8px;
    font-weight: var(--font-weight-medium);
`

const SaveChangesOverlay = styled.div`
    position: absolute;
    visibility: hidden;
    width: 100%;
    bottom: 0;
    padding: 0 20px;
    padding-bottom: 20px;
    transform: translateY(50%);
    transition: all 200ms cubic-bezier(0.68, -1.0, 0.27, 2.6);

    &.active {
        transform: translateY(0);
        visibility: visible;
    }
`

const SaveChangesContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 8px;
    background-color: var(--modal-background);
    box-shadow: var(--shadow-high);
    border: 1px solid var(--border-container);
    padding: 10px;
    padding-left: 16px;

    p {
        line-height: 20px;
        font-weight: var(--font-weight-medium);
    }
`

const SaveChangesButtonLayout = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`

const ErrorMessage = styled.p`
    display: flex;
    color: var(--text-danger);
    font-size: var(--text-xs);
    margin-top: 4px;
    gap: 4px;
    align-items: end;
`


interface ChannelOverviewSectionProps {
    channel?: Channel
}

export function ChannelOverviewSection({ channel }: ChannelOverviewSectionProps) {
    if (!channel) return null;
    const [channelName, setChannelName] = useState(channel.name ?? "");
    const [isLoading, setIsLoading] = useState(false)
    const haveChanges = channelName !== channel.name;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { upsertChannel: updateGuildChannel } = useGuildsStore();

    function resetChanges() {
        setChannelName(channel!.name ?? "");
    }

    async function onSaveChanges() {
        if (channelName.length === 0) {
            setErrorMessage('Must be between 1 and 100 in length. Channel name cannot be ""');
            return;
        }

        setIsLoading(true);
        const response = await updateChannel(channel!.id, { name: channelName });
        setIsLoading(false);

        if (!response.success) {
            setErrorMessage(response.message as string);
            return;
        }

        const updatedChannel = channel!;
        updatedChannel.name = response.data!.name;

        updateGuildChannel(channel!.guildId, channel!.id, updatedChannel);
        setErrorMessage(null);
        return;
    }


    return (
        <div className="flex flex-col gap-[16px] w-full relative">
            <div className="flex flex-col">
                <Header>Overview</Header>
                <div className="">
                    <Label>Channel Name</Label>
                    <div className="h-[40px]">
                        <TextInputSecondary error={errorMessage !== null} onChange={(v) => setChannelName(v)} value={channelName} />
                    </div>
                </div>
                {errorMessage && <ErrorMessage><MdInfo size={14}/>{errorMessage}</ErrorMessage>}
            </div>
            <SaveChangesOverlay className={haveChanges ? 'active' : ''}>
                <SaveChangesContainer>
                    <p>Careful — you have unsaved changes!</p>
                    <SaveChangesButtonLayout>
                        <ButtonTertiary size="sm" onClick={resetChanges} disabled={isLoading}>Reset</ButtonTertiary>
                        <ButtonSuccess size="sm" isLoading={isLoading} onClick={onSaveChanges}>Save Changes</ButtonSuccess>
                    </SaveChangesButtonLayout>
                </SaveChangesContainer>
            </SaveChangesOverlay>
        </div>

    )
}