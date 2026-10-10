import styled from "styled-components"
import TextInputSecondary from "../text-input/text-input-secondary"
import { useMemo, useRef, useState } from "react"
import ButtonPrimary from "../buttons/button-primary"
import ButtonTertiary from "../buttons/button-tertiary"
import ButtonSuccess from "../buttons/button-success"
import { useUpdateUserProfileMutation } from "@/hooks/mutations"
import { MdInfo } from "react-icons/md"
import { useCurrentUserStore } from "@/app/stores/current-user-store"
import { useUserProfileStore } from "@/app/stores/user-profiles-store"
import ButtonSecondary from "../buttons/button-secondary"
import { UserProfile } from "@/interfaces/user-profile"
import ColorThief from "colorthief"
import { getErrorMessage } from "@/utils/error.utils";


const Header = styled.h2`
    font-weight: bold;
    font-size: var(--text-xl);
    margin-bottom: 4px;
`

const Label = styled.h4`
    margin-bottom: 8px;
    font-weight: var(--font-weight-medium);
`

const Separator = styled.div`
    border-bottom: 1px solid var(--border-subtle);
    margin: 32px 0;
`

const SaveChangesOverlay = styled.div`
    position: absolute;
    visibility: hidden;
    width: 100%;
    bottom: 0;
    padding: 0 20px;
    padding-bottom: 20px;
    transform: translateY(50%);
    transition: all 200ms cubic-bezier(0.68, -1.0, 0.27, 2.6);

    &.active {
        transform: translateY(0);
        visibility: visible;
    }
`

const SaveChangesContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 8px;
    background-color: var(--modal-background);
    box-shadow: var(--shadow-high);
    border: 1px solid var(--border-container);
    padding: 10px;
    padding-left: 16px;

    p {
        line-height: 20px;
        font-weight: var(--font-weight-medium);
    }
`

const SaveChangesButtonLayout = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`

const ErrorMessage = styled.p`
    display: flex;
    color: var(--text-danger);
    font-size: var(--text-xs);
    margin-top: 4px;
    gap: 4px;
    align-items: end;
`

const Container = styled.div`
    background-color: var(--background-surface-high);
    border-radius: 8px;
    min-width: 300px;
`

const BannerContainer = styled.div`
    min-height: 105px;
    border-radius: 8px 8px 0 0;
    width: 100%;
`

const UserAvatarContainer = styled.div`
    position: absolute;
    left: 16px;
    bottom: 0px;
    transform: translateY(50%);
`

const DisplayNameText = styled.h1`
    font-size: 20px;
    line-height: 1.2;
    font-weight: 700;
`

const UsernameText = styled.p`
    color: var(--header-primary);
    font-size: 14px;
    line-height: 18px;
`

const Body = styled.div`
    padding: 4px 8px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`

const AvatarImage = styled.img`
    cursor: pointer;
    transition: all ease-in 100ms;

    &:hover {
    -webkit-filter: brightness(70%);
    }
`



