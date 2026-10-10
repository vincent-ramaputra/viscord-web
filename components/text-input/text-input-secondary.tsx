"use client"
import { ReactNode, useEffect, useRef, useState } from "react";
import styles from './styles.module.css'
import styled from "styled-components";

export interface TextInputProps {
    type?: "text" | "password" | "number"
    value: string
    placeholder?: string
    leftElement?: ReactNode
    rightElement?: ReactNode
    onChange: (val: string) => void
    error?: boolean
}

const Container = styled.div`
    width: 100%;
    background-color: var(--input-background);
    border: 1px solid var(--input-border);
    font-size: 16px;
    border-radius: 8px;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 100%;
    padding-left: 4px;

    &.focus {
        outline: 1px solid var(--input-focused);
    }

    &.error {
    outline: 1px solid var(--status-danger);
    }
`
export default function TextInputSecondary({ leftElement, rightElement, type = "text", placeholder, value, onChange, error }: TextInputProps) {
    const [focus, setFocus] = useState(false);
    const helperTextContainerRef = useRef<HTMLDivElement>(null!);

    useEffect(() => {
        if (helperTextContainerRef.current) {
        }
    }, [focus])

    return (
        <Container className={`${focus ? 'focus' : ''}${error ? ' error' : ''}`} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
            {leftElement}
            <input className={`${styles['input-transparent']}`} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
            {rightElement}
        </Container>
    );
}