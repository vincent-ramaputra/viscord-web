import type { ClientReadyResponseDTO } from "@/interfaces/dto/client-ready-response.dto";
import type { UserProfile } from "@/interfaces/user-profile";

/** Build independent store maps without modifying the gateway payload. */
export function mapClientReady(data: ClientReadyResponseDTO) {
    const currentUser = data.user;
    const guilds = new Map((data.guilds ?? []).map(guild => [guild.id, guild]));
    const channels = new Map((data.dmChannels ?? []).map(channel => [channel.id, channel]));
    const profiles = [
        currentUser.profile,
        ...(data.relationships ?? []).map(relationship => relationship.user),
        ...(data.dmChannels ?? []).flatMap(channel => channel.recipients ?? []),
        ...(data.guilds ?? []).flatMap(guild => guild.members.map(member => member.profile)),
    ];
    const userProfiles = new Map<string, UserProfile>();
    for (const profile of profiles) {
        if (!userProfiles.has(profile.id)) userProfiles.set(profile.id, profile);
    }
    const presences = new Map(data.presences.map(id => [id, true]));
    return { currentUser, guilds, channels, userProfiles, presences };
}
