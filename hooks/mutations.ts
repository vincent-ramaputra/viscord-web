import { CURRENT_USER_CACHE, MESSAGES_CACHE, RELATIONSHIPS_CACHE } from "@/constants/query-keys";
import { RelationshipType } from "@/enums/relationship-type.enum";
import { SendMessageInput } from "@/interfaces/dto/create-message.dto";
import Relationship from "@/interfaces/relationship";
import { login, logout } from "@/services/auth/auth.service";
import { acknowledgeMessage, createAttachment, sendMessage } from "@/services/messages/messages.service";
import { acceptFriendRequest, declineFriendRequest } from "@/services/relationships/relationships.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Message } from "@/interfaces/message";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { MessageStatus } from "@/enums/message-status.enum";
import { useChannelsStore } from "@/app/stores/channels-store";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { createDMChannel, createGuildChannel, deleteChannel, deletePermissionOverwrite, syncChannel, updatePermissionOverwrite } from "@/services/channels/channels.service";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { joinGuild } from "@/services/invites/invites.service";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { assignRoleMembers, createRole, deleteRole, leaveGuild, updateGuild, updateMember, updateRole } from "@/services/guild/guild.service";
import { AssignRoleDTO } from "@/interfaces/dto/assign-role.dto";
import { UpdateMemberDTO } from "@/interfaces/dto/update-member.dto";
import { Role } from "@/interfaces/role";
import { updatePermissionOverwriteDTO } from "@/interfaces/dto/update-permission-overwrite.dto";
import { UpdateGuildDTO } from "@/interfaces/dto/update-guild.dto";
import { DeleteRoleDTO } from "@/interfaces/dto/delete-role.dto";
import { UpdateUserProfileDto } from "@/interfaces/dto/update-user-profile.dto";
import { updateUserProfile } from "@/services/user-profiles/user-profiles.service";
import { LoginDTO } from "@/interfaces/dto/login.dto";
import { uploadToPresignedUrl } from "@/services/s3/s3.service";
import { useUploadProgressStore } from "@/app/stores/upload-progress-store";
import { unwrap } from "@/services/request";

export function useLogoutMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => unwrap(await logout()),
        onSuccess: () => {
            const { setIsAuthorized } = useCurrentUserStore.getState();

            setIsAuthorized(false);
            queryClient.removeQueries({ queryKey: [CURRENT_USER_CACHE] });
        }
    });
}

export function useDeleteRelationshipMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (relationship: Relationship) => unwrap(await declineFriendRequest(relationship.id)),
        onSuccess: (_, relationship) => {
            queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                if (!old) {
                    return [];
                }
                return old.filter(rel => rel.id !== relationship.id);
            })
        }
    });
}

export function useAcceptFriendRequestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (relationship: Relationship) => unwrap(await acceptFriendRequest(relationship.id)),
        onSuccess: (_, relationship) => {
            queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                if (!old) {
                    return [relationship];
                }
                return old.map((rel) =>
                    rel.id === relationship.id ? { ...rel, type: RelationshipType.Friends } : rel
                );
            })
        }
    });
}

function markChannelSent(guildId: string | undefined, channelId: string, messageId: string) {
    if (guildId) {
        const { getGuild, upsertChannel } = useGuildsStore.getState();
        const channel = getGuild(guildId)?.channels.find(ch => ch.id === channelId);
        if (!channel) return;

        upsertChannel(guildId, channel.id, { ...channel, lastMessageId: messageId, userChannelState: { ...channel.userChannelState, lastReadId: messageId, unreadCount: 0 } });
    } else {
        const { getChannel, updateChannel } = useChannelsStore.getState();
        const channel = getChannel(channelId);
        if (!channel) return;

        updateChannel({ ...channel, lastMessageId: messageId, userChannelState: { ...channel.userChannelState, lastReadId: messageId, unreadCount: 0 } });
    }
}

