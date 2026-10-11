"use client"
import { FaChevronDown } from "react-icons/fa";
import styles from './styles.module.css'
import { useEffect, useRef, useState } from "react";

export interface DropdownOption<T> {
    value: T;
    label: string;
}
interface DropdownProps<T> {
    placeholder?: string;
    options: DropdownOption<T>[]
    value: T | undefined;
    onChange: (val: T) => void;
}


export default function Dropdown<T>({ placeholder = "",  options, value, onChange }: DropdownProps<T>) {
    const [showDropdown, setShowDropdown] = useState(false);
    const selectedLabel = options.find(opt => opt.value === value)?.label ?? "";
    const [query, setQuery] = useState("");
    const filteredResult = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
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
                    setQuery("");
                    setShowDropdown(true)
                }}
                value={showDropdown ? query : selectedLabel}
                onChange={(e) => {
                    setQuery(e.target.value);
                }
                } />
            <span className={styles["dropdown-icon"]}><FaChevronDown size={14} /></span>
            {showDropdown && <div className={styles["dropdown-select-container"]}>
                {filteredResult.length != 0 ?
                    filteredResult.map((item) => {
                        return (
                            <div className={styles["dropdown-select-item"]} key={item.label} onClick={() => {
                                onChange(item.value);
                                setShowDropdown(false);
                            }}>{item.label}</div>
                        )
                    }) :
                    <div className={styles["dropdown-select-item-not-found"]} onClick={() => {
                        setShowDropdown(false);
                    }}>No results found</div>}
            </div>}
        </div>
    );
}

