import ContentHeader from "@/app/(app)/content-header";
import Tooltip from "@/components/tooltip/tooltip";
import { ChannelType } from "@/enums/channel-type.enum";
import { Channel } from "@/interfaces/channel";
import { ReactNode, useState } from "react";
import { BsPinAngleFill } from "react-icons/bs";
import { PiHash } from "react-icons/pi";
import styled from "styled-components";


const UserProfileHeader = styled.div`
    display: flex;
    align-items: center;
    max-height: auto;
    flex-grow: 1;
    color: var(--text-muted);
`

const UserProfileHeaderText = styled.p`
    line-height: 20px;
    font-weight: var(--font-weight-semibold);
    color: var(--text-default);
    position: relative;
`

const ChannelNameTextContainer = styled.div`
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 4px;
    margin-right: 8px;
`

const HeaderActionContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 32px;
    height: 32px;
    cursor: pointer;
    color: var(--interactive-normal);

    &:hover {
        color: var(--interactive-hover);
    }

    &.active {
        color: var(--icon-primary);
    }
`

function HeaderActionButton({ children, onClick, tooltipText, active }: { children: ReactNode, onClick?: () => void, tooltipText: string, active?: boolean }) {
    const [isHovering, setIsHovering] = useState(false);


    return (
        <HeaderActionContainer
            className={active ? 'active' : ''}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={onClick}>
            {children}
            <Tooltip position="bottom" show={isHovering} text={tooltipText} fontSize="14px" />
        </HeaderActionContainer>
    )
}

const SearchBarContainer = styled.div`
    display: flex;
    height: 100%;
    width: 244px;
`

function SearchBar({ }: { channel: Channel }) {
    return (
        <SearchBarContainer>
            {/* <TextInputSecondary

                placeholder="Search"
                
            >

            </TextInputSecondary> */}
        </SearchBarContainer>
    );
}

export function GuildChannelHeader({ channel, showMemberList, onToggleMemberList }: { channel: Channel, showMemberList: boolean, onToggleMemberList: () => void }) {
    const [, setIsHoveringName] = useState(false);

    return (
        <ContentHeader>
            <UserProfileHeader>
                <div className="ml-[4px] mr-[8px]">
                    {channel.type === ChannelType.Text ?
                        <PiHash size={20} strokeWidth={5} />
                        :
                        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a1 1 0 0 0-1-1h-.06a1 1 0 0 0-.74.32L5.92 7H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.92l4.28 4.68a1 1 0 0 0 .74.32H11a1 1 0 0 0 1-1V3ZM15.1 20.75c-.58.14-1.1-.33-1.1-.92v-.03c0-.5.37-.92.85-1.05a7 7 0 0 0 0-13.5A1.11 1.11 0 0 1 14 4.2v-.03c0-.6.52-1.06 1.1-.92a9 9 0 0 1 0 17.5Z"></path><path fill="currentColor" d="M15.16 16.51c-.57.28-1.16-.2-1.16-.83v-.14c0-.43.28-.8.63-1.02a3 3 0 0 0 0-5.04c-.35-.23-.63-.6-.63-1.02v-.14c0-.63.59-1.1 1.16-.83a5 5 0 0 1 0 9.02Z"></path></svg>
                    }
                </div>
                <ChannelNameTextContainer onMouseEnter={() => setIsHoveringName(true)} onMouseLeave={() => setIsHoveringName(false)}>
                    <UserProfileHeaderText>
                        {channel.name}
                    </UserProfileHeaderText>
                </ChannelNameTextContainer>
            </UserProfileHeader>
            <div className="flex items-center text-[var(--interactive-normal)] gap-[8px]">
                <HeaderActionButton tooltipText="Pinned Message"><BsPinAngleFill size={20} /></HeaderActionButton>
                <HeaderActionButton tooltipText="Show Member List" active={showMemberList} onClick={onToggleMemberList}>
                    <svg x="0" y="0" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM18.44 17.27c.15.43.54.73 1 .73h1.06c.83 0 1.5-.67 1.5-1.5a7.5 7.5 0 0 0-6.5-7.43c-.55-.08-.99.38-1.1.92-.06.3-.15.6-.26.87-.23.58-.05 1.3.47 1.63a9.53 9.53 0 0 1 3.83 4.78ZM12.5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 20.5a7.5 7.5 0 0 1 15 0c0 .83-.67 1.5-1.5 1.5a.2.2 0 0 1-.2-.16c-.2-.96-.56-1.87-.88-2.54-.1-.23-.42-.15-.42.1v2.1a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5Z"></path></svg>
                </HeaderActionButton>
                <SearchBar channel={channel} />
            </div>
        </ContentHeader>

    )
}
