import { useGuildsStore } from "@/app/stores/guilds-store";
import styled from "styled-components";
import ButtonSecondary from "../buttons/button-secondary";
import { FaCheck, FaCirclePlus, FaLock } from "react-icons/fa6";
import Checkbox from "../checkbox/checkbox";
import { checkPermission, denyPermission, getPermissionStatus } from "@/helpers/permissions.helper";
import { Permissions } from "@/enums/permissions.enum";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { PermissionOverwrite } from "@/interfaces/permission-ovewrite";
import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { useSyncChannel, useUpdatePermissionOverwrite } from "@/hooks/mutations";
import { getRoleColor } from "@/helpers/color.helper";
import { Role } from "@/interfaces/role";
import { GuildMember } from "@/interfaces/guild-member";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { HiSlash } from "react-icons/hi2";
import { MdClose } from "react-icons/md";
import ButtonTertiary from "../buttons/button-tertiary";
import ButtonSuccess from "../buttons/button-success";
import UserAvatar from "../user-avatar/user-avatar";
import { useContextMenu } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";

export interface ChannelPermissionsSectionProps {
    guildId: string;
    channelId: string;
}

const Header = styled.h2`
    font-weight: bold;
    font-size: 20px;
    line-height: 1.2;
`

const DescriptionText = styled.p`
    font-size: 14px;
    gap: 4px;
    line-height: 1.5;

    a {
        color: var(--text-link);
        font-weight: var(--font-weight-regular);
        cursor: pointer;

        &:hover {
        text-decoration: underline;
        }
    }
`

const SyncPermissionsCard = styled.div`
    background-color: var(--background-mod-faint);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-container);
    display: flex;
    align-items: center;
    padding: 16px;
    padding-right: 24px;
    margin-top: 8px;

`

const SyncPermissionsDescription = styled.div`
    margin-left: 16px;
    h2 {
        font-weight: var(--font-weight-bold);
        line-height: 1.5;
    }

    b {
        font-weight: var(--font-weight-semibold);
    }
`

const PrivateChannelCard = styled.div`
    margin-top: 16px;
    background-color: var(--background-mod-faint);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-container);
    padding: 16px;
    h2 {
        display: flex;
        gap: 8px;
        font-weight: var(--font-weight-bold);;
        margin-bottom: 16px;

    }

    p {
        font-size: var(--text-xs);
    }
`

const Divider = styled.div`
    min-height: 1px;
    max-height: 1px;
    background-color: var(--border-container);
    width: 100%;
    min-width: 100%;
    margin: 16px 0;
`

const PermissionTargetContainer = styled.div`
    min-width: 232px;
    margin-right: 8px;
    padding: 24px 15px 80px 0;
`

const AddTargetButton = styled.div`
    display: flex;
    justify-content: space-between;
    text-transform: uppercase;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--interactive-normal);
    padding: 0 10px 6px;
    cursor: pointer;

    &:hover {
        color: var(--interactive-hover);
    }
`

const TargetListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`

const TargetListItem = styled.div`
    border-radius: var(--rounded-sm);
    padding: 6px 10px;
    height: 34px;
    font-size: var(--text-sm);
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

const RoleColorIndicator = styled.div`
    width: 12px;
    height: 12px;
    border-radius: 50%;
`

const PermissionsContainer = styled.div`

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

const CheckableItem = styled.div`
    display: flex;
    gap: 24px;
    align-items: start;
`

const SectionHeader = styled.h2`
    font-size: var(--text-lg);
    font-weight: var(--text-semibold);
    color: var(--header-primary);
    margin-bottom: 12px;
`

const PermissionCheckContainer = styled.div`
    display: flex;
    flex-grow: 0;
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-container);
    overflow: hidden;
`

const PermissionCheckItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 26px;
    &:hover {
        background-color: var(--background-modifier-hover);
    }

    &.active {
        background-color: var(--background-modifier-selected);
    }

    &.allowed {
        color: var(--status-positive);
        &.active {
            background-color: var(--status-positive);
            color: var(--text-primary);

            &:hover {
                background-color: var(--status-positive-hover);
            }
        }
    }

    &.denied {
        color: var(--status-danger);
        &.active {
            background-color: var(--status-danger);
            color: var(--text-primary);

            &:hover {
                background-color: var(--status-danger-hover);
            }
        }
    }
`

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

const AddTargetMenuContainer = styled.div`
    position: absolute;
    background-color: var(--background-surface-high);
    cursor: default;
    z-index: 10;

`

const AddTargetMenuHeader = styled.div`
    padding: 0 20px;
    height: 54px;
    display: flex;
    align-items: center;

    h3 {
        text-transform: uppercase;
        font-weight: var(--font-weight-semibold);
        font-size: var(--text-sm);
        margin-right: 6px;
    }
`

