"use client"
import { ReactNode, useState } from "react"
import Tooltip from "../tooltip/tooltip"
import styled from "styled-components"
import { LoadingIndicator } from "../loading-indicator/loading-indicator"

interface ButtonSuccessProps {
    children: ReactNode
    type?: "primary" | "secondary"
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
    border-radius: 8px;
    color: var(--text-primary);
    align-items: center;
    font-weight: var(--font-weight-medium);

    &.primary {
        background-color: var(--status-positive);
        border: 1px solid transparent;

        &.hover {
            background-color: var(--status-positive-hover);
        }
    }
    &.secondary {
        border: 1px solid var(--status-positive);
        &.hover {
            background-color: var(--status-positive);
        }
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

    &.sm {
        padding: 4px 12px;
        font-size: var(--text-sm);
        line-height: var(--line-height-tight);
        min-height: 32px;
    }

    &.md {
        padding: 4px 12px;
        font-size: var(--text-base);
        line-height: var(--line-height-tight);
        min-height: 32px;
    }

    &.lg {
        padding: 7px 15px;
        font-size: var(--text-base);
        line-height: normal;
        min-height: 38px;
    }
    

`

export default function ButtonSuccess({ className = "", size = 'md', type = 'primary', children, onClick, isLoading, disabled, tooltipPosition, tooltip, tooltipSize }: ButtonSuccessProps) {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <Button className={`${type} ${className} ${isHovering ? "hover" : ""} ${disabled || isLoading ? "disabled" : ""} ${size}`}
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