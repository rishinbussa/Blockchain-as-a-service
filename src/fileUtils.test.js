import { webcrypto } from 'crypto';
import { formatFileSize, sha256Hex } from './fileUtils';

test('shows sizes under 1 KB in bytes', () => {
  expect(formatFileSize(0)).toBe('0 bytes');
  expect(formatFileSize(1)).toBe('1 byte');
  expect(formatFileSize(1023)).toBe('1023 bytes');
});

test('shows sizes under 1 MB in KB', () => {
  expect(formatFileSize(1024)).toBe('1.0 KB');
  expect(formatFileSize(1536)).toBe('1.5 KB');
});

test('shows larger sizes in MB', () => {
  expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
});

test('accepts the BigInt values web3 returns for uint256 fields', () => {
  expect(formatFileSize(BigInt(2048))).toBe('2.0 KB');
});

test('hashes bytes with SHA-256 as lowercase hex, like Python hexdigest()', async () => {
  // Jest's browser environment has no Web Crypto, so use the one Node.js has.
  Object.defineProperty(window, 'crypto', { value: webcrypto });
  const bytes = new Uint8Array([97, 98, 99]); // "abc"
  // hashlib.sha256(b"abc").hexdigest() in Python returns the same string.
  expect(await sha256Hex(bytes)).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});