export function useSendMessageMutation(guildId?: string) {
    const queryClient = useQueryClient();
    const contentTypeOf = (file: File) => file.type || "application/octet-stream";

    return useMutation({
        mutationFn: async ({ dto, attachments, clientId }: { dto: SendMessageInput, attachments?: File[], clientId: string }) => {
            const attachmentKeys: { key: string, fileName: string }[] = [];
            if (attachments && attachments.length > 0) {

                const { attachments: attachmentUploads } = unwrap(await createAttachment(dto.channelId, {
                    files: attachments.map((att, idx) => ({
                        id: idx,
                        contentType: contentTypeOf(att),
                        fileName: att.name,
                        size: att.size
                    }))
                }));

                const promises = [];
                for (const upload of attachmentUploads) {
                    const att = attachments.at(upload.id);
                    if (!att) throw new Error("Invalid attachment id");

                    promises.push(uploadToPresignedUrl(upload.uploadUrl, att, contentTypeOf(att), (progress) => {
                        const { setProgress } = useUploadProgressStore.getState();
                        setProgress(`${clientId}/${upload.id}`, Math.round(progress * 100));
                    }));


                    attachmentKeys.push({ key: upload.key, fileName: att.name });
                }

                const results = await Promise.all(promises);
                if (!results.every(r => r.ok)) throw new Error("Upload failed");

            }

            return unwrap(await sendMessage({ ...dto, attachments: attachmentKeys }));
        },
        onMutate: ({ dto, clientId, attachments }) => {
            const { user } = useCurrentUserStore.getState();

            const createdAt = new Date();
            const message: Message = {
                id: clientId,
                clientId,
                createdAt: createdAt,
                updatedAt: createdAt,
                senderId: user!.id,
                status: MessageStatus.Pending,
                attachments: attachments ? attachments.map((att, idx) => ({ id: `${clientId}/${idx}`, url: URL.createObjectURL(att), type: contentTypeOf(att), filename: att.name, size: att.size })) : [],
                channelId: dto.channelId,
                content: dto.content,
                mentions: dto.mentions,
                is_pinned: false,
            };

            markChannelSent(guildId, dto.channelId, message.id);
            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }

                const newMessages = [...old, message];

                return newMessages;
            });

            return message;
        },
        onSuccess: (message, { dto }, optimisticMessage) => {
            optimisticMessage.attachments.forEach(att => URL.revokeObjectURL(att.url));
            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }
                message.createdAt = new Date(message.createdAt);

                const newMessages = [...old].map(m => {
                    if (m.id === optimisticMessage.id) {
                        return message;
                    }
                    return m;
                });
                return newMessages;
            });

            markChannelSent(guildId, dto.channelId, message.id);
        },
        onError: (error, { dto }, optimisticMessage) => {
            console.error("Failed sending message", error);
            if (!optimisticMessage) return;

            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, dto.channelId], (old) => {
                if (!old) {
                    return [];
                }

                // New object for the failed message so memoized rows see the change.
                const newMessages = old.map(m =>
                    m.id === optimisticMessage.id ? { ...m, status: MessageStatus.Error } : m
                );
                return newMessages;
            })
        },
        onSettled: (message, error, { attachments, clientId }) => {
            if (!attachments || attachments.length === 0) return;
            const { clearProgress } = useUploadProgressStore.getState();
            clearProgress(attachments.map((a, idx) => `${clientId}/${idx}`));

        }
    })
}

export function useCreateGuildChannelMutation() {
    return useMutation({
        mutationFn: async (dto: CreateChannelDTO) => unwrap(await createGuildChannel(dto)),
        onSuccess: (channel, dto) => {
            const { upsertChannel } = useGuildsStore.getState();
            upsertChannel(dto.guildId, channel!.id, channel!);
        }
    })
}

export function useCreateDMChannelMutation() {
    return useMutation({
        mutationFn: async (recipientId: string) => unwrap(await createDMChannel(recipientId)),
        onSuccess: (channel) => {
            const { updateChannel } = useChannelsStore.getState();
            updateChannel(channel!);
        }
    })
}

export function useDeleteGuildChannelMutation(guildId: string) {
    return useMutation({
        mutationFn: async (channelId: string) => unwrap(await deleteChannel(channelId)),
        onSuccess: (response, channelId) => {
            const { deleteChannel: deleteGuildChannel } = useGuildsStore.getState();

            deleteGuildChannel(guildId, channelId);
        }
    });
}

export function useAcknowledgeMessageMutation() {
    return useMutation({
        mutationFn: (dto: { channelId: string, messageId: string }) => acknowledgeMessage(dto.channelId, dto.messageId),
        onMutate: (dto) => {
            const { getChannel, updateChannel } = useChannelsStore.getState();
            const channel = getChannel(dto.channelId);
            if (!channel) return;
            updateChannel({ ...channel, userChannelState: { ...channel.userChannelState, lastReadId: dto.messageId, unreadCount: 0 } })
        }
    });
}

export function useAcknowledgeGuildMessageMutation(guildId: string) {
    return useMutation({
        mutationFn: (dto: { channelId: string, messageId: string }) => acknowledgeMessage(dto.channelId, dto.messageId),
        onMutate: (dto) => {
            const { getGuild, upsertChannel } = useGuildsStore.getState();
            const guild = getGuild(guildId)!;
            const channel = guild.channels.find(ch => ch.id === dto.channelId)!;

            upsertChannel(guildId, channel.id, { ...channel, userChannelState: { ...channel.userChannelState, unreadCount: 0, lastReadId: dto.messageId } })
        }
    });
}

export function useJoinGuildMutation() {
    return useMutation({
        mutationFn: async (inviteCode: string) => unwrap(await joinGuild(inviteCode)),
        onSuccess: (guild) => {
            const { upsertGuild: addGuild } = useGuildsStore.getState();
            const { upsertUserProfile: addUserProfile } = useUserProfileStore.getState();

            addGuild(guild);
            for (const member of guild.members) addUserProfile(member.profile);
        }
    });
}

