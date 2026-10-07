const UNITS = ['B', 'KB', 'MB', 'GB'];

// 49101 → "47.95 KB". Uses 1024 per step, like Discord and most OS file managers.
export function formatFileSize(bytes: number) {
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < UNITS.length - 1) {
        size /= 1024;
        unit++;
    }
    return unit === 0 ? `${size} B` : `${size.toFixed(2)} ${UNITS[unit]}`;
}
