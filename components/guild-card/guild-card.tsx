import { useGuildsStore } from "@/app/stores/guilds-store";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";
import ColorThief from "colorthief";
import { useRef, useState } from "react";
import styled from "styled-components";


interface GuildCardProps {
    guildId: string;
}

const CardContainer = styled.div`
    width: 300px;
    border: 1px solid var(--border-container);
    border-radius: var(--rounded-xl);
`

const BannerContainer = styled.div`
    height: 120px;
    border-top-right-radius: var(--rounded-xl);
    border-top-left-radius: var(--rounded-xl);
`

const ProfileContainer = styled.div`
    position: relative;
    background-color: var(--background-surface-higher);
    height: 120px;
    border-bottom-right-radius: var(--rounded-xl);
    border-bottom-left-radius: var(--rounded-xl);
    padding-top: 40px;
`

const IconLayout = styled.div`
    position: absolute;
    margin: 0 16px;
    width: 70px;
    height: 70px;   
    background-color: var(--background-surface-higher);
    top: -34px;
    border-radius: var(--rounded-xl);
    padding: 4px;
`

const IconContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: black;
    border-radius: calc(var(--rounded-xl) - 4px);
`

const GuildProfile = styled.div`
    padding: 8px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    font-size: var(--text-sm);
    color: var(--header-secondary);
`

const GuildName = styled.h4`
    color: var(--header-primary);
    font-weight: var(--font-weight-bold);
    // font-size: var(--text-sm);
`

const MemberStatusIndicator = styled.div`
    // display: flex;
    width: 8px;
    height: 8px;
    border-radius: var(--rounded-full);
`

const MemberInfoContainer = styled.div`
    display: flex;
    gap: 8px;
    p {
        margin-left: 4px;
        font-size: var(--text-sm);
        color: var(--header-secondary);
    }
`

export function GuildCard({ guildId }: GuildCardProps) {
    const guild = useGuildsStore(s => s.getGuild(guildId));
    const { isUserOnline } = useUserPresenceStore();
    const [bannerColor, setBannerColor] = useState('black');
    const iconRef = useRef<HTMLImageElement>(null!);

    async function getBannerColor() {
        const img = iconRef.current;
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

    if (!guild) {
        return (
            <CardContainer>

            </CardContainer>
        );
    }

    const initials = guild.name.split(' ').map(s => s[0]).join(' ');
    const onlineUserCount = guild.members.filter(m => isUserOnline(m.userId)).length;
    const formattedEstablishedDate = new Date(guild.createdAt).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
    });

    return (
        <CardContainer>
            <BannerContainer style={{ backgroundColor: bannerColor }} />
            <ProfileContainer>
                <IconLayout>
                    <IconContainer>
                        {guild.iconURL ?
                            <img
                                src={guild.iconURL} alt="initials"
                                ref={iconRef}
                                onLoad={() => getBannerColor()}
                            />
                            :
                            <p>{initials}</p>
                        }
                    </IconContainer>
                </IconLayout>
                <GuildProfile>
                    <GuildName>{guild.name}</GuildName>
                    <MemberInfoContainer>
                        <div className="flex items-center">
                            <MemberStatusIndicator style={{ backgroundColor: 'var(--status-positive' }} />
                            <p>{onlineUserCount} Online</p>
                        </div>
                        <div className="flex items-center">
                            <MemberStatusIndicator style={{ backgroundColor: '#97989F' }} />
                            <p>{guild.members.length} Members</p>
                        </div>
                    </MemberInfoContainer>
                    <p>Est. {formattedEstablishedDate}</p>
                </GuildProfile>
            </ProfileContainer>
        </CardContainer >
    );
}