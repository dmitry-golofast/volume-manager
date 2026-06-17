import { afterEach, describe, expect, it, vi } from 'vitest';

import { existingNames, mockApi } from '../mock';
import {
  convertSizeToBytes,
  createVolumePayload,
  isExistingVolumeName,
  volumeNamePattern,
} from './volume';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('volume size conversion', () => {
  it('converts decimal units using powers of 1000', () => {
    expect(convertSizeToBytes(1, 'KB')).toBe(1000);
    expect(convertSizeToBytes(2.5, 'MB')).toBe(2500000);
    expect(convertSizeToBytes(1, 'GB')).toBe(1000000000);
  });

  it('converts binary units using powers of 1024', () => {
    expect(convertSizeToBytes(1, 'KiB')).toBe(1024);
    expect(convertSizeToBytes(2, 'MiB')).toBe(2097152);
    expect(convertSizeToBytes(1, 'GiB')).toBe(1073741824);
  });
});

describe('volume payload', () => {
  it('creates the backend object with sizeBytes', () => {
    expect(
      createVolumePayload({
        name: ' logs-01 ',
        type: 'file',
        size: 4,
        unit: 'KiB',
      }),
    ).toEqual({
      name: 'logs-01',
      type: 'file',
      sizeBytes: 4096,
    });
  });
});

describe('volume name validation', () => {
  it('allows only latin letters, numbers, and hyphen', () => {
    expect(volumeNamePattern.test('backup-01')).toBe(true);
    expect(volumeNamePattern.test('Data-2')).toBe(true);
    expect(volumeNamePattern.test('backup_01')).toBe(false);
    expect(volumeNamePattern.test('том-01')).toBe(false);
  });

  it('allows only names from the existingVolumeNames union', () => {
    expect(isExistingVolumeName('fast-storage')).toBe(true);
    expect(isExistingVolumeName('new-storage')).toBe(false);
  });
});

describe('mock name uniqueness', () => {
  it('marks a name from existingNames as non-unique', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const existingName = existingNames[0] as string;

    await expect(mockApi.checkName(existingName)).resolves.toEqual({ unique: false });
  });
});
