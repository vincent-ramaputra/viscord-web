import styled from "styled-components";
import Modal from "./modal";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { MdClose } from "react-icons/md";
import { ChannelType } from "@/enums/channel-type.enum";
import { PiHash } from "react-icons/pi";
import TextInputSecondary from "../text-input/text-input-secondary";
import TextInput from "../text-input/text-input";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { useEffect, useRef, useState } from "react";
import { getInviteURL } from "@/utils/url.utils";
import { useChannelsStore } from "@/app/stores/channels-store";
import UserAvatar from "../user-avatar/user-avatar";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import ButtonSecondary from "../buttons/button-secondary";
import ButtonSuccess from "../buttons/button-success";
import ButtonPrimary from "../buttons/button-primary";
import { Invite } from "@/interfaces/invite";
import { createOrGetInvite } from "@/services/channels/channels.service";
import { getInviteKeyByValue, INVITE_DURATIONS, isKeyOfInviteDuration } from "@/constants/guilds";
import { MINUTE_IN_SECONDS } from "@/constants/time";
import { sendMessage } from "@/services/messages/messages.service";
import { Channel } from "@/interfaces/channel";
import { useSendMessageMutation } from "@/hooks/mutations";
import ButtonTertiary from "../buttons/button-tertiary";
import { useQueryClient } from "@tanstack/react-query";
import { MESSAGES_CACHE } from "@/constants/query-keys";
import Dropdown from "../dropdown/dropdown";
import { CreateInviteDto } from "@/interfaces/dto/create-invite.dto";

interface CreateInviteModalProps {
    channelId?: string;
    guildId: string;
    onClose: () => void;
}

const ContentContainer = styled.div`
    background: var(--modal-background);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-faint);
    width: 442px;
    // overflow: hidden;
`

const ContentHeader = styled.div`
    padding: 16px 24px 0;
    display: flex;
    // justify-content: space-between;
    flex-direction: column;

    button {
        color: var(--interactive-normal);
        cursor: pointer;

        :hover {
            color: var(--interactive-hover);
        }
    }
`

const ContentTitle = styled.h2`
    font-size: var(--text-normal);
    font-weight: 600;
`

const ContentSecondaryTitle = styled.h2`
    display: flex;
    color: var(--header-secondary);
    gap: 4px;
`

const SearchContainer = styled.div`
    height: 30px;
    margin-top: 8px;
`

const SearchContainerIcon = styled.div`
    display: flex;
    width: 24px;
    // height: 24px;
    align-items: center;
    justify-content: center;
`

const RelationshipContainer = styled.div`
    max-height: 200px;
    overflow-y: auto;
    height: 200px;
    padding: 8px 12px;
`

const RelationshipItemContainer = styled.div`
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
`

const ContentFooter = styled.div`
    padding: 16px 24px;
    background-color: var(--background-surface-higher);
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;


    h2 {
        margin-bottom: 8px;
        font-weigth: var(--font-weight-medium);
    }
`

const InviteLinkContainer = styled.div`
    border: 1px solid var(--border-container);
    border-radius: 8px;
    display: flex;
    transition: border 150ms linear;
    &.success {
        border: 1px solid var(--status-positive);
    }
`

const InviteLinkInput = styled.input`
    flex: 1;
    margin: 10px;
    line-height: 20px;
    background-color: transparent;

    outline: none;
`

const CopyButtonLayout = styled.div`
    margin: 4px;
    margin-left: 0;
    align-self: center;
`

const InviteLinkInfo = styled.div`
    font-size: var(--text-xs);
    display: flex;
    gap: 4px;
    margin-top: 8px;

    a {
        color: var(--text-link);
        font-weight: var(--font-weight-regular);
        cursor: pointer;

        &:hover {
        text-decoration: underline;
        }
    }

`

const ContentBody = styled.div`
    padding: 16px 24px;
`

const InputLabel = styled.h3`
    margin-bottom: 8px;
    line-height: 1.25;
`

const InviteLinkSettingActionButtons = styled.div`
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    gap: 8px;
`

function RelationshipItem({ channel, inviteLink }: { channel: Channel, inviteLink: string }) {
    const queryClient = useQueryClient();
    const { getUserProfile } = useUserProfileStore();
    const { mutate: sendMessage, isPending, isSuccess } = useSendMessageMutation(channel.guildId);

    const userId = channel.recipients![0].id;
    const user = getUserProfile(userId);

    function onSendInvite() {
        sendMessage({ dto: { channelId: channel!.id, content: inviteLink, mentions: [] }, clientId: crypto.randomUUID() }, {
            onSuccess: () => queryClient.invalidateQueries({ queryKey: [MESSAGES_CACHE, channel.id], exact: true })
        });
    }

    if (!user) return <div></div>;

    return (
        <RelationshipItemContainer>
            <div className="flex items-center">
                <UserAvatar user={user!} showStatus={false} />
                <p className="ml-[8px]">{user?.displayName}</p>
            </div>
            {isSuccess ?
                <ButtonTertiary disabled>Sent</ButtonTertiary>
                :
                <ButtonSuccess
                    type="secondary"
                    isLoading={isPending}
                    onClick={onSendInvite}>Invite</ButtonSuccess>
            }
        </RelationshipItemContainer>
    );

}

