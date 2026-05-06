import { useGetUserProfile, useUserProfileStore } from "@/app/stores/user-profiles-store";
import ButtonPrimary from "@/components/buttons/button-primary";
import { RELATIONSHIPS_CACHE } from "@/constants/query-keys";
import Relationship from "@/interfaces/relationship";
import { addFriend } from "@/services/relationships/relationships.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import styled from "styled-components";

const AddFriendHeaderText = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: var(--header-primary);
    margin-bottom: 8px;
    line-height: 24px;
`

const AddFriendContainer = styled.div`
    position: absolute;
    display: flex;
    align-items: center;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    padding-right: 16px;
`

const AddFriendMascotContainer = styled.div`
    position: absolute;
    bottom: 100%;
    right: 0;
    padding-right: 16px;
`

const AddFriendInput = styled.input`
    width: 100%;
    background-color: var(--input-background);
    border: 1px solid var(--input-border);
    padding: 16px 10px;
    font-size: 16px;
    border-radius: 8px;
    min-height: 44px;
    line-height: 20px;
    min-width: 0;

    &:focus {
    outline: 1px solid var(--input-focused);
    }

    
    &.success {
    outline: 1px solid var(--text-positive);
    }

    &.error {
    outline: 1px solid var(--text-danger);
    }
`

const AddFriendTabContainer = styled.div`
    padding: 20px 30px;
    border-bottom: 1px solid var(--border-container);
`

const ResponseText = styled.p`
    font-size: 14px;
    margin-top: 8px;
    line-height: 20px;

    &.success {
        color: var(--text-positive);
    }

    &.error {
        color: var(--text-danger);
    }
`


export function AddFriendTab() {
    const [usernameText, setUsernameText] = useState("");
    const [responseText, setResponseText] = useState<string | undefined>();
    const [responseSuccess, setResponseSuccess] = useState<boolean | undefined>();
    const queryClient = useQueryClient();
    const { upsertUserProfile } = useUserProfileStore();

    const { mutate: addFriendMutation, isPending, } = useMutation(
        {
            mutationFn: (username: string) => addFriend(username),
            onSuccess: (response) => {
                if (!response.success) {
                    setResponseText(response.message as string);
                    setResponseSuccess(false);
                    return;
                }

                setResponseText(usernameText);
                setResponseSuccess(true);
                if (response.data) {
                    upsertUserProfile(response.data.user);
                    queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                        if (!old) {
                            return [response.data!];
                        }
                        return [...old, response.data!];
                    })
                }
            },
            onError: (err) => {
                setResponseText("An error occurred while sending the friend request.");
                setResponseSuccess(false);
            }
        }
    );

    async function handleAddFriend(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setResponseText(undefined);
        setResponseSuccess(undefined);

        addFriendMutation(usernameText);
    }

    return (
        <AddFriendTabContainer>
            <AddFriendHeaderText>Add Friend</AddFriendHeaderText>
            <p>You can add friends with their Viscord username.</p>
            <form onSubmit={handleAddFriend}>
                <div className="relative mt-[16px]">
                    <AddFriendInput
                        className={`${responseSuccess !== undefined ? responseSuccess ? "success" : "error" : ""}`}
                        onChange={(e) => { setUsernameText(e.target.value) }}
                        value={usernameText}
                    >
                    </AddFriendInput>
                    <AddFriendContainer>
                        <ButtonPrimary
                            className="h-[32px] items-center text-[14px]"
                            disabled={usernameText.length === 0}
                            isLoading={isPending}>
                            Send Friend Request
                        </ButtonPrimary>
                    </AddFriendContainer>
                    <AddFriendMascotContainer>
                        <img src={"/add-friend-mascot.svg"} alt="" />
                    </AddFriendMascotContainer>
                </div>
                {responseSuccess !== undefined && responseSuccess && <ResponseText className="success">Success! Your friend request to <strong className="font-medium">{responseText}</strong> was sent.</ResponseText>}
                {responseSuccess !== undefined && !responseSuccess && <ResponseText className="error">{responseText}</ResponseText>}
            </form>
        </AddFriendTabContainer>
    );

}
