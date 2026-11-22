// Turns a byte count into a short label such as "512 bytes", "1.5 KB" or
// "2.0 MB" (1 KB = 1024 bytes). web3 returns uint256 values as BigInt, so
// the value goes through Number() first.
export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (size === 1) {
    return '1 byte';
  }
  if (size < 1024) {
    return `${size} bytes`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Hashes file bytes with SHA-256 through the browser's Web Crypto API and
// returns lowercase hex without a 0x prefix. That is the same string
// Python's hashlib.sha256(data).hexdigest() gives, so the browser and the
// storage script record the same hash for the same file.
export async function sha256Hex(data) {
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
