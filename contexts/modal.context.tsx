import { AddRoleMembersModal } from "@/components/modals/add-role-members-modal";
import { CreateCategoryModal } from "@/components/modals/create-category-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { CreateGuildModal } from "@/components/modals/create-guild-modal";
import { CreateInviteModal } from "@/components/modals/create-invite-modal";
import { DeleteChannelModal } from "@/components/modals/delete-channel-modal";
import { DeleteRoleModal } from "@/components/modals/delete-role-modal";
import { LeaveGuildModal } from "@/components/modals/leave-guild-modal";
import { RemovePermissionOverwriteModal } from "@/components/modals/remove-permission-overwrite.modal";
import { ModalType } from "@/enums/modal-type.enum";
import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { Channel } from "@/interfaces/channel";
import { GuildMember } from "@/interfaces/guild-member";
import { Role } from "@/interfaces/role";
import { createContext, ReactNode, useContext, useState } from "react";

export interface ModalDataMap {
    [ModalType.CREATE_GUILD]: never;
    [ModalType.CREATE_INVITE]: { channelId: string, guildId: string };
    [ModalType.CREATE_CHANNEL]: { category?: Channel, guildId: string };
    [ModalType.LEAVE_GUILD]: { guildId: string };
    [ModalType.DELETE_CHANNEL]: { channel: Channel };
    [ModalType.REMOVE_PERMISSION_OVERWRITE]: { channel: Channel, target: GuildMember | Role, targetType: PermissionOverwriteTargetType };
    [ModalType.ADD_ROLE_MEMBERS]: { guildId: string, roleId: string };
    [ModalType.CREATE_CATEGORY]: { guildId: string };
    [ModalType.DELETE_ROLE]: { role: Role };
};

type ModalMetadata = {
    [K in ModalType]: {
        type: K;
        data: ModalDataMap[K];
    }
}[ModalType];

interface ModalContextType {
    openModal: <T extends ModalType>(type: T, data?: ModalDataMap[T]) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>(null!);

export function useModal() {
    return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalMetadata | null>(null);

    function openModal<T extends ModalType>(type: ModalType, data?: ModalDataMap[T]) {
        setModal({ type, data } as ModalMetadata);
    }

    function closeModal() {
        setModal(null);
    }

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modal?.type === ModalType.CREATE_CHANNEL && <CreateChannelModal guildId={modal.data.guildId} category={modal.data.category} onClose={closeModal} />}
            {modal?.type === ModalType.CREATE_GUILD && <CreateGuildModal onClose={closeModal} />}
            {modal?.type === ModalType.CREATE_CATEGORY && <CreateCategoryModal guildId={modal.data.guildId} onClose={closeModal} />}
            {modal?.type === ModalType.DELETE_CHANNEL && <DeleteChannelModal channel={modal.data.channel} onClose={closeModal} />}
            {modal?.type === ModalType.LEAVE_GUILD && <LeaveGuildModal guildId={modal.data.guildId} onClose={closeModal} />}
            {modal?.type === ModalType.CREATE_INVITE && <CreateInviteModal guildId={modal.data.guildId} channelId={modal.data.channelId} onClose={closeModal} />}
            {modal?.type === ModalType.ADD_ROLE_MEMBERS && <AddRoleMembersModal guildId={modal.data.guildId} roleId={modal.data.roleId} onClose={closeModal} />}
            {modal?.type === ModalType.REMOVE_PERMISSION_OVERWRITE && <RemovePermissionOverwriteModal target={modal.data.target} channel={modal.data.channel} targetType={modal.data.targetType} onClose={closeModal} />}
            {modal?.type === ModalType.DELETE_ROLE && <DeleteRoleModal role={modal.data.role} onClose={closeModal} />}
        </ModalContext.Provider>
    );
}