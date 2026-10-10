"use client"
import { useEffect, useState } from "react";
import Dropdown from "../dropdown/dropdown";
import styles from './styles.module.css'

export interface DateInputProps {
    label: string;
    isRequired?: boolean
    onChange: (date: Date) => void
    errorMessage?: string | null
}

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

const years = [...Array(150).keys()].map((i) => String((new Date().getFullYear()) - i - 3));

export default function DateInput({ label, isRequired = false, onChange, errorMessage }: DateInputProps) {
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [year, setYear] = useState("");

    useEffect(() => {
        if (month.length > 0 && day.length > 0 && year.length > 0) {
            try {
                const date = new Date(`${month}-${day}-${year}`);
                onChange(date);
            } catch (error) {
                console.error(error)
            }
        }
    }, [month, year, day])

    return (
        <div className={styles.container}>
            <div className={styles['label-container']}>
                <p className={`font-bold whitespace-break-spaces leading-[1.25] ${errorMessage ? "text-red-400" : ""}`}>{label.toUpperCase() + ' '}</p>
                {!errorMessage && isRequired && <span className="text-red-400">*</span>}
                {errorMessage && <p className="tracking-wide text-red-400 leading-[1.333] italic">{` - ${errorMessage}`}</p>}
            </div>
            <div className={styles["input-wrapper"]}>
                <Dropdown placeholder="Month" values={months} value={month} onChange={(val) => setMonth(val)} />
                <Dropdown placeholder="Day" values={days} value={day} onChange={(val) => setDay(val)} />
                <Dropdown placeholder="Year" values={years} value={year} onChange={(val) => setYear(val)} />
            </div>
        </div>
    );
}

