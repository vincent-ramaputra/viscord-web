import { useGuildsStore } from "@/app/stores/guilds-store";
import { FaAngleRight, FaCheck, FaPlus, FaTrash } from "react-icons/fa6";
import styled from "styled-components";
import TextInputSecondary from "../text-input/text-input-secondary";
import { useEffect, useMemo, useState } from "react";
import ButtonPrimary from "../buttons/button-primary";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { IoMdArrowBack } from "react-icons/io";
import { Guild } from "@/interfaces/guild";
import { MdClose } from "react-icons/md";
import { Role } from "@/interfaces/role";
import { getRoleColor, hexToNumber, numberToHex } from "@/helpers/color.helper";
import Checkbox from "../checkbox/checkbox";
import { Permissions } from "@/enums/permissions.enum";
import { checkPermission } from "@/helpers/permissions.helper";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import UserAvatar from "../user-avatar/user-avatar";
import { useModal } from "@/contexts/modal.context";
import { ModalType } from "@/enums/modal-type.enum";
import { useCreateRole, useUpdateMember, useUpdateRole } from "@/hooks/mutations";
import { GuildMember } from "@/interfaces/guild-member";
import ButtonTertiary from "../buttons/button-tertiary";
import ButtonSuccess from "../buttons/button-success";
import { ROLE_COLOR_DEFAULT, ROLE_COLORS } from "@/constants/guilds";


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

    a {
        color: var(--text-link);
        font-weight: var(--font-weight-regular);
        cursor: pointer;

        &:hover {
        text-decoration: underline;
        }
    }
`

const DefaultPermissionButton = styled.div`
    background-color: var(--background-mod-faint);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-container);
    display: flex;
    align-items: center;
    padding: 16px;
    padding-right: 24px;
    cursor: pointer;
    color: var(--interactive-normal);

    &:hover {
        color: var(--interactive-hover);
        background-color: var(--background-mod-subtle);
    }
`

const DefaultPermissionDescription = styled.div`
    margin-left: 16px;
    h2 {
        font-weight: var(--font-weight-bold);
        line-height: 1.5;
    }

    p {
        font-size: var(--text-xs);
    }
`

const SearchBarContainer = styled.div`
    min-height: 38px;
    flex: 1;
`

const SearchIconContainer = styled.div`
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const CreateRoleButtonLayout = styled.div`
    display: flex;
    align-items: center;
    padding: 2px;
`

const RolePriorityExplaination = styled.p`
    font-size: var(--text-sm);
    margin-top: 8px;
`

const TableRow = styled.div`
    display: flex;
    padding: 0 8px;
    position: relative;

    &.header {
        height: 28px;
        text-transform: uppercase;
        font-size: var(--text-xs);
        font-weight: var(--font-weight-semibold);
    }

    &.data {
        height: 62px;
        border: 1px solid transparent;
        border-bottom: 1px solid var(--border-container);

    }
`

const DataRowContainer = styled.div`
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 100ms linear;
    
     &:has(${TableRow}:hover) {
        border: 1px solid var(--border-container);
        background-color: var(--background-modifier-hover);
    }
`

const RoleNameColumn = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`

const MembersColumn = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`

const ActionsColumn = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`

const RoleIconContainer = styled.div`
    margin-right: 8px;
`

const EditRolesSidebar = styled.div`
    flex: 0 0 232px;
    border-right: 1px solid var(--border-container);
    padding-top: 60px;
`

const SidebarHeader = styled.div`
    padding-left: 24px;
    padding-right: 16px;
    padding-bottom: 24px;
    display: flex;
    align-items: center;
`

const BackButton = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    cursor: pointer;
    gap: 8px;

    h1 {
        text-transform: uppercase;
        font-weight: var(--font-weight-medium);
    }
`

const RoleListContainer = styled.div`
    padding: 0px 8px 96px 40px;
    display: flex;
    flex-direction: column;
    gap: 2px;
`

const RoleListItem = styled.div`
    border-radius: var(--rounded-sm);
    padding: 6px 10px;
    height: 34px;
    line-height: 24px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 100ms linear;
    gap: 8px;

    &:hover {
        background-color: var(--background-modifier-hover);
    }

    &.active {
        background-color: var(--background-modifier-selected);
    }
`

const EditRolesContent = styled.div`
    flex: 1;
    padding: 60px 42px 0 24px;

    max-width: 508px;

`

