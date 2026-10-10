import styles from "./styles.module.css"
import { FaCircle } from "react-icons/fa";
import { UserStatus } from "@/enums/user-status.enum";
import { MdCircle, MdDoNotDisturbOn, MdOutlineCircle } from "react-icons/md";
import { PiMoonFill } from "react-icons/pi";
import { Fragment } from "react";
import { UserProfile } from "@/interfaces/user-profile";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";

// Discord-style typing pill: twice as wide as the status dot, same height,
// so it scales with the avatar instead of using the fixed-size button spinner.
function TypingIndicator({ color, size }: { color: string, size: number }) {
    const dotSize = Math.max(2, Math.round(size / 4));
    return (
        <div
            className={styles["typing-pill"]}
            style={{ backgroundColor: color, height: size, width: size * 2, gap: dotSize / 2 }}>
            {[0, 1, 2].map(i => (
                <span key={i} className={styles["typing-dot"]} style={{ width: dotSize, height: dotSize }} />
            ))}
        </div>
    );
}

export function UserStatusIcon({ status, size = 12, isTyping }: { status: UserStatus, size?: number, isTyping?: boolean }) {
    return (
        <>
            {
                status === UserStatus.Online && (
                    isTyping ?
                        <TypingIndicator color="#44a25b" size={size} />
                        :
                        <MdCircle className={""} fill="#44a25b" size={size} />)

            }
            {
                status === UserStatus.DoNotDisturb && (
                    isTyping ?
                        <TypingIndicator color="#f23f43" size={size} />
                        :
                        <MdDoNotDisturbOn fill="#f23f43" size={size} />
                )
            }
            {
                status === UserStatus.Idle && (
                    isTyping ?
                        <TypingIndicator color="#f0b232" size={size} />
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
    // a boolean for this one user: only this avatar re-renders when their presence changes
    const isOnline = useUserPresenceStore(s => !!s.presenceMap.get(user.id));
    const iconSize = size ? parseInt(size) / 2.6 > 16 ? 16 : parseInt(size) / 2.6 : 12;
    const showTyping = !!isTyping && isOnline && user.status !== UserStatus.Invisible;
    return (
        <div className={styles["pfp-wrapper"]} >
            <div
                className={`${styles["pfp-container"]}`}
                style={{ height: size ? `${size}px` : "32px", width: size ? `${size}px` : "32px" }}>
                <img className="" src={user.avatarURL ?? user.defaultAvatarURL } />
            </div>
            {showStatus &&
                <Fragment>
                    {/* The pill brings its own cutout (status-container-typing), so skip the round mask. */}
                    {!showTyping && <FaCircle className={styles["mask"]} fill="transparent" size={size ? parseInt(size) / 2 > 24 ? 24 : parseInt(size) / 2 : 16} />}
                    <div
                        className={`${styles["status-container"]} ${showTyping ? styles["status-container-typing"] : ""}`}
                        // Keep the right edge where the round dot sits so the pill grows leftward over the avatar.
                        style={showTyping ? { transform: `translate(${(iconSize + 4) / 4}px, 25%)` } : undefined}>
                        {isOnline ? (
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