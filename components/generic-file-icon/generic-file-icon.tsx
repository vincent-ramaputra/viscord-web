// One generic icon for every file type, so there's no per-extension mapping to maintain.
export default function GenericFileIcon({ width = 72 }: { width?: number }) {
    return (
        <svg width={width} height={width * 4 / 3} viewBox="0 0 72 96" aria-hidden="true" className="shrink-0">
            <path d="M4 0h44l24 24v68a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" fill="#c9ccfa" />
            <path d="M48 0l24 24H52a4 4 0 0 1-4-4z" fill="#a5abf2" />
        </svg>
    );
}
