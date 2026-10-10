import Tooltip from "@/components/tooltip/tooltip";
import { ReactNode, useState } from "react";
import styled from "styled-components";

export const ActionContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    height: 100%;
`

const ActionButtonContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--background-secondary);
    border-radius: 100%;

    &.reject:hover {
        color: var(--text-danger);
    }

    &.accept:hover {
        color: var(--text-positive);
    }
`

export function ActionButton({ className, children, onClick, tooltipText }: { className?: string, children?: ReactNode, onClick?: () => void, tooltipText: string }) {
    const [isHovering, setIsHovering] = useState(false)
    return (
        <ActionButtonContainer onClick={onClick} className={`relative ${className}`} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            {children}
            <Tooltip position="top" show={isHovering} text={tooltipText} />
        </ActionButtonContainer>
    );
}