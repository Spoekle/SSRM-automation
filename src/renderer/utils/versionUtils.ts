import log from 'electron-log';
import { determineBestUpdateVersion } from '../helpers/versionHelpers';

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

export const parseVersion = (version: string): VersionInfo => {
  const cleanVersion = version.replace(/^v/, '');
  const [basePart, prereleasePart] = cleanVersion.split('-');
  const versionParts = basePart.split('.').map(Number);

  return {
    major: versionParts[0] || 0,
    minor: versionParts[1] || 0,
    patch: versionParts[2] || 0,
    prerelease: prereleasePart || null
  };
};

// This file is maintained for backward compatibility
// All version checking should use helpers/versionHelpers.ts instead

export const isUpdateNeeded = (
  currentVersion: string,
  latestVersion: string,
  isDevBranch: boolean,
  latestStableVersion?: string
): boolean => {
  // Get latest beta version if appropriate
  const latestBetaVersion = latestVersion.includes('-') ? latestVersion : null;
  const stableVersion = latestStableVersion || (!latestVersion.includes('-') ? latestVersion : null);

  const result = determineBestUpdateVersion(
    currentVersion,
    stableVersion,
    latestBetaVersion,
    isDevBranch
  );

  return result.shouldUpdate;
};
