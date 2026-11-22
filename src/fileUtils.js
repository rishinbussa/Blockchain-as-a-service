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
