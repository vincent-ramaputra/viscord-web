// Shareable links are built from the origin the app is being served from, so they match the
// environment (localhost in dev, the cluster domain when deployed) without a build-time env var.
// Browser-only: call from event handlers or after data has loaded, not during server rendering.

export function getInviteURL(code: string) {
    return `${window.location.origin}/invites/${code}`;
}

export function getChannelURL(guildId: string, channelId: string) {
    return `${window.location.origin}/channels/${guildId}/${channelId}`;
}
