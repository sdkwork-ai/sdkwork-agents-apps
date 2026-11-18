/**
 * Account profile surface helpers.
 *
 * Identity (display name / email) is owned by the IAM session and is read
 * through `@sdkwork/agents-pc-core/session`; nothing here caches it. The two
 * editable presentation fields that have no server projection yet (bio and
 * avatar style) are stored account-scoped, so the next account on this browser
 * starts from its own values and the sign-out hook removes them.
 */
import {
  readAccountScopedItem,
  writeAccountScopedItem,
} from '@sdkwork/agents-pc-core/session';

export const PROFILE_AVATAR_STORAGE_KEY = 'profile_avatar_index';
export const PROFILE_BIO_STORAGE_KEY = 'profile_bio';

/** The profile UI ships six avatar styles; a stored index is clamped to them. */
export const AVATAR_TEMPLATE_COUNT = 6;

export function normalizeAvatarIndex(value: unknown, templateCount = AVATAR_TEMPLATE_COUNT): number {
  const parsed = typeof value === 'number'
    ? value
    : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed) % Math.max(1, templateCount);
}

export function readProfileAvatarIndex(templateCount = AVATAR_TEMPLATE_COUNT): number {
  return normalizeAvatarIndex(readAccountScopedItem(PROFILE_AVATAR_STORAGE_KEY) ?? 0, templateCount);
}

export function writeProfileAvatarIndex(index: number): void {
  writeAccountScopedItem(PROFILE_AVATAR_STORAGE_KEY, String(normalizeAvatarIndex(index)));
}

export function readProfileBio(): string {
  return readAccountScopedItem(PROFILE_BIO_STORAGE_KEY) ?? '';
}

export function writeProfileBio(bio: string): void {
  writeAccountScopedItem(PROFILE_BIO_STORAGE_KEY, bio);
}
