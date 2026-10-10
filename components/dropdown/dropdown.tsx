"use client"
import { FaChevronDown } from "react-icons/fa";
import styles from './styles.module.css'
import { useEffect, useRef, useState } from "react";

export interface DropdownProps {
    placeholder?: string;
    values: string[];
    value: string;
    onChange: (val: string) => void;
}


export default function Dropdown({ placeholder = "", values, value, onChange }: DropdownProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [input, setInput] = useState(value);
    const filteredResult = values.filter((item) => item.toLowerCase().includes(input.toString().toLowerCase()));
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showDropdown]);


    return (
        <div className={styles.container} ref={dropdownRef}>
            <input className={styles["input"]}
                placeholder={placeholder}
                onFocus={() => {
                    setInput("");
                    setShowDropdown(true)
                }}
                value={input}
                onBlur={
                    () => {
                        if (dropdownRef.current && !dropdownRef.current.contains(document.activeElement)) {
                            // setShowDropdown(false);
                        }
                    }
                }
                onChange={(e) => {
                    onChange(e.target.value);
                    setInput(e.target.value);
                }
                } />
            <span className={styles["dropdown-icon"]}><FaChevronDown size={14} /></span>
            {showDropdown && <div className={styles["dropdown-select-container"]}>
                {filteredResult.length != 0 ?
                    filteredResult.map((item) => {
                        return (
                            <div className={styles["dropdown-select-item"]} key={item} onClick={() => {
                                onChange(item.toString());
                                setInput(item);
                                setShowDropdown(false);
                            }}>{item}</div>
                        )
                    }) :
                    <div className={styles["dropdown-select-item-not-found"]} onClick={() => {
                        setShowDropdown(false);
                    }}>No results found</div>}
            </div>}
        </div>
    );
}

