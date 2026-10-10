import { ReactNode, useState } from "react";
import styles from "./styles.module.css"
import Tooltip from "../tooltip/tooltip";

interface TransparentButtonProps {
    children: ReactNode
    onClick?: () => void
    isLoading?: boolean
    tooltip?: string
    tooltipPosition?: "top" | "bottom" | "left" | "right"
    tooltipSize?: string
}

export default function TransparentButton({ children, onClick, isLoading, tooltipPosition, tooltip, tooltipSize }: TransparentButtonProps) {
    const [isHovering, setIsHovering] = useState(false);


    return (
        <button className={styles.button}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={isLoading !== true ? onClick : undefined}
            disabled={isLoading === true}>
            {tooltip &&
                <Tooltip position={tooltipPosition!} show={isHovering} text={tooltip} fontSize={tooltipSize} />}
            {isLoading === true ?
                <div className={styles["loading-wrapper"]}>
                    <div className={styles["dot-flashing"]}></div>
                </div>
                :
                children
            }
        </button>
    );
}