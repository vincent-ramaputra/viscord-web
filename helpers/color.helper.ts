import { ROLE_COLOR_DEFAULT } from "@/constants/guilds";


export function numberToHex(color: number) {
    return  "#" + color.toString(16).padStart(6, "0");
}

export function hexToNumber(colorHex: string) {
    const [, color] = colorHex.split("#")
    return parseInt(color, 16);
}

export function getRoleColor(color: number | null) {
    return color ? numberToHex(color) : ROLE_COLOR_DEFAULT;
}