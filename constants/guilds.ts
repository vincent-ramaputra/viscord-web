import { DAY_IN_SECONDS, HOUR_IN_SECONDS, MINUTE_IN_SECONDS } from "./time";

export const INVITE_DURATIONS = {
  "30 minutes": MINUTE_IN_SECONDS * 30,
  "1 hour": HOUR_IN_SECONDS,
  "6 hour": HOUR_IN_SECONDS * 6,
  "12 hour": HOUR_IN_SECONDS * 12,
  "1 day": DAY_IN_SECONDS,
  "7 days": DAY_IN_SECONDS * 7,
  "Never": null
}

export function getInviteKeyByValue(value?: number | null) {
  return Object.entries(INVITE_DURATIONS).find(([, v]) => v === value)?.[0];
}

export function isKeyOfInviteDuration(key: string) {
  return key in INVITE_DURATIONS;
}

export const ROLE_COLOR_DEFAULT = '#99aab5';

export const ROLE_COLORS = {
  TURQOISE: '#1abc9c',
  GREEN: '#2ECC71',
  BLUE: '#3498DB',
  PURPLE: '#9B59B6',
  PINK: '#E91E63',
  YELLOW: '#F1C40F',
  ORANGE: '#E67E22',
  RED: '#E74C3C',
  GRAY: '#95A5A6',
  BLUE_GRAY: '#607D8B',
  TURQOISE_DARK: '#11806a',
  GREEN_DARK: '#1F8B4C',
  BLUE_DARK: '#206694',
  PURPLE_DARK: '#71368A',
  PINK_DARK: '#AD1457',
  YELLOW_DARK: '#C27C0E',
  ORANGE_DARK: '#A84300',
  RED_DARK: '#992D22',
  GRAY_DARK: '#979C9F',
  BLUE_GRAY_DARK: '#546E7A',
}