export function getAdminKey(): string {
  return process.env.ADMIN_KEY || "dev";
}

export function isAdminAuthorized(provided: string | null | undefined): boolean {
  if (!provided) return false;
  const expected = getAdminKey();
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
