
import { Channel } from "@/interfaces/channel";
import Relationship from "@/interfaces/relationship";
import { Fragment } from "react";
import styled from "styled-components";
import { ActionButton, ActionContainer } from "./action-button";
import RelationshipListItem from "../relationship-list-item";
import { RelationshipType } from "@/enums/relationship-type.enum";
import { MdCheck, MdClose } from "react-icons/md";
import { IoMdMore } from "react-icons/io";
import { useRouter } from "next/navigation";
import { useAcceptFriendRequestMutation, useCreateDMChannelMutation, useDeleteRelationshipMutation } from "@/hooks/mutations";
import { useChannelsStore } from "@/app/stores/channels-store";

const FilterTypeContainer = styled.div`
    padding: 16px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--header-secondary);
    border-bottom: 1px solid var(--border-container);
    box-sizing: border-box;
    line-height: 1.28;
`


function MessageActionButton({ channel, relationship }: { channel?: Channel, relationship: Relationship }) {
    const router = useRouter();
    const {mutateAsync: createDMChannel} = useCreateDMChannelMutation();
    return (
        <ActionButton
            tooltipText="Message"
            onClick={async () => {
                if (!channel) {
                    const response =  await createDMChannel(relationship.user.id);
                    if (response.success) {
                        channel = response.data;
                    }
                }
                router.push(`/channels/me/${channel!.id}`)
            }}>
            <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"></path></svg>
        </ActionButton>
    );
}

export function OnlineFriendsTab({ relationships }: { relationships: Relationship[] }) {
    const { getFriendChannel} = useChannelsStore();

    return (
        <Fragment>
            <FilterTypeContainer>{`Online — ${relationships.length}`}</FilterTypeContainer>
            {relationships.map((rel) => {
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        <ActionContainer>
                            <MessageActionButton relationship={rel} channel={getFriendChannel(rel.user.id)} />
                            <ActionButton tooltipText="More">
                                <IoMdMore size={20} />
                            </ActionButton>
                        </ActionContainer>
                    </RelationshipListItem>);
            })}
        </Fragment>
    );
}

export function AllFriendsTab({ relationships }: { relationships: Relationship[] }) {
    const { getFriendChannel } = useChannelsStore();

    return (
        <Fragment>
            <FilterTypeContainer>{`All friends — ${relationships.length}`}</FilterTypeContainer>
            {relationships.map((rel) => {
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        {rel.type === RelationshipType.Friends &&
                            <ActionContainer>
                                <MessageActionButton relationship={rel} channel={getFriendChannel(rel.user.id)} />
                                <ActionButton tooltipText="More">
                                    <IoMdMore size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }

                    </RelationshipListItem>);
            })}
        </Fragment>
    );
}

export function PendingRequestsTab({ relationships }: { relationships: Relationship[] }) {
    const { getFriendChannel} = useChannelsStore();
    const {mutate: declineFriendRequest} = useDeleteRelationshipMutation();
    const {mutate: acceptFriendRequest} = useAcceptFriendRequestMutation();

    return (
        <Fragment>
            {relationships.filter(rel => rel.type === RelationshipType.Pending).length > 0 &&
                <FilterTypeContainer>{`Sent — ${relationships.length}`}</FilterTypeContainer>}
            {relationships.filter(rel => rel.type === RelationshipType.Pending).map((rel) => {
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        {rel.type === RelationshipType.Pending &&
                            <ActionContainer>
                                <ActionButton onClick={() => declineFriendRequest(rel)} className="reject" tooltipText="Cancel">
                                    <MdClose size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }
                        {rel.type === RelationshipType.Friends &&
                            <ActionContainer>
                                <MessageActionButton relationship={rel} channel={getFriendChannel(rel.user.id)} />
                                <ActionButton tooltipText="More">
                                    <IoMdMore size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }

                    </RelationshipListItem>);
            })}
            {relationships.filter(rel => rel.type === RelationshipType.PendingReceived).length > 0 &&
                <FilterTypeContainer>{`Received — ${relationships.length}`}</FilterTypeContainer>}
            {relationships.filter(rel => rel.type === RelationshipType.PendingReceived).map((rel) => {
                console.log(relationships);
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        {rel.type === RelationshipType.PendingReceived &&
                            <ActionContainer>
                                <ActionButton onClick={() => acceptFriendRequest(rel)} className="accept" tooltipText="Accept">
                                    <MdCheck size={20} />
                                </ActionButton>
                                <ActionButton onClick={() => declineFriendRequest(rel)} className="reject" tooltipText="Decline">
                                    <MdClose size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }
                        {rel.type === RelationshipType.Friends &&
                            <ActionContainer>
                                <MessageActionButton relationship={rel} channel={getFriendChannel(rel.user.id)} />
                                <ActionButton tooltipText="More">
                                    <IoMdMore size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }

                    </RelationshipListItem>);
            })}

        </Fragment>
    );
}