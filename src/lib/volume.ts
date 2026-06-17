export type VolumeType = 'block' | 'file';
export type MeasurementSystem = 'decimal' | 'binary';
export type SizeUnit = 'KB' | 'MB' | 'GB' | 'KiB' | 'MiB' | 'GiB';

export type VolumePayload = {
  name: string;
  type: VolumeType;
  sizeBytes: number;
};

export const existingVolumeNames = [
  'fast-storage',
  'cold-disk',
  'dark-pool',
  'bright-node',
  'deep-cache',
  'sharp-shard',
  'slow-drive',
  'hot-block',
  'large-volume',
  'small-chunk',
] as const;

export type VolumeNamePatternType = (typeof existingVolumeNames)[number];

export const volumeNamePattern = /^[A-Za-z0-9-]+$/;

export function isExistingVolumeName(name: string): name is VolumeNamePatternType {
  return existingVolumeNames.includes(name.trim() as VolumeNamePatternType);
}

export const unitsBySystem: Record<MeasurementSystem, SizeUnit[]> = {
  decimal: ['KB', 'MB', 'GB'],
  binary: ['KiB', 'MiB', 'GiB'],
};

const unitPower: Record<SizeUnit, number> = {
  KB: 1,
  MB: 2,
  GB: 3,
  KiB: 1,
  MiB: 2,
  GiB: 3,
};

export function convertSizeToBytes(size: number, unit: SizeUnit): number {
  const base = unit.endsWith('iB') ? 1024 : 1000;

  return Math.round(size * base ** unitPower[unit]);
}

export function createVolumePayload(params: {
  name: string;
  type: VolumeType;
  size: number;
  unit: SizeUnit;
}): VolumePayload {
  return {
    name: params.name.trim(),
    type: params.type,
    sizeBytes: convertSizeToBytes(params.size, params.unit),
  };
}