export function useLeaveGuildMutation() {
    return useMutation({
        mutationFn: async (guildId: string) => unwrap(await leaveGuild(guildId)),
        onSuccess: (response, guildId) => {

            const { removeGuild } = useGuildsStore.getState();
            removeGuild(guildId);
        }
    });
}

export function useAssignRoleMembers() {
    return useMutation({
        mutationFn: async (dto: AssignRoleDTO) => unwrap(await assignRoleMembers(dto)),
        onSuccess: (members, dto) => {
            const { upsertMember } = useGuildsStore.getState();

            for (const member of members) upsertMember(dto.guildId, member)
        }
    })
}

export function useCreateRole(guildId: string) {
    return useMutation({
        mutationFn: async () => unwrap(await createRole(guildId)),
        onSuccess: (role) => {
            const { upsertRole } = useGuildsStore.getState();
            upsertRole(guildId, role);
        }
    })
}

export function useUpdateMember() {
    return useMutation({
        mutationFn: async (dto: UpdateMemberDTO) => unwrap(await updateMember(dto)),
        onSuccess: (member, dto) => {
            const { upsertMember } = useGuildsStore.getState();

            upsertMember(dto.guildId, member);
        }
    })
}

export function useUpdateRole() {
    return useMutation({
        mutationFn: async (dto: Role) => unwrap(await updateRole(dto)),
        onSuccess: (role, dto) => {
            const { upsertRole } = useGuildsStore.getState();
            upsertRole(dto.guildId, role);
        }
    })
}

export function useUpdatePermissionOverwrite(parentId?: string) {
    return useMutation({
        mutationFn: async (dto: updatePermissionOverwriteDTO) => unwrap(await updatePermissionOverwrite(dto)),
        onSuccess: (overwrite, dto) => {
            const { upsertChannel: updateChannel, getChannel } = useGuildsStore.getState();
            const channel = getChannel(dto.channelId);
            const parent = parentId ? getChannel(parentId) : undefined;
            if (!channel) return;

            if (channel.isSynced && channel.parent) {
                channel.isSynced = false;
                channel.permissionOverwrites = parent!.permissionOverwrites;
            }
            const oldOverwrites = channel.permissionOverwrites;
            if (oldOverwrites.find(ow => ow.targetId === overwrite.targetId)) {
                channel.permissionOverwrites = oldOverwrites.map(ow => ow.targetId !== overwrite!.targetId ? ow : overwrite);
            }
            else {
                channel.permissionOverwrites = [...oldOverwrites, overwrite]
            }
            updateChannel(channel.guildId, channel.id, channel);
        }
    })
}

export function useSyncChannel() {
    return useMutation({
        mutationFn: async (channelId: string) => unwrap(await syncChannel(channelId)),
        onSuccess: (channel, channelId) => {
            const { upsertChannel: updateChannel, getChannel } = useGuildsStore.getState();
            const existingChannel = getChannel(channelId);
            if (!existingChannel) return;

            updateChannel(channel.guildId, channel.id, channel);
        }
    });
}

export function useDeletePermissionOverwrite() {
    return useMutation({
        mutationFn: async ({ channelId, targetId }: { channelId: string, targetId: string }) => unwrap(await deletePermissionOverwrite(channelId, targetId)),
        onSuccess: (response, dto) => {
            const { upsertChannel: updateChannel, getChannel } = useGuildsStore.getState();
            const channel = getChannel(dto.channelId);
            if (!channel) return;

            const oldOverwrites = channel.permissionOverwrites;
            channel.permissionOverwrites = oldOverwrites.filter(ow => ow.targetId !== dto.targetId);
            updateChannel(channel.guildId, channel.id, channel);
        }
    });
}

export function useUpdateGuildMutation() {
    return useMutation({
        mutationFn: async (dto: UpdateGuildDTO) => unwrap(await updateGuild(dto)),
        onSuccess: (guild) => {
            const { upsertGuild } = useGuildsStore.getState();

            upsertGuild(guild);
        }
    });
}

export function useDeleteRoleMutation() {
    return useMutation({
        mutationFn: async (dto: DeleteRoleDTO) => unwrap(await deleteRole(dto)),
        onSuccess: (response, dto) => {
            const { removeRole } = useGuildsStore.getState();

            removeRole(dto.guildId, dto.roleId);
        }
    });
}

export function useUpdateUserProfileMutation() {
    return useMutation({
        mutationFn: async (dto: UpdateUserProfileDto) => unwrap(await updateUserProfile(dto)),
        onSuccess: (userProfile) => {
            const { upsertUserProfile } = useUserProfileStore.getState();

            upsertUserProfile(userProfile);
        }
    });

}

export function useLoginMutation() {
    return useMutation({
        mutationFn: async (dto: LoginDTO) => unwrap(await login(dto)),
        onSuccess: () => {
            const { setIsAuthorized } = useCurrentUserStore.getState();
            setIsAuthorized(true);
        }
    })
}