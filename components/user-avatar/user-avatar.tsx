import { UserData } from "@/interfaces/user-data";
import styles from "./styles.module.css"
import { FaCircle } from "react-icons/fa";
import { UserStatus } from "@/enums/user-status.enum";
import { MdCircle, MdDoNotDisturbOn, MdOutlineCircle } from "react-icons/md";
import { PiMoonFill } from "react-icons/pi";
import { Fragment } from "react";
import { UserProfile } from "@/interfaces/user-profile";
import { useRelationshipsQuery } from "@/hooks/queries";
import { useContextMenu } from "@/contexts/context-menu.context";
import { ContextMenuType } from "@/enums/context-menu-type.enum";
import { useUserPresence } from "@/contexts/user-presence.context";
import { LoadingIndicator } from "../loading-indicator/loading-indicator";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";

export function UserStatusIcon({ status, size = 12, isTyping }: { status: UserStatus, size?: number, isTyping?: boolean }) {
    return (
        <>
            {
                status === UserStatus.Online && (
                    isTyping ?
                        <div className="bg-[#44a25b] rounded-full">
                            <LoadingIndicator />
                        </div>
                        :
                        <MdCircle className={""} fill="#44a25b" size={size} />)

            }
            {
                status === UserStatus.DoNotDisturb && (
                    isTyping ?
                        <div className="bg-[#f23f43] rounded-full">
                            <LoadingIndicator />
                        </div>
                        :
                        <MdDoNotDisturbOn fill="#f23f43" size={size} />
                )
            }
            {
                status === UserStatus.Idle && (
                    isTyping ?
                        <div className="bg-[#f0b232] rounded-full">
                            <LoadingIndicator />
                        </div>
                        :
                        <PiMoonFill fill="#f0b232" className={styles["idle-icon"]} size={size} />
                )
            }
            {
                status === UserStatus.Invisible && (
                    <MdOutlineCircle className={styles["offline-icon"]} fill="#80848e" size={size} />
                )
            }

        </>
    );
}

export default function UserAvatar({ user, showStatus = true, size, isTyping }: { user: UserProfile, showStatus?: boolean, size?: string, isTyping?: boolean }) {
    const { isUserOnline } = useUserPresenceStore();
    const iconSize = size ? parseInt(size) / 2.6 > 16 ? 16 : parseInt(size) / 2.6 : 12;
    return (
        <div className={styles["pfp-wrapper"]} >
            <div
                className={`${styles["pfp-container"]}`}
                style={{ height: size ? `${size}px` : "32px", width: size ? `${size}px` : "32px" }}>
                <img className="" src={user.avatarURL ?? user.defaultAvatarURL } />
            </div>
            {showStatus &&
                <Fragment>
                    <FaCircle className={styles["mask"]} fill="transparent" size={size ? parseInt(size) / 2 > 24 ? 24 : parseInt(size) / 2 : 16} />
                    <div className={styles["status-container"]}>
                        {isUserOnline(user.id) ? (
                            <UserStatusIcon status={user.status} size={iconSize} isTyping={isTyping} />
                        ) : (
                            <MdOutlineCircle className={styles["offline-icon"]} fill="#80848e" size={iconSize} />
                        )}

                    </div>
                </Fragment>
            }
        </div>
    );
}