function Banner({ user }: { user: UserProfile }) {
    const imgRef = useRef<HTMLImageElement>(null!);
    const [bannerColor, setBannerColor] = useState<string | null>();
    const avatarURL = user.avatarURL ?? user.defaultAvatarURL;
    async function getBannerColor() {
        const img = imgRef.current;
        if (!img) return;

        try {
            const colorThief = new ColorThief();
            const result = colorThief.getColor(img);
            const rgb = `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
            setBannerColor(rgb);
        } catch (err) {
            console.error('Color extraction failed:', err);
        }
    }


    return (
        <div>
            <div className="relative">
                <BannerContainer style={{ backgroundColor: bannerColor ?? "" }}></BannerContainer>
                <img
                    src={avatarURL}
                    ref={imgRef}
                    style={{ display: 'none' }}
                    crossOrigin="anonymous"
                    alt="avatar"
                    onLoad={() => getBannerColor()}
                />
                <UserAvatarContainer>
                    <div className="rounded-full p-1.5 bg-[var(--background-surface-high)]">
                        <div className="rounded-full relative flex justify-center bg-inherit" >
                            <div
                                className="rounded-full self-center overflow-hidden z-0"
                                style={{ height: "80px", width: "80px" }}>
                                <AvatarImage className="" src={avatarURL} />
                            </div>
                        </div>
                    </div>
                </UserAvatarContainer>
            </div>
            <div className="h-[40px] mb-4"></div>
        </div>
    );
}


export const UserProfilePreviewCard = ({ user }: { user: UserProfile }) => {

    return (
        <Container>
            <Banner user={user} />
            <Body>
                <div className="">
                    <div className="flex gap-2 items-center">
                        <DisplayNameText>{user.displayName.length === 0 ? user.username : user.displayName}</DisplayNameText>
                    </div>
                    <UsernameText>{user.username}</UsernameText>
                </div>
            </Body>
        </Container>
    );
}
export function UserProfileSection() {
    const user = useCurrentUserStore(s => s.user);
    const {getUserProfile} = useUserProfileStore();
    const profile = getUserProfile(user!.id)!;
    const [updatedProfile, setUpdatedProfile] = useState(profile);
    const [nameError, setNameError] = useState<string | null>(null);
    const haveChanges = useMemo(() => {
        if (updatedProfile.displayName !== profile.displayName) return true;
        if (updatedProfile.pronouns !== profile.pronouns) return true;
        if (updatedProfile.bio !== profile.bio) return true;

        return false;
    }, [profile, updatedProfile]);
    const { mutateAsync: updateProfile, isPending } = useUpdateUserProfileMutation();

    function resetChanges() {
        setUpdatedProfile(profile);
    }

    async function onSaveChanges() {
        try {
            await updateProfile({displayName: updatedProfile.displayName, bio: updatedProfile.bio, pronouns: updatedProfile.bio});
        } catch (error) {
            setNameError(getErrorMessage(error));
            return;
        }

        setNameError(null);
    }

    return (
        <div className="flex flex-col gap-[16px] w-full relative pl-[20px] pt-[60px]">
            <div className="flex flex-col">
                <Header>Profiles</Header>
            </div>
            <div className="flex gap-[16px]">
                <div className="grow">
                    <div className="">
                        <Label>Display Name</Label>
                        <div className="h-[40px]">
                            <TextInputSecondary
                                error={nameError !== null}
                                onChange={(v) => setUpdatedProfile({ ...updatedProfile, displayName: v })}
                                value={updatedProfile.displayName}
                                placeholder={updatedProfile.username} />
                        </div>
                    </div>
                    {nameError && <ErrorMessage><MdInfo size={14} />{nameError}</ErrorMessage>}
                    <Separator />
                    <div className="">
                        <Label>Pronouns</Label>
                        <div className="h-[40px]">
                            <TextInputSecondary
                                error={nameError !== null}
                                onChange={(v) => setUpdatedProfile({ ...updatedProfile, pronouns: v })}
                                placeholder="Add your pronouns"
                                value={updatedProfile.pronouns ?? ""} />
                        </div>
                    </div>
                    {nameError && <ErrorMessage><MdInfo size={14} />{nameError}</ErrorMessage>}
                    <Separator />
                    <div>
                        <Label>Avatar</Label>
                        <div className="flex gap-[8px]">
                            <ButtonPrimary>Change Avatar</ButtonPrimary>
                            <ButtonSecondary>Remove Avatar</ButtonSecondary>
                        </div>
                    </div>
                    <Separator />
                    <div className="">
                        <Label>About Me</Label>
                        <div className="h-[40px]">
                            <TextInputSecondary error={nameError !== null} onChange={(v) => setUpdatedProfile({ ...updatedProfile, bio: v })} value={updatedProfile.bio ?? ""} />
                        </div>
                    </div>
                    {nameError && <ErrorMessage><MdInfo size={14} />{nameError}</ErrorMessage>}
                    <Separator />
                </div>
                <div>
                    <Label>Preview</Label>
                    <UserProfilePreviewCard user={updatedProfile} />
                </div>
            </div>
            <SaveChangesOverlay className={haveChanges ? 'active' : ''}>
                <SaveChangesContainer>
                    <p>Careful — you have unsaved changes!</p>
                    <SaveChangesButtonLayout>
                        <ButtonTertiary size="sm" onClick={resetChanges} disabled={isPending}>Reset</ButtonTertiary>
                        <ButtonSuccess size="sm" isLoading={isPending} onClick={onSaveChanges}>Save Changes</ButtonSuccess>
                    </SaveChangesButtonLayout>
                </SaveChangesContainer>
            </SaveChangesOverlay>
        </div>

    )
}