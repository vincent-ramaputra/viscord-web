"use client"
import { ReactNode, useState } from "react"
import Tooltip from "../tooltip/tooltip"
import styled from "styled-components"
import { LoadingIndicator } from "../loading-indicator/loading-indicator"

interface ButtonSecondaryProps {
    children: ReactNode
    onClick?: () => void
    isLoading?: boolean
    tooltip?: string
    tooltipPosition?: "top" | "bottom" | "left" | "right"
    tooltipSize?: string
    className?: string
    disabled?: boolean
    size?: "sm" | "md" | "lg"
}

const Button = styled.button`
    display: flex;
    background-color: var(--button-secondary);
    border: 1px solid transparent;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);

    &.hover {
        background-color: var(--button-secondary-hover);
    }

    &.md {
        padding: 4px 12px;
        font-size: var(--text-base);
        line-height: var(--line-height-tight);
    }

    &.lg {
        padding: 7px 15px;
        font-size: var(--text-base);
        line-height: normal;
        min-height: 38px;
    }
    

`

export default function ButtonSecondary({ className = "", size = 'md', children, onClick, isLoading, disabled, tooltipPosition, tooltip, tooltipSize }: ButtonSecondaryProps) {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <Button className={`${className} ${isHovering ? "hover" : ""} ${disabled || isLoading ? "disabled" : ""} ${size}`}
            onClick={isLoading !== true ? onClick : undefined}
            disabled={disabled || isLoading === true}
            onMouseEnter={() => { if (!disabled) setIsHovering(true) }}
            onMouseLeave={() => { if (!disabled) setIsHovering(false) }}>
            {tooltip &&
                <Tooltip position={tooltipPosition!} show={isHovering} text={tooltip} fontSize={tooltipSize} />}
            {isLoading === true ?
                // <div className={styles["loading-wrapper"]}>
                //     <div className={styles["dot-flashing"]}></div>
                // </div>
                <LoadingIndicator />
                :
                children}
        </Button>
    );
}