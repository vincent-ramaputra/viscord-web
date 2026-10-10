import { ContextMenuDataMap } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";

type ContextMenuState = {
    [K in ContextMenuType]: {
        x: number;
        y: number;
        visible: boolean;
        type: K;
        data: ContextMenuDataMap[K];
    }
}[ContextMenuType];

export default ContextMenuState;
