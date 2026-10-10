"use client"
import ButtonPrimary from "@/components/buttons/button-primary";
import styled from "styled-components";
import { ComponentType, Fragment, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Relationship from "@/interfaces/relationship";
import { RelationshipType } from "@/enums/relationship-type.enum";
import TextInput from "@/components/text-input/text-input";
import { useRelationshipsQuery } from "@/hooks/queries";
import { AddFriendTab } from "./add-friend-tab";
import { AllFriendsTab, OnlineFriendsTab, PendingRequestsTab } from "./relationships-tab";
import ContentHeader from "@/app/(app)/content-header";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";

const HeaderMain = styled.div`
    display: flex;
    align-items: center;
    height: 42px;
    color: var(--text-normal);
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
`
const FriendsFilterButton = styled.div`
    font-weight: 500;
    display: flex;
    justify-content: center;
    padding: 4px 12px ;
    border-radius: 8px;
    line-height: 20px;
    min-height: 32px;
    align-items: center;
    cursor: pointer;
    &.active {
    background-color: var(--button-secondary);
    }
    
    &:hover {
    background-color: var(--button-secondary-hover);
    }
`

const IconContainer = styled.div`
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    svg {
    flex-shrink: 0;
    width: 20px !important;
    height: 20px;
    }
`

const SearchBarContainer = styled.div`
    padding: 12px 24px;
`

const FriendRequestCountText = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 8px;
    background-color: var(--status-danger);
    width: 16px;
    height: 16px;
    text-align: center;
    border-radius: 50px;
    font-size: 12px;
    line-height: 1.333;
    font-weight: 700;
    padding-right: 1px;
`
const FriendListContainer = styled.div`
    padding: 0 20px 0 24px;
    overflow-y: scroll;
    display: flex;
    flex-direction: column;
    min-height: 0;

    &::-webkit-scrollbar {
        width: 12px;
    }

    &::-webkit-scrollbar-thumb {
        border: 3px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 10px;
        background-color: #888;
    }

`

interface TabButtonProps {
    onClick?: () => void;
    className?: string
    children: ReactNode
}
interface TabItem {
    id: string
    // filter: (rel: Relationship) => boolean
    type: ComponentType<TabButtonProps>
    show: () => boolean
    button: ReactNode
}

export default function FriendListPage() {
    const [searchText, setSearchText] = useState('');
    const { presenceMap } = useUserPresenceStore();
    const { data: relationships } = useRelationshipsQuery();
    const filterButtons: TabItem[] = [
        {
            id: "online",
            show: () => true,
            type: FriendsFilterButton,
            button:
                <p>Online</p>
        },
        {
            id: "all",
            show: () => true,
            type: FriendsFilterButton,
            button: (
                <p>All</p>
            )
        },
        {
            id: "pending",
            show: () => relationships !== undefined && relationships!.filter(rel => rel.type === RelationshipType.Pending || rel.type === RelationshipType.PendingReceived).length > 0,
            type: FriendsFilterButton,
            button: (
                <div className="flex items-center">
                    <p>Pending</p>
                    {relationships && relationships!.filter(rel => rel.type === RelationshipType.PendingReceived).length > 0 &&
                        <FriendRequestCountText>{relationships!.filter(rel => rel.type === RelationshipType.PendingReceived).length}</FriendRequestCountText>
                    }
                </div>
            )
        },
        {
            id: "add-friend",
            show: () => true,
            type: ButtonPrimary,
            button: <p className="whitespace-nowrap">Add Friend</p>
        }
    ];

    const [activeTab, setActiveTab] = useState<TabItem>(filterButtons[0]);

    const filterFunction = useCallback((rel: Relationship) => {
        if (activeTab.id === 'online') {
            return presenceMap.has(rel.user.id) && rel.type === RelationshipType.Friends;
        }
        else if (activeTab.id === 'all') {
            console.log(rel.type === RelationshipType.Friends);
            return rel.type === RelationshipType.Friends;
        }
        else if (activeTab.id === 'pending') {
            return rel.type === RelationshipType.Pending || rel.type === RelationshipType.PendingReceived;
        }

        return false;
    }, [presenceMap, relationships, activeTab]);

    const filteredRelationships = useMemo(() => {
        if (!relationships) return [];

        let rels = relationships;

        if (activeTab) {
            rels = rels.filter(filterFunction);
        }

        if (searchText) {
            rels = rels.filter(rel => rel.user.displayName.includes(searchText));
        }

        if (activeTab.id === "pending" && rels.length === 0) {
            const allTab = filterButtons.find(f => f.id === "all") || filterButtons[0];
            setActiveTab(allTab);
        }

        return rels;
    }, [relationships, activeTab, searchText, presenceMap]);

    useEffect(() => {
        console.log('hehe')
        document.title = "Viscord | Friends";
    }, [])

    return (
        <div className="h-full flex flex-col">
            <div className="shrink-0">
                <ContentHeader>
                    <div className="flex items-center">
                        <HeaderMain className="mr-[12px]">
                            <IconContainer>
                                <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="29" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"></path></svg>
                            </IconContainer>
                            <p className="leading-[24px]">Friends</p>
                        </HeaderMain>
                        <div className="mx-[4px]">
                            <svg className="text-[var(--background-mod-strong)]" aria-hidden="true" role="img" width="4" height="4" viewBox="0 0 4 4"><circle cx="2" cy="2" r="2" fill="currentColor"></circle></svg>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {
                            filterButtons.map((filterButton) => {
                                if (!filterButton.show()) return;
                                return (
                                    <filterButton.type key={filterButton.id} onClick={() => setActiveTab(filterButton)} className={`mx-[8px] ${activeTab.id === filterButton.id ? "active" : ""}`}>
                                        {filterButton.button}
                                    </filterButton.type>
                                );
                            })
                        }
                    </div>
                </ContentHeader>
            </div>
            <div className="flex flex-col min-h-0">
                <div className="w-full flex flex-col min-h-0">
                    {activeTab.id === 'add-friend' ?
                        <AddFriendTab />
                        :
                        <Fragment>
                            <SearchBarContainer>
                                <TextInput
                                    label=""
                                    value={searchText}
                                    onChange={(val) => setSearchText(val)}
                                />
                            </SearchBarContainer>
                            <FriendListContainer>
                                {activeTab.id === "online" &&
                                    (
                                        <OnlineFriendsTab relationships={filteredRelationships} />
                                    )}
                                {activeTab.id === "all" &&
                                    (
                                        <AllFriendsTab relationships={filteredRelationships} />
                                    )}
                                {activeTab.id === "pending" &&
                                    (
                                        <PendingRequestsTab relationships={filteredRelationships} />
                                    )}
                            </FriendListContainer>
                        </Fragment>
                    }
                </div>

                <div className="">

                </div>
            </div>
        </div>
    )
}