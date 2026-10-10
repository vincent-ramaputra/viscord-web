"use client"
import { ReactNode, useState } from "react"
import Tooltip from "../tooltip/tooltip"
import styled from "styled-components"
import { LoadingIndicator } from "../loading-indicator/loading-indicator"

interface PrimaryButtonProps {
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
    background-color: var(--button-primary);
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--text-primary);
    font-weight: 500;
    align-items: center;

    &.hover {
        background-color: var(--button-primary-hover);
    }

    &.active {
        background-color: var(--button-primary-selected);
        color: var(--text-brand);
    }

    &.disabled {
        // background-color: var(--button-primary-disabled);
        opacity: 0.5;
        cursor: not-allowed;
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

export default function ButtonPrimary({ className = "", size = 'md', children, onClick, isLoading, disabled, tooltipPosition, tooltip, tooltipSize }: PrimaryButtonProps) {
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
                <LoadingIndicator />
                :
                children}
        </Button>
    );
}