export function CreateInviteModal({ channelId, guildId, onClose }: CreateInviteModalProps) {
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildId);
    const channel = guild?.channels.find(ch => ch.id === channelId);
    const [search, setSearch] = useState('');
    const { channels } = useChannelsStore();
    const [invite, setInvite] = useState<Invite | undefined>();
    // Only built once the invite has loaded, which also keeps window out of any server render.
    const inviteLink = invite ? getInviteURL(invite.code) : '';
    const [copied, setCopied] = useState(false);
    const [screen, setScreen] = useState<"create-invite" | "edit-invite">("create-invite")
    const [inviteSettings, setInviteSettings] = useState<CreateInviteDto>({ guildId, channelId, maxAge: INVITE_DURATIONS["7 days"] });
    const didRun = useRef(false);

    useEffect(() => {
        if (didRun.current) return;
        didRun.current = true;

        createOrGetInvite(inviteSettings).then(response => {
            if (response) setInvite(response.data);
        });
    }, []);

    if (!guild) {
        onClose();
        return null;
    }

    function onCopyInviteLink() {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => {
            setCopied(false)
        }, 3000)
    }

    async function onGenerateLink() {
        const response = await createOrGetInvite(inviteSettings);
        if (response.success) setInvite(response.data);
        setScreen("create-invite");
    }


    return (<Modal onClose={onClose}>
        {screen === "create-invite" ?
            <ContentContainer>
                <ContentHeader>
                    <div className="flex justify-between">
                        <ContentTitle>Invite friends to {guild.name}</ContentTitle>
                        <button onClick={onClose}><MdClose size={24} /></button>
                    </div>
                    {channel &&
                        <ContentSecondaryTitle>
                            {channel.type === ChannelType.Text && <PiHash size={20} strokeWidth={5} />}
                            {channel.type === ChannelType.Voice &&
                                <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                            }
                            {channel.name}
                        </ContentSecondaryTitle>}
                    <SearchContainer>
                        <TextInputSecondary
                            onChange={(v) => setSearch(v)}
                            value={search}
                            placeholder="Search for friends"
                            leftElement={
                                <SearchContainerIcon>
                                    <HiMagnifyingGlass className="" size={14} />
                                </SearchContainerIcon>} />
                    </SearchContainer>
                </ContentHeader>
                <RelationshipContainer>
                    {Array.from(channels.values()).filter(ch => ch.type === ChannelType.DM).map(ch => {
                        return <RelationshipItem key={ch.id} channel={ch} inviteLink={inviteLink} />
                    })}
                </RelationshipContainer>
                <ContentFooter>
                    <h2>Or, send a server invite link to a friend</h2>
                    <InviteLinkContainer className={`${copied ? 'success' : ''}`}>
                        <InviteLinkInput value={inviteLink} readOnly />
                        <CopyButtonLayout>
                            <ButtonPrimary onClick={onCopyInviteLink}>{copied ? 'Copied' : 'Copy'}</ButtonPrimary>
                        </CopyButtonLayout>
                    </InviteLinkContainer>
                    <InviteLinkInfo>
                        <p>
                            {invite?.maxAge === INVITE_DURATIONS.Never ?
                                `You invite link will never expire.`
                                :
                                `Your invite link expires in ${getInviteKeyByValue(invite?.maxAge)}.`}
                        </p>
                        <a onClick={() => setScreen("edit-invite")}>Edit Invite Link.</a>
                    </InviteLinkInfo>
                </ContentFooter>
            </ContentContainer>
            :
            <ContentContainer>
                <ContentHeader>
                    <div className="flex justify-between">
                        <ContentTitle>Server invite link settings</ContentTitle>
                        <button onClick={onClose}><MdClose size={24} /></button>
                    </div>
                </ContentHeader>
                <div>
                    <ContentBody>
                        <InputLabel>Expire After</InputLabel>
                        <Dropdown
                            values={Object.keys(INVITE_DURATIONS)}
                            value={getInviteKeyByValue(inviteSettings.maxAge)!}
                            onChange={(key) => {
                                if (isKeyOfInviteDuration(key)) {
                                    setInviteSettings(prev => ({ ...prev, maxAge: INVITE_DURATIONS[key as keyof typeof INVITE_DURATIONS]! }))
                                }
                            }
                            } />
                    </ContentBody>
                    <InviteLinkSettingActionButtons>
                        <ButtonSecondary size="lg" onClick={() => setScreen("create-invite")}>Cancel</ButtonSecondary>
                        <ButtonPrimary size="lg" onClick={onGenerateLink}>Generate a New Link</ButtonPrimary>
                    </InviteLinkSettingActionButtons>
                </div>
            </ContentContainer>
        }
    </Modal>);
}