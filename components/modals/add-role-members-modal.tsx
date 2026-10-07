import styled from "styled-components";
import Modal from "./modal";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { MdClose } from "react-icons/md";
import { ChannelType } from "@/enums/channel-type.enum";
import { PiHash } from "react-icons/pi";
import TextInputSecondary from "../text-input/text-input-secondary";
import TextInput from "../text-input/text-input";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { useEffect, useState } from "react";
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
import { useAssignRoleMembers } from "@/hooks/mutations";
import ButtonTertiary from "../buttons/button-tertiary";
import { useQueryClient } from "@tanstack/react-query";
import { MESSAGES_CACHE } from "@/constants/query-keys";
import Dropdown from "../dropdown/dropdown";
import { CreateInviteDto } from "@/interfaces/dto/create-invite.dto";
import Checkbox from "../checkbox/checkbox";
import { m } from "framer-motion";

interface AddRoleMembersModalProps   {
    roleId: string;
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
    font-size: var(--text-lg);
    font-weight: 600;
    margin-bottom: 16px;
`

const ContentSecondaryTitle = styled.h2`
    display: flex;
    color: var(--header-secondary);
    gap: 4px;
`

const SearchContainer = styled.div`
    height: 40px;
    margin-top: 8px;
`

const ContentBody = styled.div`
    padding: 16px 24px;
`

const MemberContainer = styled.div`
    display: flex;
    gap: 8px;
    padding: 8px 6px;
    height: 40px;
    align-items: center;
    cursor: pointer;
    &:hover {
        background-color: var(--background-modifier-hover);
    }
`

const MemberListContainer = styled.div`
    margin-top: 16px;
    min-height: 400px;
`

const RoleMemberDisplayName = styled.p`
    color: var(--text-primary);
    font-size: var(--text-sm);
`

const RoleMemberUsername = styled.p`
    color: var(--text-muted);
    font-size: var(--text-sm);
`

const ContentFooter = styled.div`
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid var(--border-container);
`

const SelectedMemberContainer = styled.div`
    margin: 2px;
    padding: 2px 4px;

`

export function AddRoleMembersModal({ roleId, guildId, onClose }: AddRoleMembersModalProps) {
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildId);
    const role = guild?.roles.find(role => role.id === roleId);
    const [searchText, setSearchText] = useState('');
    const { getUserProfile } = useUserProfileStore();
    const filteredMembers = (guild?.members ?? []).filter(member => {
        const profile = getUserProfile(member.userId);
        return profile && role && !(member.roles.find(roleId => roleId === role.id)) && (profile.username.includes(searchText) || profile.displayName.includes(searchText));
    })
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const {mutateAsync: assignRoleMembers} = useAssignRoleMembers();
    if (!guild || !role) {
        onClose();
        return null;
    }

    async function handleAddMembers() {
        assignRoleMembers({assigneeIds: selectedMembers, guildId, roleId});
        onClose();
    }

    function toggleMember(userId: string) {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        }
        else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="">
                        <ContentTitle>Add Members</ContentTitle>
                        <ContentSecondaryTitle>Select up to {guild.members.filter(m => !m.roles.find(roleId => roleId === role.id)).length} members to add to role {role.name}</ContentSecondaryTitle>
                    </div>
                </ContentHeader>
                <ContentBody>
                    <SearchContainer>
                        {/* {selectedMembers.map(userId => {
                            const profile = getUserProfile(userId);
                            return (
                                <SelectedMemberContainer>
                                    {profile && <UserAvatar user={profile} size="16" showStatus={false} />}
                                    <p>{profile?.displayName}</p>
                                </SelectedMemberContainer>
                            )
                        })} */}
                        <TextInputSecondary
                            onChange={setSearchText}
                            value={searchText}
                            placeholder="Search for friends"
                        />
                    </SearchContainer>
                    <MemberListContainer>
                        <p className="text-sm font-[var(--font-weight-semibold)]">Members</p>
                        {filteredMembers.map(member => {
                            const profile = getUserProfile(member.userId);
                            return (
                                <MemberContainer key={member.userId} onClick={() => toggleMember(member.userId)}>
                                    <Checkbox
                                        value={selectedMembers.includes(member.userId)}
                                        onChange={(v) => {
                                            if (v) {
                                                setSelectedMembers([...selectedMembers, member.userId]);
                                            }
                                            else {
                                                setSelectedMembers([...selectedMembers.filter(id => id !== member.userId)]);
                                            }
                                        }} />
                                    {profile && <UserAvatar user={profile} size="24" showStatus={false} />}
                                    <RoleMemberDisplayName>{profile?.displayName}</RoleMemberDisplayName>
                                    <RoleMemberUsername>{profile?.username}</RoleMemberUsername>
                                </MemberContainer>
                            )
                        })}
                    </MemberListContainer>
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonPrimary onClick={handleAddMembers} disabled={selectedMembers.length === 0} size="lg">Add</ButtonPrimary>
                </ContentFooter>
            </ContentContainer>
        </Modal>);
}