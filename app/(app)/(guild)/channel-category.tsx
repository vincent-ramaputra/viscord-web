import Tooltip from "@/components/tooltip/tooltip";
import { Channel } from "@/interfaces/channel";
import { ReactNode, useState } from "react";
import { FaAngleDown, FaPlus } from "react-icons/fa6";
import styled from "styled-components";
import ChannelButton from "./channel-button";
import { usePathname } from "next/navigation";
import { useModal } from "@/contexts/modal.context";
import { ModalType } from "@/enums/modal-type.enum";
import { useContextMenu } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { checkPermission, getEffectivePermission } from "@/helpers/permissions.helper";
import { useGetGuild } from "@/app/stores/guilds-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { Permissions } from "@/enums/permissions.enum";


const Container = styled.div`
`

const CategoryToggleContainer = styled.div`
    display: flex;
    align-items: center;
    font-size: 14px;
    line-height: 18px;
    font-weight: 500;
    gap: 4px;
    flex-grow: 1;
    height: 24px;
    padding: 0 8px;

`

const CategoryContainer = styled.div`
    display: flex;
    color: var(--channels-default);
    cursor: pointer;
    margin: 0 8px;
    margin-top: 16px;
    &:hover ${CategoryToggleContainer}{
        color: var(--interactive-hover);
    }
`

const ToggleIcon = styled.span`
    &.item-collapse {
        transform: rotate(-90deg);
    }

`

const CreateChannelButton = styled.button`
    &:hover {
        color: var(--interactive-hover);
    }
`

const ChildrenContainer = styled.div`
    display: flex;
    flex-direction: column;
`

export function ChannelCategory({ channel, children }: { channel: Channel, children: Channel[] }) {
    const { openModal } = useModal();
    const [collapse, setCollapse] = useState(false);
    const [hoverAddChannel, setHoverAddChannel] = useState(false);
    const pathname = usePathname();
    const { showMenu } = useContextMenu();
    const guild = useGetGuild(channel.guildId)!;
    const { user } = useCurrentUserStore();
    const effectivePermission = getEffectivePermission(guild.members.find(m => m.userId === user!.id)!, guild, channel);

    return (
        <Container >
            <CategoryContainer>
                <CategoryToggleContainer
                    onClick={() => setCollapse(!collapse)}
                    onContextMenu={(e) => {
                        e.stopPropagation();
                        showMenu(e, ContextMenuType.CHANNEL_CATEGORY, { categoryId: channel.id, guildId: channel.guildId })
                    }}>
                    <p>{channel.name}</p>
                    <ToggleIcon className={`${collapse ? 'item-collapse' : ''}`}><FaAngleDown size={10} /></ToggleIcon>
                </CategoryToggleContainer>
                {checkPermission(effectivePermission, Permissions.MANAGE_CHANNELS) && <div className="relative">
                    <CreateChannelButton
                        onClick={() => openModal(ModalType.CREATE_CHANNEL, { category: channel, guildId: channel.guildId })}
                        onMouseEnter={() => setHoverAddChannel(true)}
                        onMouseLeave={() => setHoverAddChannel(false)}>
                        <FaPlus size={13} />
                    </CreateChannelButton>
                    <Tooltip
                        position="top"
                        show={hoverAddChannel}
                        text="Create Channel"
                        fontSize="14px"
                    />
                </div>}
            </CategoryContainer>
            <ChildrenContainer>
                {children.map(ch => {
                    return (
                        <ChannelButton collapse={collapse && !pathname.includes(ch.id)} key={ch.id} channel={ch} />
                    )
                })}
            </ChildrenContainer>
        </Container>
    );
}