const SearchTargetInput = styled.input`
    background-color: transparent;
    outline: none;
    font-size: var(--text-sm);
`

const TargetTypeHeader = styled.h4`
    font-weight: var(--font-weight-semibold);
    font-size: 11px;
    color: var(--header-secondary);
    padding: 0 12px;
    line-height: 44px;
    text-transform: uppercase;
`

const AddTargetItemRole = styled.div`
    border-radius: var(--rounded-sm);
    padding: 12px;
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: var(--font-weight-semibold);
    transition: all 100ms linear;
    gap: 8px;

    &:hover {
        background-color: var(--background-modifier-hover);
    }

    &.active {
        background-color: var(--background-modifier-selected);
    }
`

const AddTargetListContainer = styled.div`
    max-height: 280px;
    padding: 0px 8px;
    padding-bottom: 4px;
    background-color: var(--background-surface-higher);
    overflow-y: scroll;

    &::-webkit-scrollbar {
        width: 12px;
    }

    &::-webkit-scrollbar-thumb {
        border: 4px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 10px;
        background-color: #888;
    }
`

const AddTargetMenuOverlay = styled.div`
    position: fixed;
    inset: 0; 
    width: 100%;
    height: 100%;
    background-color: transparent;
    pointer-events: auto; 
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
`

function AddTargetMenu({ channelId, guildId, onClose, onAddTarget }: { channelId: string, guildId: string, onClose: () => void, onAddTarget: (target: Role | GuildMember, targetType: PermissionOverwriteTargetType) => void }) {
    const { getGuild } = useGuildsStore();
    const { getUserProfile } = useUserProfileStore();
    const guild = getGuild(guildId);
    const channel = guild?.channels.find(channel => channel.id === channelId);
    const [searchText, setSearchText] = useState('');
    const filteredRoles = guild?.roles.filter(role => !channel?.permissionOverwrites.find(ow => ow.targetId === role.id) && role.name.toLowerCase().includes(searchText.toLowerCase())) ?? [];
    const filteredMembers = guild?.members.filter(member => {
        const profile = getUserProfile(member.userId);
        return (!channel?.permissionOverwrites.find(ow => ow.targetId === member.userId) && profile?.username.toLowerCase().includes(searchText.toLowerCase()));
    }) ?? [];
    const menuRef = useRef<HTMLDivElement>(null!);

    function handleOutsideClick(e: MouseEvent) {
        if (!menuRef.current.contains(e.target as Node)) {
            onClose();
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        }
    }, []);

    return (
        <>
            <AddTargetMenuOverlay>
            </AddTargetMenuOverlay>
            <AddTargetMenuContainer ref={menuRef}>
                <AddTargetMenuHeader>
                    <h3>Add:</h3>
                    <SearchTargetInput
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Role/Member"
                    />
                </AddTargetMenuHeader>
                <AddTargetListContainer>
                    {filteredRoles.length > 0 &&
                        <div>
                            <TargetTypeHeader>Roles</TargetTypeHeader>
                            {filteredRoles.map(role => {
                                console.log('role', role);
                                const color = getRoleColor(role.color);
                                return (
                                    <AddTargetItemRole
                                        key={role.id}
                                        onClick={() => {
                                            onAddTarget(role, PermissionOverwriteTargetType.ROLE);
                                            onClose();
                                        }}>
                                        <Fragment>
                                            <p style={{ color }}>{role.name}</p>
                                        </Fragment>
                                    </AddTargetItemRole>

                                );
                            })}
                        </div>
                    }
                    {filteredMembers.length > 0 &&
                        <div>
                            <TargetTypeHeader>Members</TargetTypeHeader>
                            {filteredMembers.map(member => {
                                const profile = getUserProfile(member.userId);
                                return (
                                    <AddTargetItemRole
                                        key={member.userId}
                                        onClick={() => {
                                            onAddTarget(member, PermissionOverwriteTargetType.MEMBER);
                                            onClose();
                                        }}>
                                        {profile && <UserAvatar user={profile} showStatus={false} size="20" />}
                                        <p>{profile?.username}</p>
                                    </AddTargetItemRole>

                                );
                            })}
                        </div>
                    }
                </AddTargetListContainer>
            </AddTargetMenuContainer >
        </>
    );
}


interface PermissionSection {
    permission: bigint;
    header: string;
    description: string;
}

