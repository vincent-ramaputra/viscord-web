import ContextMenu from "@/components/context-menu/context-menu";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { Channel } from "@/interfaces/channel";
import ContextMenuState from "@/interfaces/context-menu-state";
import { Guild } from "@/interfaces/guild";
import { GuildMember } from "@/interfaces/guild-member";
import Relationship from "@/interfaces/relationship";
import { Role } from "@/interfaces/role";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";

export interface ContextMenuDataMap {
    [ContextMenuType.USER]: Relationship;
    [ContextMenuType.CHANNEL_CATEGORY]: { categoryId: string, guildId: string };
    [ContextMenuType.CHANNEL_BUTTON]: { channelId: string, guildId: string };
    [ContextMenuType.GUILD_SIDEBAR]: Guild;
    [ContextMenuType.REMOVE_PERMISSION_OVERWRITE]: { channel: Channel, target: Role | GuildMember, targetType: PermissionOverwriteTargetType };
    [ContextMenuType.USER_CONTACT]: never;
    [ContextMenuType.USER_VC]: never;
};

interface ContextMenuContextType {
    menuState: ContextMenuState | undefined;
    showMenu: <T extends ContextMenuType>(evt: React.MouseEvent, type: T, data: ContextMenuDataMap[T]) => void;
    hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>(null!);

export function useContextMenu() {
    return useContext(ContextMenuContext);
}

const ClickTrapOverlay = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    inset: 0;
`

export function ContextMenuProvider({ children }: { children: ReactNode }) {
    const [menuState, setMenuState] = useState<ContextMenuState | undefined>();
    const menuRef = useRef<HTMLDivElement>(null!);
    function showMenu<T extends ContextMenuType>(evt: React.MouseEvent, type: T, data: ContextMenuDataMap[T]) {
        evt.preventDefault();
        setMenuState({
            x: evt.clientX,
            y: evt.clientY,
            visible: true,
            type: type,
            data: data
        } as ContextMenuState);
    };

    function hideMenu() {
        setMenuState(undefined);
    }

    function handleOutsideClick(e: MouseEvent) {
        if (!menuRef.current.contains(e.target as Node)) {
            hideMenu();
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        }
    }, []);

    return (
        <ContextMenuContext.Provider value={{ menuState, showMenu, hideMenu }}>
            {children}
            {menuState && <ClickTrapOverlay />}
            <div ref={menuRef}>
                <ContextMenu />
            </div>
        </ContextMenuContext.Provider>
    );
}