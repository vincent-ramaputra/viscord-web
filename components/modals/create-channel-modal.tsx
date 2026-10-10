import Checkbox from "@/components/checkbox/checkbox";
import Modal from "@/components/modals/modal";
import ButtonPrimary from "@/components/buttons/button-primary";
import TextInputSecondary from "@/components/text-input/text-input-secondary";
import { Channel } from "@/interfaces/channel";
import { ReactNode, useState } from "react";
import { FaLock } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import { PiHash } from "react-icons/pi";
import styled from "styled-components";
import ButtonSecondary from "@/components/buttons/button-secondary";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { ChannelType } from "@/enums/channel-type.enum";
import { useRouter } from "next/navigation";
import { useCreateGuildChannelMutation } from "@/hooks/mutations";
import { getErrorMessage } from "@/utils/error.utils";

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

const ChannelCategoryText = styled.p`
    font-size: var(--text-xs);
    color: var(--header-secondary);
    line-height: var(--line-height-tight);
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

const RadioButtonContainer = styled.div`
    padding: 12px 16px;
    display: flex;
    cursor: pointer;
    gap: 8px;
    align-items: center;
    border-radius: var(--rounded-lg);

    &:hover, &.selected {
        background: var(--background-mod-subtle);
    }

    margin-bottom: 4px;
`

const RadioInput = styled.div`
    height: 24px;
    width: 24px;
    border-radius: calc(infinity * 1px);
`

const RadioButtonLabelContainer = styled.div`
    display: flex;
    align-items: center;
    color: var(--interactive-normal);
`

const RadioButtonLabelTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: 12px;

    h1 {
        font-weight: var(--font-weight-medium);
        font-size: var(--text-base);
        color: var(--text-default);
    }

    p {
        font-size: var(--text-sm);
        color: var(--header-secondary);
        margin-top: 4px;
    }
`

const ContentSection = styled.div`
    margin-bottom: 20px;

    p {
        font-size: var(--text-sm);
    }
`

const ChannelNameInputIcon = styled.span`
    width: 34px;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
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

function RadioButton({ children, isSelected, onClick }: { children: ReactNode, isSelected: boolean, onClick: () => void }) {
    return (
        <RadioButtonContainer onClick={onClick} className={`${isSelected ? 'selected' : ''}`}>
            <RadioInput>
                <svg viewBox="0 0 26 26">
                    {isSelected && <circle cx="13" cy="13" r="12" fill="var(--primary)"></circle>}
                    <circle cx="13" cy="13" r="12" strokeWidth="2" fill="none" stroke={isSelected ? 'var(--primary)' : 'var(--checkbox-border-default)'}></circle>
                    {isSelected && <circle cx="13" cy="13" r="5" fill="white"></circle>}
                </svg>
            </RadioInput>
            {children}
        </RadioButtonContainer>
    );
}

export function CreateChannelModal({ guildId, category, onClose }: { guildId: string, category?: Channel, onClose: () => void }) {
    const [channel, setChannel] = useState<CreateChannelDTO>({ type: ChannelType.Text, parentId: category?.id, guildId, isPrivate: false, name: '' });
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const router = useRouter();
    const {mutateAsync: createGuildChannel , isPending} = useCreateGuildChannelMutation();

    function setChannelType(type: ChannelType) {
        setChannel({ ...channel, type })
    }


    async function handleCreateChannel() {
        let created: Channel | null;
        try {
            created = await createGuildChannel(channel);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
            return;
        }
        if (created) router.push(`/channels/${guildId}/${created.id}`);
        onClose();
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Create Channel</h1>
                        {category && <ChannelCategoryText>in {category.name}</ChannelCategoryText>}
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <h2>Channel Type</h2>
                        <div className="">
                            <RadioButton onClick={() => setChannelType(ChannelType.Text)} isSelected={channel.type === ChannelType.Text}>
                                <RadioButtonLabelContainer>
                                    <PiHash size={24} strokeWidth={5} />
                                    <RadioButtonLabelTextContainer>
                                        <h1>Text</h1>
                                        <p>Send messages, images, GIFs, emoji, opinions, and puns</p>
                                    </RadioButtonLabelTextContainer>
                                </RadioButtonLabelContainer>
                            </RadioButton>
                            <RadioButton onClick={() => setChannelType(ChannelType.Voice)} isSelected={channel.type === ChannelType.Voice}>
                                <RadioButtonLabelContainer>
                                    <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                                    <RadioButtonLabelTextContainer>
                                        <h1>Voice</h1>
                                        <p>Hangout together with voice, video, and screen share</p>
                                    </RadioButtonLabelTextContainer>
                                </RadioButtonLabelContainer>
                            </RadioButton>
                        </div>
                    </ContentSection>
                    <ContentSection>
                        <h2>Channel Name</h2>
                        <InputContainer>
                            <TextInputSecondary
                                value={channel.name}
                                onChange={(val) => setChannel({ ...channel, name: val })}
                                placeholder="new-channel"
                                leftElement=
                                {<ChannelNameInputIcon>
                                    {channel.type === ChannelType.Text ?
                                        <PiHash size={16} strokeWidth={5} />
                                        :
                                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                                    }
                                </ChannelNameInputIcon>
                                }>
                            </TextInputSecondary>
                        </InputContainer>
                        {errorMessage && <p>{errorMessage}</p>}
                    </ContentSection>
                    <ContentSection>
                        <div className="flex justify-between">
                            <div className="flex items-center gap-1">
                                <FaLock size={14} fill="var(--header-primary)" />
                                <h1>Private Channel</h1>
                            </div>
                            <Checkbox value={channel.isPrivate} onChange={(val) => setChannel({ ...channel, isPrivate: val })}></Checkbox>
                        </div>
                        <p className="mt-[8px]">Only selected members and roles will be able to see view channel</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonPrimary onClick={handleCreateChannel} disabled={channel.name.length === 0 || isPending} size="lg">Create Channel</ButtonPrimary>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}