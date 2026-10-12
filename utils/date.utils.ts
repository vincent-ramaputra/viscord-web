
export function dateToAMPM(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';

    // The 12-hour clock shows hour 0 (midnight) and hour 12 (noon) as 12.
    return `${hours % 12 || 12}:${minutes} ${ampm}`;
}

export function datetoFullDateString(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    };

    return `${new Intl.DateTimeFormat('en-US', options).format(date)} at ${dateToAMPM(date)}`;
}

export function dateToShortDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function isSameDay(date1: Date, date2: Date) {
    return (date1.getFullYear() === date2.getFullYear())
        && (date1.getMonth() === date2.getMonth())
        && (date1.getDate() === date2.getDate());
}

function isYesterday(date: Date, now: Date) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date, yesterday);
}

export function getTimePoint(date: Date, now: Date = new Date()) {
    if (isSameDay(date, now)) return 'Today at';
    if (isYesterday(date, now)) return 'Yesterday at';

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    }).format(date);

    return `${formattedDate},`;
}