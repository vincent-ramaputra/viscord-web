import styled from "styled-components";
import Modal from "./modal";
import { useGuildsStore } from "@/app/stores/guilds-store";
import TextInputSecondary from "../text-input/text-input-secondary";
import { useState } from "react";
import UserAvatar from "../user-avatar/user-avatar";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import ButtonSecondary from "../buttons/button-secondary";
import ButtonPrimary from "../buttons/button-primary";
import { useAssignRoleMembers } from "@/hooks/mutations";
import Checkbox from "../checkbox/checkbox";
import { getErrorMessage } from "@/utils/error.utils";

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

export function AddRoleMembersModal({ roleId, guildId, onClose }: AddRoleMembersModalProps) {
    const { getGuild } = useGuildsStore();
    const guild = getGuild(guildId)!;
    const role = guild.roles.find(role => role.id === roleId)!;
    const [searchText, setSearchText] = useState('');
    const { getUserProfile } = useUserProfileStore();
    const filteredMembers = guild.members.filter(member => {
        const profile = getUserProfile(member.userId)!;
        return !(member.roles.find(roleId => roleId === role.id)) && (profile.username.includes(searchText) || profile.displayName.includes(searchText));
    })
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const {mutateAsync: assignRoleMembers, isPending} = useAssignRoleMembers();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    if (!guild) {
        onClose();
        return null;
    }

    async function handleAddMembers() {
        try {
            await assignRoleMembers({assigneeIds: selectedMembers, guildId, roleId});
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
            return;
        }
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
                    {errorMessage && <p>{errorMessage}</p>}
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonPrimary onClick={handleAddMembers} disabled={selectedMembers.length === 0 || isPending} size="lg">Add</ButtonPrimary>
                </ContentFooter>
            </ContentContainer>
        </Modal>);
}