import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";
import { useContextMenu } from "@/contexts/context-menu.context";
import { useModal } from "@/contexts/modal.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { ModalType } from "@/enums/modal-type.enum";
import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { Permissions } from "@/enums/permissions.enum";
import { RelationshipType } from "@/enums/relationship-type.enum";
import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { checkPermission, getEffectivePermission } from "@/helpers/permissions.helper";
import { useDeleteRelationshipMutation } from "@/hooks/mutations";
import { useDMChannelsQuery } from "@/hooks/queries";
import { Channel } from "@/interfaces/channel";
import { Guild } from "@/interfaces/guild";
import { GuildMember } from "@/interfaces/guild-member";
import Relationship from "@/interfaces/relationship";
import { Role } from "@/interfaces/role";
import { createDMChannel } from "@/services/channels/channels.service";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getChannelURL } from "@/utils/url.utils";
import { FaAngleRight, FaTrash } from "react-icons/fa6";
import styled from "styled-components";


const ContextMenuContainer = styled.div`
    position: absolute;
    background-color: var(--background-surface-higher);
    padding: 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    box-shadow: var(--shadow-high);
    min-width: 188px;
    user-select: none;
`

const ListItem = styled.div`
    padding: 8px;
    border-radius: 2px;
    cursor: pointer;
    font-size: 14px;
    line-height: 18px;

    &:hover {
        background-color: var(--background-mod-subtle);
        
        svg {
            color: white;
        }
    }
    svg {
        color: var(--text-muted);
        
    }
`

const Separator = styled.div`
    border-bottom: 1px solid var(--border-subtle);
    margin: 8px;
`

function UserContextMenu({ relationship }: { relationship: Relationship }) {
    const guilds = useGuildsStore(s => s.guilds);
    const [showGuilds, setShowGuilds] = useState(false);
    const { mutate: removeFriend } = useDeleteRelationshipMutation();
    const { data: channels } = useDMChannelsQuery();
    const { hideMenu } = useContextMenu();
    const router = useRouter();

    return (
        <Fragment>
            <div className="">
                <ListItem>Profile</ListItem>
                <ListItem onClick={async () => {
                    const channel = channels?.find(ch => ch.recipients![0].id === relationship.user.id);
                    if (!channel) {
                        await createDMChannel(relationship.user.id);
                    }
                    router.push(`/channels/me/${channel!.id}`);
                }}>Message</ListItem>
                <ListItem>Call</ListItem>
            </div>
            <Separator />
            <div className="">
                <div className="" onMouseEnter={() => setShowGuilds(true)} onMouseLeave={() => setShowGuilds(false)}>
                    <ListItem className="flex items-center justify-between relative">
                        <p>Invite to Server</p>
                        <FaAngleRight className="" size={14} />
                        {showGuilds && guilds && (
                            <ContextMenuContainer className="absolute left-full">
                                {Array.from(guilds.values()).map(guild => {
                                    return <ListItem key={guild.id}>{guild.name}</ListItem>
                                })}
                            </ContextMenuContainer>
                        )}
                    </ListItem>
                </div>
                {relationship.type === RelationshipType.Friends && <ListItem onClick={() => { removeFriend(relationship); hideMenu(); }}>Remove Friend</ListItem>}
                {relationship.type === RelationshipType.PendingReceived && <ListItem onClick={() => { removeFriend(relationship); hideMenu(); }}>Accept Friend</ListItem>}
                {relationship.type !== RelationshipType.Blocked && <ListItem onClick={() => { removeFriend(relationship); hideMenu(); }}>Add Friend</ListItem>}
                <ListItem>Ignore</ListItem>
                <ListItem className="text-[var(--text-danger)] hover:bg-[var(--">Block</ListItem>
            </div>
        </Fragment>
    )
}

function RemovePermissionOverwriteContextMenu({ channel, target, targetType }: { channel: Channel, target: Role | GuildMember, targetType: PermissionOverwriteTargetType }) {
    const { openModal } = useModal();
    return (
        <Fragment>
            <div className="">
                <ListItem
                    className="flex items-center justify-between text-[var(--text-danger)]"
                    onClick={() => openModal(ModalType.REMOVE_PERMISSION_OVERWRITE, { channel, target, targetType })}
                >
                    <p>{targetType === PermissionOverwriteTargetType.ROLE ? "Remove Role" : "Remove User"}</p>
                    <FaTrash color="var(--text-danger)" />
                </ListItem>
            </div>
        </Fragment>
    );
}

function GuildSidebarContextMenu({ guild }: { guild: Guild }) {
    const { openModal } = useModal();
    const { hideMenu } = useContextMenu();


    return (
        <Fragment>
            <ListItem
                onClick={() => {
                    openModal(ModalType.CREATE_CHANNEL, { guildId: guild.id });
                    hideMenu();
                }}>Create Channel</ListItem>
            <ListItem
                onClick={() => {
                    openModal(ModalType.CREATE_CATEGORY, { guildId: guild.id });
                    hideMenu();
                }}>Create Category</ListItem>
            <ListItem>Invite People</ListItem>
        </Fragment>
    )
}

