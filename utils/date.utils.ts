
export function dateToAMPM(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';

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

export function getTimePoint(date: Date, now = new Date()) {
    if (date.toDateString() === now.toDateString()) {
        return `Today at`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday at';
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

    return `${formattedDate},`;
}


export function isWithinMessageGroup(previous: Date, current: Date): boolean {
    const elapsed = current.getTime() - previous.getTime();
    return elapsed >= 0 && elapsed < 5 * 60 * 1000;
}
