import ContextMenu from "@/components/context-menu/context-menu";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { Channel } from "@/interfaces/channel";
import ContextMenuState from "@/interfaces/context-menu-state";
import { Guild } from "@/interfaces/guild";
import { GuildMember } from "@/interfaces/guild-member";
import Relationship from "@/interfaces/relationship";
import { Role } from "@/interfaces/role";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

interface ContextMenuActions {
    showMenu: <T extends ContextMenuType>(evt: React.MouseEvent, type: T, data: ContextMenuDataMap[T]) => void;
    hideMenu: () => void;
}

// Split so components that only open menus don't re-render when a menu opens or closes:
// the actions never change, the state changes on every open/close.
const ContextMenuActionsContext = createContext<ContextMenuActions>(null!);
const ContextMenuStateContext = createContext<ContextMenuState | undefined>(undefined);

export function useContextMenuActions() {
    return useContext(ContextMenuActionsContext);
}

export function useContextMenu() {
    const actions = useContext(ContextMenuActionsContext);
    const menuState = useContext(ContextMenuStateContext);
    return { ...actions, menuState };
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
    const showMenu = useCallback(<T extends ContextMenuType>(evt: React.MouseEvent, type: T, data: ContextMenuDataMap[T]) => {
        evt.preventDefault();
        setMenuState({
            x: evt.clientX,
            y: evt.clientY,
            visible: true,
            type: type,
            data: data
        } as ContextMenuState);
    }, []);

    const hideMenu = useCallback(() => {
        setMenuState(undefined);
    }, []);

    const actions = useMemo(() => ({ showMenu, hideMenu }), [showMenu, hideMenu]);

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
        <ContextMenuActionsContext.Provider value={actions}>
            <ContextMenuStateContext.Provider value={menuState}>
                {children}
                {menuState && <ClickTrapOverlay />}
                <div ref={menuRef}>
                    <ContextMenu />
                </div>
            </ContextMenuStateContext.Provider>
        </ContextMenuActionsContext.Provider>
    );
}