
export function setItem(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key: string) {
    return localStorage.getItem(key)
}

export function removeItem(key: string) {
    localStorage.removeItem(key)
}