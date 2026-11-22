import { formatFileSize } from './fileUtils';

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
