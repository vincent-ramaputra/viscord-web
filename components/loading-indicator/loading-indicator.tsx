import styles from "./styles.module.css"


export function LoadingIndicator({size="6px"}: {size?: string}) {
    return (
        <div className={styles["loading-wrapper"]}>
            <div className={styles["dot-flashing"]} style={{width: size, height: size}}></div>
        </div>
    );
}