const ContentHeader = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    align-items: center;
`

const ContentTitle = styled.h1`
    text-transform: uppercase;
    font-weight: var(--font-weight-semibold);
    color: var(--header-primary);
`

const DeleteRoleButton = styled.div`
    padding: 6px;
    border-radius: var(--rounded-sm);
    color: var(--text-danger);
    cursor: pointer;

    &:hover {
        background-color: var(--background-danger-hover);
    }
`

const ContentBody = styled.div`

`

const TabItemList = styled.div`
    display: flex;
    border-bottom: 2px solid var(--border-container);
    height: 30px;
    justify-content: space-between;
`

const TabItem = styled.div`
    cursor: pointer;
    text-align: center;
    color: var(--interactive-normal);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);

    &.active {
        color: var(--text-brand);
        border-bottom: 3px solid var(--text-brand);
        margin-bottom: -2px;
    }

    &:hover {
        color: var(--interactive-hover);
        border-bottom: 3px solid var(--text-brand);
        margin-bottom: -2px;
    }

    &.disabled {
        cursor: not-allowed;
    }
`

const Label = styled.h3`
    color: var(--header-primary);
    margin-bottom: 8px; 
`

const Section = styled.div`
    border-bottom: 1px solid var(--border-container);
    padding: 16px 0;
`

const SectionDescription = styled.p`
    color: var(--text-muted);
    font-size: var(--text-sm);
`

const RoleColorHighlight = styled.div`
    min-width: 66px;
    min-height: 50px;
    border-radius: var(--rounded-sm);
    border: 1px solid var(--border-container);
    cursor: pointer;
    position: relative;
`

const RoleColorSelectedOverlay = styled.div`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
`

const SelectRoleColorContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
`

const RoleColorSelectionContainer = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`

const RoleColorSelection = styled.div`
    width: 20px;
    height: 20px;
    border-radius: var(--rounded-sm);
    cursor: pointer;
    position: relative;
`

const RoleNameInputContainer = styled.div`
    height: 38px;
`

const CheckableItem = styled.div`
    display: flex;
    gap: 24px;
`

const SectionHeader = styled.h2`
    font-size: var(--text-lg);
    font-weight: var(--text-semibold);
    color: var(--header-primary);
    margin-bottom: 12px;
`

const RoleMemberContainer = styled.div`
    border-radius: var(--rounded-sm);
    padding: 8px 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    &:hover {
        background-color: var(--background-modifier-hover);
    }
`

const RoleMemberDisplayName = styled.p`
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    font-size: var(--text-sm);
`

const RoleMemberUsername = styled.p`
    color: var(--text-muted);
    font-size: var(--text-sm);
`

const RemoveMemberButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: var(--rounded-full);
    background-color: var(--interactive-normal);
    color: black;

    &:hover {
        background-color: var(--interactive-hover);
    }
`

const RoleColorIndicator = styled.div`
    width: 12px;
    height: 12px;
    border-radius: 50%;
`

interface RoleSettingsSectionProps {
    guildId: string;
}

function RoleDisplayTab({ role, onUpdateRole }: { role: Role, onUpdateRole: (role: Role) => void }) {

    function updateRoleColor(color: string | null) {
        const colorNumber = color ? hexToNumber(color) : null;
        onUpdateRole({ ...role, color: colorNumber });
    }
    return (
        <div>
            <Section>
                <Label>Role Name <span className="text-[var(--text-danger)]">*</span></Label>
                <RoleNameInputContainer>
                    <TextInputSecondary
                        value={role.name}
                        onChange={(v) => onUpdateRole({ ...role, name: v })}
                    />
                </RoleNameInputContainer>
            </Section>
            <Section>
                <Label>Role Color <span className="text-[var(--text-danger)]">*</span></Label>
                <SectionDescription>Members use the color of the highest role they have on the roles list.</SectionDescription>
                <SelectRoleColorContainer>
                    <RoleColorHighlight style={{ backgroundColor: ROLE_COLOR_DEFAULT }} onClick={() => updateRoleColor(null)}>
                        {!role.color && <RoleColorSelectedOverlay>
                            <FaCheck className="" size={22} />
                        </RoleColorSelectedOverlay>}
                    </RoleColorHighlight>
                    <RoleColorHighlight style={{ backgroundColor: `${role.color ? numberToHex(role.color) : 'transparent'}` }} />
                    <RoleColorSelectionContainer>
                        {Object.keys(ROLE_COLORS).map(key => {
                            const color = ROLE_COLORS[key as keyof typeof ROLE_COLORS];
                            return (
                                <RoleColorSelection onClick={() => updateRoleColor(color)} key={key} style={{ backgroundColor: color }}>
                                    {role.color === hexToNumber(color) && <RoleColorSelectedOverlay>
                                        <FaCheck className="" size={12} />
                                    </RoleColorSelectedOverlay>}
                                </RoleColorSelection>
                            );
                        })}
                    </RoleColorSelectionContainer>
                </SelectRoleColorContainer>
            </Section>
            <Section>
                <CheckableItem className="flex gap-[24px]">
                    <Label>Display role members separately from online members</Label>
                    <Checkbox value={role.isHoisted} onChange={(v) => onUpdateRole({ ...role, isHoisted: v })} />
                </CheckableItem>
            </Section>
        </div>
    )
}


