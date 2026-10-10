import { useGuildsStore } from "@/app/stores/guilds-store"
import styled from "styled-components"
import TextInputSecondary from "../text-input/text-input-secondary"
import { useMemo, useState } from "react"
import ButtonPrimary from "../buttons/button-primary"
import { GuildCard } from "../guild-card/guild-card"
import ButtonTertiary from "../buttons/button-tertiary"
import ButtonSuccess from "../buttons/button-success"
import { useUpdateGuildMutation } from "@/hooks/mutations"
import { MdInfo } from "react-icons/md"
import { getErrorMessage } from "@/utils/error.utils";


const Header = styled.h2`
    font-weight: bold;
    font-size: 20px;
    margin-bottom: 4px;
`

const DescriptionText = styled.p`
    font-size: 14px;
    gap: 4px;
    margin-top: 8px;
    margin-bottom: 20px;
    line-height: 18px;

    a {
        color: var(--text-link);
        font-weight: var(--font-weight-regular);
        cursor: pointer;

        &:hover {
        text-decoration: underline;
        }
    }
`

const Label = styled.h4`
    margin-bottom: 8px;
    font-weight: var(--font-weight-medium);
`

const Separator = styled.div`
    border-bottom: 1px solid var(--border-subtle);
    margin: 32px 0;
`

const SettingsDescription = styled.p`
    color: var(--header-secondary);
    font-size: var(--text-sm);
    margin-bottom: 8px;
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

interface GuildProfileSectionProps {
    guildId: string;
}


export function GuildProfileSection({ guildId }: GuildProfileSectionProps) {
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildId)!;
    const [guildName, setGuildName] = useState(guild.name);
    const [nameError, setNameError] = useState<string | null>(null);
    const haveChanges = useMemo(() => {
        if (guildName !== guild.name) return true;

        return false;
    }, [guild, guildName]);
    const {mutateAsync: updateGuild, isPending} = useUpdateGuildMutation();

    function resetChanges() {
        setGuildName(guild.name);
    }

    async function onSaveChanges() {
        if (guildName.length === 0) {
            setNameError("Cannot be empty.");
            return;
        }

        try {
            await updateGuild({guildId, name: guildName});
        } catch (error) {
            setNameError(getErrorMessage(error));
            return;
        }

        setNameError(null);
    }

    return (
        <div className="flex flex-col gap-[16px] w-full relative px-[40px] pt-[60px]">
            <div className="flex flex-col">
                <Header>Server Profile</Header>
                <DescriptionText>Customize how your server appears in invite links and, if enabled, in Server Discovery and Announcement Channel messages</DescriptionText>
            </div>
            <div>
                <div className="">
                    <Label>Name</Label>
                    <div className="h-[40px]">
                        <TextInputSecondary error={nameError !== null} onChange={(v) => setGuildName(v)} value={guildName} />
                    </div>
                </div>
                {nameError && <ErrorMessage><MdInfo size={14}/>{nameError}</ErrorMessage>}
                <Separator />
                <div>
                    <Label>Icon</Label>
                    <SettingsDescription>We recommend an image of at least 512x512</SettingsDescription>
                    <ButtonPrimary>Change Icon</ButtonPrimary>
                </div>
                <Separator />
                <GuildCard guildId={guildId}/>
            </div>
            <SaveChangesOverlay className={haveChanges ? 'active' : ''}>
                <SaveChangesContainer>
                    <p>Careful — you have unsaved changes!</p>
                    <SaveChangesButtonLayout>
                        <ButtonTertiary size="sm" onClick={resetChanges} disabled={isPending}>Reset</ButtonTertiary>
                        <ButtonSuccess size="sm" isLoading={isPending} onClick={onSaveChanges}>Save Changes</ButtonSuccess>
                    </SaveChangesButtonLayout>
                </SaveChangesContainer>
            </SaveChangesOverlay>
        </div>

    )
}