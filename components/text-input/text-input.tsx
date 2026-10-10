"use client"
import { ReactNode, useEffect, useRef, useState } from "react";
import styles from './styles.module.css'

export interface TextInputProps {
    label: string
    type?: "text" | "password" | "number"
    isRequired?: boolean
    helper?: string
    value: string
    errorMessage?: string | null
    placeholder?: string
    children?: ReactNode

    onChange: (val: string) => void
}

export default function TextInput({children, label, type = "text", placeholder, isRequired = false, helper, value, onChange, errorMessage}: TextInputProps) {
    const [focus, setFocus] = useState(false)
    const helperTextContainerRef = useRef<HTMLDivElement>(null!);
    const [maxHeight, setMaxHeight] = useState("0px");
    
    useEffect(() => {
        if (helperTextContainerRef.current) {
            const scrollHeight = helperTextContainerRef.current.scrollHeight;
            setMaxHeight(focus ? `${scrollHeight}px` : "0px");
        }
    }, [focus])
    
    return (
        <div className={`${styles.container} ${focus ? 'focus' : ''}`}>
            <div className={styles['label-container']}>
                <p className={`font-bold tracking-wide whitespace-break-spaces leading-[1.333] ${errorMessage ? "text-red-400" : ""}`}>{label.toUpperCase() + ' '}</p>
                {!errorMessage && isRequired && <span className="text-red-400">*</span>}
                {errorMessage && <p className="tracking-wide text-red-400 leading-[1.333] italic">{` - ${errorMessage}`}</p>}
            </div>
            <div className="relative" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}>
                <input className={`${styles['input']}`} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}/>
                {children}
            </div>
            {helper &&
                <div className={`${styles["text-helper"]} ${focus ? styles["text-helper-active"] : ""}`} style={{maxHeight: maxHeight}} ref={helperTextContainerRef}>
                    <p>{helper}</p>
                </div>}
        </div>
    );
}