export function ChannelPermissionsSection({ channelId, guildId }: ChannelPermissionsSectionProps) {
    const { getGuild } = useGuildsStore();
    const { getUserProfile } = useUserProfileStore();
    const { showMenu } = useContextMenu();
    const guild = getGuild(guildId);
    const channel = guild?.channels.find(channel => channel.id === channelId);
    const permissionOverwrites = (channel?.isSynced ? guild?.channels.find(ch => ch.id === channel.parent?.id)?.permissionOverwrites : channel?.permissionOverwrites) ?? [];
    const everyoneOW: PermissionOverwrite | undefined = permissionOverwrites.find(ow => ow.targetId === guild?.id);
    const isPrivate = checkPermission(BigInt(everyoneOW?.deny ?? 0n), Permissions.VIEW_CHANNELS)
    const { mutateAsync: updatePermissionOverwrite, isPending } = useUpdatePermissionOverwrite(channel?.parent?.id);
    const { mutateAsync: syncChannel } = useSyncChannel();
    const [selectedTarget, setSelectedTarget] = useState<PermissionOverwrite | undefined>(everyoneOW);
    const [updatedTarget, setUpdatedTarget] = useState<PermissionOverwrite | undefined>(selectedTarget);
    const [showAddTarget, setShowAddTarget] = useState(false);
    const haveChanges = useMemo(() => {
        if (!updatedTarget) return false;

        if (updatedTarget.allow !== selectedTarget?.allow || updatedTarget.deny !== selectedTarget?.deny) {
            return true;
        }

        return false;
    }, [channel, selectedTarget, updatedTarget]);
    const permissions: Record<string, PermissionSection[]> = {
        "General Channel Permissions": [
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
                header: 'Manage Permissions',
                description: 'Allows members to change this channel&#39;s Permissions.'
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
    };

    useEffect(() => {
        const latest = permissionOverwrites.find(ow => ow.targetId === selectedTarget?.targetId);

        if (latest) {
            setSelectedTarget(latest);
            setUpdatedTarget(latest);
        }
    }, [permissionOverwrites]);

    if (!channel || !updatedTarget) {
        return <div></div>;
    }

    function setChannelPrivate() {
        if (!channel) return;

        const everyoneOW = channel?.permissionOverwrites.find(ow => ow.targetId === guild!.id);
        if (!everyoneOW) return;
        everyoneOW.deny = denyPermission(BigInt(everyoneOW.deny), Permissions.VIEW_CHANNELS).toString();
    }

    function resetChanges() {
        setUpdatedTarget(selectedTarget);
    }

    function setAllowPermission(permission: bigint) {
        if (!updatedTarget) return;
        setUpdatedTarget({
            ...updatedTarget,
            allow: (BigInt(updatedTarget.allow) | permission).toString(),
            deny: (BigInt(updatedTarget.deny) & ~permission).toString(),
        });
    }

    function setDenyPermission(permission: bigint) {
        if (!updatedTarget) return;

        setUpdatedTarget({
            ...updatedTarget,
            allow: (BigInt(updatedTarget.allow) & ~permission).toString(),
            deny: (BigInt(updatedTarget.deny) | permission).toString(),
        });
    }

    function resetPermission(permission: bigint) {
        if (!updatedTarget) return;

        setUpdatedTarget({
            ...updatedTarget,
            allow: (BigInt(updatedTarget.allow) & ~permission).toString(),
            deny: (BigInt(updatedTarget.deny) & ~permission).toString(),
        });
    }

    async function handleUpdatePermissions(ow: PermissionOverwrite) {
        await updatePermissionOverwrite({
            channelId,
            allow: ow.allow,
            deny: ow.deny,
            targetId: ow.targetId,
            targetType: ow.targetType
        });
    }

    async function handleCreatePermission(target: Role | GuildMember, targetType: PermissionOverwriteTargetType) {
        await updatePermissionOverwrite({
            channelId,
            allow: "0",
            deny: "0",
            targetId: targetType === PermissionOverwriteTargetType.ROLE ? (target as Role).id : (target as GuildMember).userId,
            targetType
        });
    }


    return (
        <div className="flex flex-col gap-[16px] w-full relative ">
            <div className="flex flex-col">
                <Header>Channel Permissions</Header>
                <DescriptionText>Use permissions to customize who can do what in this channel.</DescriptionText>
            </div>
            {channel.parent && <SyncPermissionsCard>
                <div className="flex-grow">
                    <SyncPermissionsDescription>
                        {`Permissions ${channel.isSynced ? 'synced' : 'not synced'} with category: `}
                        <b>{channel.parent.name}</b>
                    </SyncPermissionsDescription>
                </div>
                {!channel.isSynced && <ButtonSecondary onClick={() => syncChannel(channelId)}>Sync now</ButtonSecondary>}
            </SyncPermissionsCard>}
            <PrivateChannelCard>
                <div className="flex">
                    <div className="flex-grow">
                        <h2><FaLock />Private Channel</h2>
                        <p>By making a channel private, only select members and roles will be able to view this channel.</p>
                    </div>
                    <Checkbox value={isPrivate} onChange={setChannelPrivate} />
                </div>
            </PrivateChannelCard>
            <Divider />
            <div>
                <Header>Advanced Permissions</Header>
                <div className="flex">
                    <PermissionTargetContainer>
                        <div className="relative">
                            <AddTargetButton onClick={() => setShowAddTarget(true)}>
                                Roles/members <FaCirclePlus />
                            </AddTargetButton>
                            {showAddTarget && <AddTargetMenu channelId={channelId} guildId={guildId} onClose={() => setShowAddTarget(false)} onAddTarget={handleCreatePermission} />}
                        </div>
                        <TargetListContainer>
                            {permissionOverwrites.map(ow => {
                                const target =
                                    ow.targetType === PermissionOverwriteTargetType.ROLE
                                        ? guild?.roles.find(role => role.id === ow.targetId)
                                        : guild?.members.find(m => m.userId === ow.targetId);
                                const profile = ow.targetType === PermissionOverwriteTargetType.MEMBER ? getUserProfile(ow.targetId) : undefined;
                                const color = ow.targetType === PermissionOverwriteTargetType.ROLE && target ? getRoleColor((target as Role).color) : "";
                                return (
                                    <TargetListItem
                                        key={ow.targetId}
                                        className={`${selectedTarget?.targetId === ow.targetId ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedTarget(ow);
                                            setUpdatedTarget(ow);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (ow.targetId === channel.guildId || !target) return;
                                            showMenu(e, ContextMenuType.REMOVE_PERMISSION_OVERWRITE, { channel, target, targetType: ow.targetType })
                                        }}
                                    >
                                        {ow.targetType === PermissionOverwriteTargetType.ROLE && target &&
                                            <Fragment>
                                                <RoleColorIndicator style={{ backgroundColor: color }} />
                                                <p>{(target as Role).name}</p>
                                            </Fragment>
                                        }
                                        {ow.targetType === PermissionOverwriteTargetType.MEMBER && target &&
                                            <Fragment>
                                                {profile && <UserAvatar user={profile} size="22" showStatus={false} />}
                                                <p>{profile?.username}</p>
                                            </Fragment>
                                        }
                                    </TargetListItem>
                                );
                            })}
                        </TargetListContainer>
                    </PermissionTargetContainer>
                    <PermissionsContainer>

                        {updatedTarget && Object.keys(permissions).map(sectionHeader => {
                            return (
                                <div key={sectionHeader}>
                                    <SectionHeader>{sectionHeader}</SectionHeader>
                                    {permissions[sectionHeader].map(perm => {
                                        const status = updatedTarget ? getPermissionStatus(updatedTarget, perm.permission) : 0;
                                        return (
                                            <Section key={perm.permission}>
                                                <CheckableItem className="flex gap-[24px]">
                                                    <div className="flex-1">
                                                        <Label>{perm.header}</Label>
                                                        <SectionDescription>{perm.description}</SectionDescription>
                                                    </div>
                                                    <PermissionCheckContainer>
                                                        <PermissionCheckItem className={`denied ${status === -1 ? 'active' : ''}`} onClick={() => setDenyPermission(perm.permission)}><MdClose /></PermissionCheckItem>
                                                        <PermissionCheckItem className={`${status === 0 ? 'active' : ''}`} onClick={() => resetPermission(perm.permission)}><HiSlash strokeWidth={2} /></PermissionCheckItem>
                                                        <PermissionCheckItem className={`allowed ${status === 1 ? 'active' : ''}`} onClick={() => setAllowPermission(perm.permission)}><FaCheck /></PermissionCheckItem>
                                                    </PermissionCheckContainer>
                                                </CheckableItem>
                                            </Section>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </PermissionsContainer>
                </div>
            </div>
            <SaveChangesOverlay className={haveChanges ? 'active' : ''}>
                <SaveChangesContainer>
                    <p>Careful — you have unsaved changes!</p>
                    <SaveChangesButtonLayout>
                        <ButtonTertiary size="sm" onClick={resetChanges} disabled={isPending}>Reset</ButtonTertiary>
                        <ButtonSuccess size="sm" isLoading={isPending} onClick={() => handleUpdatePermissions(updatedTarget)}>Save Changes</ButtonSuccess>
                    </SaveChangesButtonLayout>
                </SaveChangesContainer>
            </SaveChangesOverlay>
        </div>

    );
}