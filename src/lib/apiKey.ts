import crypto from "crypto";

const KEY_PREFIX = "zh_live_";

// একটি নতুন API key তৈরি করে: পূর্ণ key (একবারই ইউজারকে দেখানো হবে),
// দেখানোর মতো prefix, এবং সংরক্ষণের জন্য হ্যাশ।
export function generateApiKey() {
  const secret = crypto.randomBytes(24).toString("hex");
  const fullKey = `${KEY_PREFIX}${secret}`;
  const keyHash = hashApiKey(fullKey);
  const keyPrefix = fullKey.slice(0, KEY_PREFIX.length + 8);
  return { fullKey, keyHash, keyPrefix };
}

export function hashApiKey(fullKey: string): string {
  return crypto.createHash("sha256").update(fullKey).digest("hex");
}

export function isValidKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length > KEY_PREFIX.length + 10;
}
