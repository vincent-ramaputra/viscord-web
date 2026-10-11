"use client"
import { useEffect, useState } from "react";
import Dropdown, { DropdownOption } from "../dropdown/dropdown";
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
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = [...Array(150).keys()].map((i) => (new Date().getFullYear()) - i - 3);

const dayOptions: DropdownOption<number>[] = days.map((day) => ({ label: String(day), value: day }));
const monthOptions: DropdownOption<number>[] = months.map((month, index) => ({ label: month, value: index }));
const yearOptions: DropdownOption<number>[] = years.map(year => ({ label: String(year), value: year }));

export default function DateInput({ label, isRequired = false, onChange, errorMessage }: DateInputProps) {
    const [month, setMonth] = useState<number | undefined>();
    const [day, setDay] = useState<number | undefined>();
    const [year, setYear] = useState<number | undefined>();

    useEffect(() => {
        if (year === undefined || month === undefined || day === undefined) return;

        const date = new Date(year, month, day);
        onChange(date);
    }, [month, year, day])

    return (
        <div className={styles.container}>
            <div className={styles['label-container']}>
                <p className={`font-bold whitespace-break-spaces leading-[1.25] ${errorMessage ? "text-red-400" : ""}`}>{label.toUpperCase() + ' '}</p>
                {!errorMessage && isRequired && <span className="text-red-400">*</span>}
                {errorMessage && <p className="tracking-wide text-red-400 leading-[1.333] italic">{` - ${errorMessage}`}</p>}
            </div>
            <div className={styles["input-wrapper"]}>
                <Dropdown placeholder="Month" options={monthOptions} value={month} onChange={(val) => setMonth(val)} />
                <Dropdown placeholder="Day" options={dayOptions} value={day} onChange={(val) => setDay(val)} />
                <Dropdown placeholder="Year" options={yearOptions} value={year} onChange={(val) => setYear(val)} />
            </div>
        </div>
    );
}