function ChannelCategoryContextMenu({ categoryId, guildId }: { categoryId: string, guildId: string }) {
    const openSettings = useSettingsOverlay(s => s.openSettings);
    const { openModal } = useModal();
    const { hideMenu } = useContextMenu();
    const guild = useGuildsStore(s => s.getGuild(guildId))!;
    const category = guild.channels.find(ch => ch.id === categoryId)!;
    const user = useCurrentUserStore(s => s.user);
    const effectivePermission = getEffectivePermission(guild.members.find(m => m.userId === user!.id)!, guild, category);

    return (
        <Fragment>
            {checkPermission(effectivePermission, Permissions.MANAGE_CHANNELS) &&
                <div className="">
                    <ListItem
                        onClick={() => {
                            openSettings(SettingsOverlayType.CHANNEL_SETTINGS, { channelId: category.id, guildId: category.guildId });
                            hideMenu();
                        }}>
                        <p>Edit Category</p>
                    </ListItem>
                    <ListItem
                        className="flex items-center justify-between text-[var(--text-danger)]"
                        onClick={() => {
                            openModal(ModalType.DELETE_CHANNEL, { channel: category });
                            hideMenu();
                        }}>
                        <p>Delete Category</p>
                        <FaTrash color="var(--text-danger)" />
                    </ListItem>
                </div>}
        </Fragment>
    );
}


function ChannelButtonContextMenu({ channelId, guildId }: { channelId: string, guildId: string }) {
    const openSettings = useSettingsOverlay(s => s.openSettings);
    const { openModal } = useModal();
    const { hideMenu } = useContextMenu();
    const guild = useGuildsStore(s => s.getGuild(guildId))!;
    const channel = guild.channels.find(ch => ch.id === channelId)!;
    const parent = guild.channels.find(ch => ch.id === channel.parent?.id);
    const user = useCurrentUserStore(s => s.user);
    const effectivePermission = getEffectivePermission(guild.members.find(m => m.userId === user!.id)!, guild, channel, parent);

    return (
        <Fragment>
            <div className="">
                {checkPermission(effectivePermission, Permissions.CREATE_INVITES) &&
                    <ListItem
                        onClick={() => {
                            openModal(ModalType.CREATE_INVITE, { channelId, guildId });
                            hideMenu();
                        }}>
                        <p>Invite People</p>
                    </ListItem>}
                <ListItem
                    className="flex items-center justify-between"
                    onClick={() => {
                        navigator.clipboard.writeText(getChannelURL(channel.guildId, channel.id))
                        hideMenu();
                    }}>
                    <p>Copy Link</p>
                </ListItem>
            </div>
            {checkPermission(effectivePermission, Permissions.MANAGE_CHANNELS) && (
                <Fragment>
                    <Separator />
                    <div className="">
                        <ListItem
                            onClick={() => {
                                openSettings(SettingsOverlayType.CHANNEL_SETTINGS, { channelId: channel.id, guildId: channel.guildId });
                                hideMenu();
                            }}>
                            <p>Edit Channel</p>
                        </ListItem>
                        <ListItem
                            className="flex items-center justify-between text-[var(--text-danger)]"
                            onClick={() => {
                                openModal(ModalType.DELETE_CHANNEL, { channel: channel });
                                hideMenu();
                            }}>
                            <p>Delete Channel</p>
                            <FaTrash color="var(--text-danger)" />
                        </ListItem>
                    </div>
                </Fragment>)}
        </Fragment>
    );
}
export default function ContextMenu() {
    const { menuState, hideMenu } = useContextMenu();
    const menuRef = useRef<HTMLDivElement>(null!);
    const [position, setPosition] = useState({ x: menuState?.x, y: menuState?.y });

    useLayoutEffect(() => {
        if (!menuRef.current || !menuState?.visible) return;

        const menu = menuRef.current;
        const { innerWidth, innerHeight } = window;
        const rect = menu.getBoundingClientRect();

        let newX = menuState.x;
        let newY = menuState.y;

        if (newX + rect.width > innerWidth) {
            newX = innerWidth - rect.width - 20;
        }

        if (newY + rect.height > innerHeight) {
            newY = innerHeight - rect.height - 20;
        }

        setPosition({ x: newX, y: newY });
    }, [menuState]);

    useEffect(() => {
        const handleClickOutside = (evt: MouseEvent) => {
            if (menuState?.visible && menuRef.current && !menuRef.current.contains(evt.target as Node)) {
                hideMenu();
            }
        };

        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [menuState]);

    if (!menuState?.visible) {
        return null;
    }

    return (
        <ContextMenuContainer className="absolute" style={{ top: position.y, left: position.x }} ref={menuRef}>
            {menuState.type === ContextMenuType.USER && <UserContextMenu relationship={menuState.data} />}
            {menuState.type === ContextMenuType.GUILD_SIDEBAR && <GuildSidebarContextMenu guild={menuState.data} />}
            {menuState.type === ContextMenuType.REMOVE_PERMISSION_OVERWRITE && <RemovePermissionOverwriteContextMenu channel={menuState.data.channel} target={menuState.data.target} targetType={menuState.data.targetType} />}
            {menuState.type === ContextMenuType.CHANNEL_CATEGORY && <ChannelCategoryContextMenu categoryId={menuState.data.categoryId} guildId={menuState.data.guildId} />}
            {menuState.type === ContextMenuType.CHANNEL_BUTTON && <ChannelButtonContextMenu channelId={menuState.data.channelId} guildId={menuState.data.guildId} />}
        </ContextMenuContainer>
    );
}