interface PermissionSection {
    permission: bigint;
    header: string;
    description: string;
}

function RolePermissionsTab({ role, onUpdateRole }: { role: Role, onUpdateRole: (role: Role) => void }) {

    const permissions: Record<string, PermissionSection[]> = {
        "General Server Permissions": [
            {
                permission: Permissions.VIEW_CHANNELS,
                header: 'View Channels',
                description: 'Allows members to view channels by default (excluding private channels).'
            },
            {
                permission: Permissions.MANAGE_CHANNELS,
                header: 'Manage Channels',
                description: 'Allow members to create, edit, or delete channels.'
            },
            {
                permission: Permissions.MANAGE_ROLES,
                header: 'Manage Roles',
                description: 'Allows members to create new roles and edit or delete roles lower than their highest role. Also allows members to change permissions of individual channels that they have access to.'
            },
            {
                permission: Permissions.MANAGE_SERVERS,
                header: 'Manage Server',
                description: 'Allow members to change this server&#39;s name, switch regions, view all invites, add apps to this server and create and update AutoMod rules.'
            },
        ],
        "Membership Permissions": [
            {
                permission: Permissions.CREATE_INVITES,
                header: 'Create Invite',
                description: 'Allow members to invite new people to this server.'
            }
        ],
        "Text Channel Permissions": [
            {
                permission: Permissions.SEND_MESSAGES,
                header: 'Send Messages',
                description: 'Allow members to send messages in text channels.'
            },
            {
                permission: Permissions.ATTACH_FILES,
                header: 'Attach Files',
                description: 'Allow members to upload files or media in text channels.'
            },
            {
                permission: Permissions.MENTION_ROLES,
                header: 'Mention @everyone, and All Roles',
                description: 'Allows members to use @everyone (everyone in the server). They can also @mention all roles.'
            },
            {
                permission: Permissions.MANAGE_MESSAGES,
                header: 'Manage Messages',
                description: 'Allows members to delete messages by other members or pin any message.'
            },
            {
                permission: Permissions.PIN_MESSAGES,
                header: 'Pin Messages',
                description: 'Allows members to pin or unpin any message.'
            },
        ]
    }
    return (
        <div className="flex gap-[32px] flex-col mt-[24px] overflow-y-auto">
            {Object.keys(permissions).map(sectionHeader => {
                return (
                    <div key={sectionHeader}>
                        <SectionHeader>{sectionHeader}</SectionHeader>
                        {permissions[sectionHeader].map(perm => {
                            return (
                                <Section key={perm.permission}>
                                    <CheckableItem className="flex gap-[24px]">
                                        <div className="flex-1">
                                            <Label>{perm.header}</Label>
                                            <SectionDescription>{perm.description}</SectionDescription>
                                        </div>
                                        <Checkbox
                                            value={checkPermission(BigInt(role.permissions), perm.permission)}
                                            onChange={(v) => {
                                                if (v) onUpdateRole({ ...role, permissions: (BigInt(role.permissions) | perm.permission).toString() })
                                                else onUpdateRole({ ...role, permissions: (BigInt(role.permissions) & ~perm.permission).toString() })
                                            }} />
                                    </CheckableItem>
                                </Section>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function RoleMembersTab({ role, guild }: { role: Role, guild: Guild }) {
    const [searchText, setSearchText] = useState('');
    const userProfiles = useUserProfileStore(s => s.userProfiles);
    const { openModal } = useModal();
    const { mutateAsync: updateMember } = useUpdateMember();
    const filteredRoleMembers = guild.members.filter(m => {
        const profile = userProfiles.get(m.userId);

        return (role.id === guild.id ? true : m.roles.find(roleId => roleId === role.id)) && (profile?.username.includes(searchText) || profile?.displayName.includes(searchText));
    })

    async function handleRemoveRole(memberId: string) {
        const member: GuildMember = guild.members.find(member => member.userId === memberId)!;
        try {
            await updateMember({ guildId: guild.id, memberId, roleIds: member.roles.filter(roleId => roleId !== role.id) });
        } catch (error) {
            console.error('Failed removing role from member', error);
        }
    }

    return (
        <div className="mt-[16px]">
            <div className="flex gap-[8px] mb-[16px]">
                <SearchBarContainer>
                    <TextInputSecondary
                        leftElement={<SearchIconContainer><HiMagnifyingGlass /></SearchIconContainer>}
                        placeholder="Search Members"
                        value={searchText}
                        onChange={setSearchText}
                    />
                </SearchBarContainer>
                <CreateRoleButtonLayout>
                    <ButtonPrimary onClick={() => openModal(ModalType.ADD_ROLE_MEMBERS, { guildId: guild.id, roleId: role.id })}>Add Members</ButtonPrimary>
                </CreateRoleButtonLayout>
            </div>
            {filteredRoleMembers.map(member => {
                const profile = userProfiles.get(member.userId);

                return (
                    <RoleMemberContainer key={member.userId}>
                        <div className="flex items-center gap-[8px]">
                            {profile && <UserAvatar user={profile} size="24" showStatus={false} />}
                            <RoleMemberDisplayName>{profile?.displayName}</RoleMemberDisplayName>
                            <RoleMemberUsername>{profile?.username}</RoleMemberUsername>
                        </div>
                        <RemoveMemberButton onClick={() => handleRemoveRole(member.userId)}>
                            <MdClose size={12} />
                        </RemoveMemberButton>
                    </RoleMemberContainer>
                )
            })}
        </div>

    );
}


const SaveChangesOverlay = styled.div`
    position: absolute;
    visibility: hidden;
    width: 100%;
    bottom: 0;
    padding: 0 20px;
    left: 0;
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

type Tab = 'display' | 'permissions' | 'manage-members'

function EditRolesScreen({ guild, initialRoleId, onScreenBack }: { guild: Guild, initialRoleId?: string, onScreenBack: () => void }) {
    const roles = guild.roles
        .sort((a, b) => b.position - a.position) ?? [];

    const [selectedRole, setSelectedRole] = useState<Role>(initialRoleId ? roles.find(role => role.id == initialRoleId)! : roles[0]);
    const [updatedRole, setUpdatedRole] = useState<Role>(selectedRole);
    const [selectedTab, setSelectedTab] = useState<Tab>('display');
    const members = guild.members.filter(m => m.roles.find(roleId => roleId === selectedRole.id));
    const { mutateAsync: updateRole, isPending } = useUpdateRole();
    const { mutateAsync: createRole } = useCreateRole(guild.id);
    const { openModal } = useModal();
    const haveChanges = useMemo(() => {
        let ret = false;
        if (updatedRole.name !== selectedRole.name) ret = true;
        else if (updatedRole.isHoisted !== selectedRole.isHoisted) ret = true;
        else if (updatedRole.permissions !== selectedRole.permissions) ret = true;
        else if (updatedRole.position !== selectedRole.position) ret = true;
        else if (updatedRole.color !== selectedRole.color) ret = true;

        return ret;
    }, [updatedRole, selectedRole]);

    useEffect(() => {
        const latest = guild.roles.find(role => role.id === selectedRole.id);
        if (latest) setSelectedRole(latest);
    }, [guild.roles])

    function resetChanges() {
        setUpdatedRole(selectedRole);
    }

    async function handleCreateRole() {
        try {
            setSelectedRole(await createRole());
        } catch (error) {
            console.error('Failed creating role', error);
        }
    }

    useEffect(() => {
        if (selectedRole.id === guild.id) {
            if (selectedTab === 'manage-members' || selectedTab === 'display') setSelectedTab('permissions')
        }

        setUpdatedRole(selectedRole);
    }, [selectedRole]);

    return (
        <div className="flex gap-[16px] w-full relative">
            <EditRolesSidebar>
                <SidebarHeader>
                    <BackButton onClick={onScreenBack}>
                        <IoMdArrowBack size={20} />
                        <h1>Back</h1>
                    </BackButton>
                    <FaPlus className="cursor-pointer" onClick={handleCreateRole} size={16} />
                </SidebarHeader>
                <RoleListContainer>
                    {guild.roles.map(role => {
                        const color = getRoleColor(role.color);
                        return (
                            <RoleListItem key={role.id} className={role.id === selectedRole.id ? 'active' : ''} onClick={() => setSelectedRole(role)}>
                                <RoleColorIndicator style={{ backgroundColor: color }} />
                                <p>{role.name}</p>
                            </RoleListItem>
                        )
                    })}
                </RoleListContainer>
            </EditRolesSidebar>
            <EditRolesContent>
                <ContentHeader>
                    <ContentTitle>Edit Role — {selectedRole.name}</ContentTitle>
                    <DeleteRoleButton onClick={() => openModal(ModalType.DELETE_ROLE, { role: selectedRole })}>
                        <FaTrash size={16} />
                    </DeleteRoleButton>
                </ContentHeader>
                <ContentBody>
                    <TabItemList>
                        <TabItem className={`${selectedTab === 'display' ? 'active' : ''} ${selectedRole.id === guild.id ? 'disabled' : ''}`} onClick={() => { if (selectedRole.id !== guild.id) setSelectedTab('display') }}>Display</TabItem>
                        <TabItem className={`${selectedTab === 'permissions' ? 'active' : ''} `} onClick={() => setSelectedTab('permissions')}>Permissions</TabItem>
                        <TabItem className={`${selectedTab === 'manage-members' ? 'active' : ''} ${selectedRole.id === guild.id ? 'disabled' : ''}`} onClick={() => { if (selectedRole.id !== guild.id) setSelectedTab('manage-members') }}>Manage members ({members.length})</TabItem>
                    </TabItemList>
                    {selectedTab === 'display' && <RoleDisplayTab role={updatedRole} onUpdateRole={setUpdatedRole} />}
                    {selectedTab === 'permissions' && <RolePermissionsTab role={updatedRole} onUpdateRole={setUpdatedRole} />}
                    {selectedTab === 'manage-members' && <RoleMembersTab role={selectedRole} guild={guild} />}
                </ContentBody>
                <SaveChangesOverlay className={haveChanges ? 'active' : ''}>
                    <SaveChangesContainer>
                        <p>Careful — you have unsaved changes!</p>
                        <SaveChangesButtonLayout>
                            <ButtonTertiary size="sm" onClick={resetChanges} disabled={isPending}>Reset</ButtonTertiary>
                            <ButtonSuccess size="sm" isLoading={isPending} onClick={() => updateRole(updatedRole)}>Save Changes</ButtonSuccess>
                        </SaveChangesButtonLayout>
                    </SaveChangesContainer>
                </SaveChangesOverlay>
            </EditRolesContent>
        </div>
    )
}

export function RoleSettingsSection({ guildId }: RoleSettingsSectionProps) {
    const guild = useGuildsStore(s => s.getGuild(guildId));
    const defaultPermissionsRole = guild?.roles.find(role => role.id === guildId);
    const [searchText, setSearchText] = useState('');
    const [screen, setScreen] = useState<'main' | 'edit-roles'>('main');
    const [selectedRole, setSelectedRole] = useState<string | null>();
    const { mutateAsync: createRole } = useCreateRole(guildId);
    const filteredAndSortedRoles = guild?.roles
        .filter(role => role.id !== guild.id)
        .sort((a, b) => b.position - a.position) ?? [];

    function openEditRolesScreen(selectedRoleId?: string) {
        setSelectedRole(selectedRoleId);
        setScreen('edit-roles');
    }

    async function handleCreateRole() {
        try {
            const role = await createRole();
            openEditRolesScreen(role.id);
        } catch (error) {
            console.error('Failed creating role', error);
        }
    }

    if (screen === 'main') {
        return (
            <div className="flex flex-col gap-[16px] w-full relative px-[40px] pt-[60px]">
                <div className="flex flex-col">
                    <Header>Roles</Header>
                    <DescriptionText>Use roles to group your server members and assign permissions.</DescriptionText>
                </div>
                {defaultPermissionsRole && <DefaultPermissionButton onClick={() => openEditRolesScreen(defaultPermissionsRole.id)}>
                    <div className="flex-grow flex items-center">
                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM18.44 17.27c.15.43.54.73 1 .73h1.06c.83 0 1.5-.67 1.5-1.5a7.5 7.5 0 0 0-6.5-7.43c-.55-.08-.99.38-1.1.92-.06.3-.15.6-.26.87-.23.58-.05 1.3.47 1.63a9.53 9.53 0 0 1 3.83 4.78ZM12.5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 20.5a7.5 7.5 0 0 1 15 0c0 .83-.67 1.5-1.5 1.5a.2.2 0 0 1-.2-.16c-.2-.96-.56-1.87-.88-2.54-.1-.23-.42-.15-.42.1v2.1a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5Z"></path></svg>
                        <DefaultPermissionDescription >
                            <h2>Default Permissions</h2>
                            <p>{defaultPermissionsRole.name} • applies to all members</p>
                        </DefaultPermissionDescription>
                    </div>
                    <FaAngleRight />
                </DefaultPermissionButton>}
                <div className="">
                    <div className="flex gap-[8px]">
                        <SearchBarContainer>
                            <TextInputSecondary
                                leftElement={<SearchIconContainer><HiMagnifyingGlass /></SearchIconContainer>}
                                placeholder="Search Roles"
                                value={searchText}
                                onChange={setSearchText}
                            />
                        </SearchBarContainer>
                        <CreateRoleButtonLayout>
                            <ButtonPrimary onClick={handleCreateRole}>Create Role</ButtonPrimary>
                        </CreateRoleButtonLayout>
                    </div>
                    <RolePriorityExplaination>Members use the color of the highest role they have on this list. Drag Roles to reorder them.</RolePriorityExplaination>
                </div>
                <div className="">
                    <TableRow className="header">
                        <RoleNameColumn>Roles – {filteredAndSortedRoles.length}</RoleNameColumn>
                        <MembersColumn>Members</MembersColumn>
                        <ActionsColumn></ActionsColumn>
                    </TableRow>
                    {guild && filteredAndSortedRoles.map(role => {
                        const members = guild.members.filter(m => m.roles.find(roleId => roleId === role.id));
                        const color = getRoleColor(role.color);
                        return (
                            <DataRowContainer key={role.id}>
                                <TableRow className="data" onClick={() => openEditRolesScreen(role.id)}>
                                    <RoleNameColumn>
                                        <RoleIconContainer style={{ color }} ><svg className="mr-[4px]" aria-hidden="true" role="img" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.3 5.41h-.39c-.84 0-1.52-.65-1.52-1.46v-.3c0-.9-.77-1.65-1.71-1.65H7.31c-.94 0-1.71.74-1.71 1.65v.3c0 .81-.68 1.46-1.52 1.46H3.7c-.94 0-1.7.73-1.7 1.64v3.52l.01.49c.05 3.11.94 4.69 2.92 6.63C6.72 19.46 11.58 22 11.99 22c.41 0 5.27-2.54 7.06-4.31 1.98-1.95 2.92-3.53 2.92-6.63L22 7.05c0-.9-.76-1.64-1.7-1.64Zm-8.32.03a3.15 3.15 0 1 1-.01 6.3 3.15 3.15 0 0 1 .01-6.3Zm4.52 11.67c-.97.68-2.86 1.62-3.87 2.11-.42.2-.91.2-1.33 0a40.17 40.17 0 0 1-3.82-2.1.87.87 0 0 1-.37-.85c.42-2.69 2.46-3.21 4.89-3.21 2.43 0 4.4.68 4.87 3.08a.97.97 0 0 1-.38.98l.01-.01Z"></path></svg></RoleIconContainer>
                                        {role.name}
                                    </RoleNameColumn>
                                    <MembersColumn>{members.length}</MembersColumn>
                                    <ActionsColumn></ActionsColumn>
                                </TableRow>

                            </DataRowContainer>
                        );
                    })}
                </div>
            </div>
        );
    }
    else if (screen === 'edit-roles' && guild) {
        return (
            <EditRolesScreen guild={guild} initialRoleId={selectedRole!} onScreenBack={() => setScreen('main')} />
        )
    }
}