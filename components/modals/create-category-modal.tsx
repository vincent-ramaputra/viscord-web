import { ChannelType } from "@/enums/channel-type.enum";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { useState } from "react";
import Modal from "./modal";
import styled from "styled-components";
import TextInputSecondary from "../text-input/text-input-secondary";
import { MdClose } from "react-icons/md";
import { FaLock } from "react-icons/fa6";
import Checkbox from "../checkbox/checkbox";
import ButtonSecondary from "../buttons/button-secondary";
import ButtonPrimary from "../buttons/button-primary";
import { useCreateGuildChannelMutation } from "@/hooks/mutations";

const ContentContainer = styled.div`
    background: var(--modal-background);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-faint);
    width: 496px;
`

const ContentHeader = styled.div`
    padding: 16px 24px 0;
    display: flex;
    justify-content: space-between;

    h1 {
        color: var(--header-primary);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-regular);
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

    p {
        font-size: var(--text-sm);
    }
`

const ContentFooter = styled.div`
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`

const InputContainer = styled.div`
    // min-height: 44px;
    height: 44px;
`


export function CreateCategoryModal({ guildId, onClose }: { guildId: string, onClose: () => void }) {
    const [category, setCategory] = useState<CreateChannelDTO>({ type: ChannelType.Category, guildId, isPrivate: false, name: '' });
    const { mutateAsync: createCategory, error, isPending } = useCreateGuildChannelMutation();


    async function handleCreateChannel() {
        const response = await createCategory(category);
        if (!response.success) return;

        onClose();
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Create Category</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <h2>Category Name</h2>
                        <InputContainer>
                            <TextInputSecondary
                                value={category.name}
                                onChange={(val) => setCategory({ ...category, name: val })}
                                placeholder="New Category">
                            </TextInputSecondary>
                        </InputContainer>
                        {error && <p>{error.message}</p>}
                    </ContentSection>
                    <ContentSection>
                        <div className="flex justify-between">
                            <div className="flex items-center gap-1">
                                <FaLock size={14} fill="var(--header-primary)" />
                                <h1>Private Category</h1>
                            </div>
                            <Checkbox value={category.isPrivate} onChange={(val) => setCategory({ ...category, isPrivate: val })}></Checkbox>
                        </div>
                        <p className="mt-[8px] leading-[20px]">By making a category private, only select members and roles will be able to view this category. Linked channels in this category will automatically match to this setting.</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonPrimary onClick={handleCreateChannel} disabled={category.name.length === 0 || isPending} size="lg">Create Category</ButtonPrimary>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}