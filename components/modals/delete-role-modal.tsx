
import Modal from "@/components/modals/modal";
import { MdClose } from "react-icons/md";
import styled from "styled-components";
import ButtonSecondary from "@/components/buttons/button-secondary";
import ButtonDanger from "../buttons/button-danger";
import { useDeleteRoleMutation } from "@/hooks/mutations";
import { Role } from "@/interfaces/role";
import { useState } from "react";
import { getErrorMessage } from "@/utils/error.utils";

const ContentContainer = styled.div`
    background: var(--modal-background);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-faint);
    width: 400px;
`

const ContentHeader = styled.div`
    padding: 16px 24px 0;
    display: flex;
    justify-content: space-between;

    h1 {
        color: var(--header-primary);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-tight);
    }

    button {
        color: var(--interactive-normal);
        cursor: pointer;

        :hover {
            color: var(--interactive-hover);
        }
    }
`


const ContentBody = styled.div`
    padding: 8px 16px 0 24px;

    h2 {
        font-size: var(--text-base);
        color: var(--text-default);
        line-height: var(--line-height-tight);
        font-weight: var(--font-weight-regular);
        margin-bottom: 8px;
    }

    h3 {
        font-size: var(--text-xs);
        color: var(--header-primary);
        line-height: var(--line-height-tight);
        font-weight: var(--font-weight-medium);
        margin-bottom: 8px;
    }
`

const ContentSection = styled.div`
    margin-bottom: 20px;
    line-height: 1.25;

    p {
        font-size: var(--text-base);
        color: var(--text-default);
        b {
        font-weight: var(--font-weight-semibold);
        }
    }
`

const ContentFooter = styled.div`
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`

export function DeleteRoleModal({ role, onClose }: { role: Role, onClose: () => void }) {
    const { mutateAsync: deleteRole, isPending } = useDeleteRoleMutation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleCreateChannel() {
        try {
            await deleteRole({ roleId: role.id, guildId: role.guildId });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
            return;
        }

        onClose();
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Delete Role</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <p>Are you sure you want to delete the <b>{role.name}</b> role? this cannot be undone.</p>
                    </ContentSection>
                    {errorMessage && <p>{errorMessage}</p>}
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonDanger disabled={isPending} onClick={handleCreateChannel} size="lg">Delete Channel</ButtonDanger>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}