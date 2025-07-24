import log from 'electron-log';

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

/**
 * Parse a version string into its components
 */
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

/**
 * Compare base versions (major.minor.patch)
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareBaseVersions = (v1: string | VersionInfo, v2: string | VersionInfo): number => {
  const ver1 = typeof v1 === 'string' ? parseVersion(v1) : v1;
  const ver2 = typeof v2 === 'string' ? parseVersion(v2) : v2;

  if (ver1.major > ver2.major) return 1;
  if (ver1.major < ver2.major) return -1;

  if (ver1.minor > ver2.minor) return 1;
  if (ver1.minor < ver2.minor) return -1;

  if (ver1.patch > ver2.patch) return 1;
  if (ver1.patch < ver2.patch) return -1;

  return 0;
};

/**
 * Compare full versions including prerelease tags
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareVersions = (v1: string, v2: string): number => {
  const ver1 = parseVersion(v1);
  const ver2 = parseVersion(v2);

  // First compare base versions
  const baseComparison = compareBaseVersions(ver1, ver2);
  if (baseComparison !== 0) return baseComparison;

  // If base versions are equal, compare prerelease
  // No prerelease > any prerelease
  if (!ver1.prerelease && ver2.prerelease) return 1;
  if (ver1.prerelease && !ver2.prerelease) return -1;
  if (!ver1.prerelease && !ver2.prerelease) return 0;

  // Compare prerelease versions
  const ver1PreType = ver1.prerelease?.split('.')[0] || '';
  const ver2PreType = ver2.prerelease?.split('.')[0] || '';

  // rc > beta > alpha
  if (ver1PreType !== ver2PreType) {
    if (ver1PreType === 'rc' && (ver2PreType === 'beta' || ver2PreType === 'alpha')) return 1;
    if (ver1PreType === 'beta' && ver2PreType === 'alpha') return 1;
    return -1;
  }

  // Same prerelease type, compare numbers
  const ver1PreNum = parseInt(ver1.prerelease?.split('.')[1] || '0', 10);
  const ver2PreNum = parseInt(ver2.prerelease?.split('.')[1] || '0', 10);

  if (ver1PreNum > ver2PreNum) return 1;
  if (ver1PreNum < ver2PreNum) return -1;

  return 0;
};

/**
 * Helper to create consistent log messages for version comparisons
 */
const logVersionDecision = (message: string, result: boolean, details?: string): void => {
  const status = result ? '✅ UPDATE NEEDED' : '❌ NO UPDATE';
  const detailsMsg = details ? ` (${details})` : '';
  log.info(`${status}: ${message}${detailsMsg}`);
};

/**
 * Pretty-print a version comparison for logging
 */
const formatVersionComparison = (v1: string, v2: string, compResult: number): string => {
  const symbol = compResult > 0 ? '>' : compResult < 0 ? '<' : '=';
  return `${v1} ${symbol} ${v2}`;
};

/**
 * Check if a version is a prerelease (beta, alpha, rc)
 */
const isPrerelease = (version: string | VersionInfo): boolean => {
  if (typeof version === 'string') {
    return version.includes('-');
  }
  return !!version.prerelease;
};

/**
 * Determines the best version to update to based on current version and branch preference
 * Returns an object with:
 * - shouldUpdate: boolean - whether an update is needed
 * - updateToVersion: string | null - the version to update to, or null if no update needed
 * - useStable: boolean - whether to use the stable version
 * - reason: string - human-readable explanation for the decision
 */
export const determineBestUpdateVersion = (
  currentVersion: string,
  latestStableVersion: string | null,
  latestBetaVersion: string | null,
  isDevBranch: boolean
): {
  shouldUpdate: boolean;
  updateToVersion: string | null;
  useStable: boolean;
  reason: string;
} => {
  // Create a divider in logs to easily identify each check
  log.info('='.repeat(80));
  log.info(`VERSION CHECK | Current=${currentVersion} | Branch=${isDevBranch ? 'DEV' : 'STABLE'}`);
  log.info(`Available versions: Stable=${latestStableVersion || 'N/A'}, Beta=${latestBetaVersion || 'N/A'}`);

  // Early returns for invalid inputs
  if (!currentVersion) {
    const reason = 'Current version is empty or undefined';
    logVersionDecision(reason, false);
    return { shouldUpdate: false, updateToVersion: null, useStable: false, reason };
  }

  if (!latestStableVersion && !latestBetaVersion) {
    const reason = 'No versions available for update';
    logVersionDecision(reason, false);
    return { shouldUpdate: false, updateToVersion: null, useStable: false, reason };
  }

  // Parse versions
  const current = parseVersion(currentVersion);
  const isCurrentBeta = isPrerelease(current);

  // Current is STABLE, available is ONLY BETA
  if (!isCurrentBeta && latestBetaVersion && !latestStableVersion) {
    if (!isDevBranch) {
      const reason = 'User is on stable branch but only beta is available';
      logVersionDecision(reason, false);
      return { shouldUpdate: false, updateToVersion: null, useStable: false, reason };
    }

    const betaComparison = compareVersions(latestBetaVersion, currentVersion);
    const shouldUpdate = betaComparison > 0;
    const reason = `Only beta available (${latestBetaVersion}), comparison: ${formatVersionComparison(latestBetaVersion, currentVersion, betaComparison)}`;
    logVersionDecision(reason, shouldUpdate);

    return {
      shouldUpdate,
      updateToVersion: shouldUpdate ? latestBetaVersion : null,
      useStable: false,
      reason
    };
  }

  // Current is ANY, available is ONLY STABLE
  if (latestStableVersion && !latestBetaVersion) {
    const stableComparison = compareVersions(latestStableVersion, currentVersion);
    const shouldUpdate = stableComparison > 0;
    const reason = `Only stable available (${latestStableVersion}), comparison: ${formatVersionComparison(latestStableVersion, currentVersion, stableComparison)}`;
    logVersionDecision(reason, shouldUpdate);

    return {
      shouldUpdate,
      updateToVersion: shouldUpdate ? latestStableVersion : null,
      useStable: true,
      reason
    };
  }

  // At this point, both stable and beta versions are available
  if (latestStableVersion && latestBetaVersion) {
    const stableVer = parseVersion(latestStableVersion);
    const betaVer = parseVersion(latestBetaVersion);
    const stableVsBetaBase = compareBaseVersions(stableVer, betaVer);

    log.info(`Comparing base versions: Stable ${formatVersionComparison(latestStableVersion, latestBetaVersion, stableVsBetaBase)} Beta`);

    // CASE 1: Current is STABLE, user is on STABLE branch
    if (!isCurrentBeta && !isDevBranch) {
      const stableComparison = compareVersions(latestStableVersion, currentVersion);
      const shouldUpdate = stableComparison > 0;
      const reason = `Stable user on stable branch, stable comparison: ${formatVersionComparison(latestStableVersion, currentVersion, stableComparison)}`;
      logVersionDecision(reason, shouldUpdate);

      return {
        shouldUpdate,
        updateToVersion: shouldUpdate ? latestStableVersion : null,
        useStable: true,
        reason
      };
    }

    // CASE 2: Current is STABLE, user is on DEV branch
    if (!isCurrentBeta && isDevBranch) {
      const stableComparison = compareVersions(latestStableVersion, currentVersion);
      const betaComparison = compareVersions(latestBetaVersion, currentVersion);

      log.info(`Stable user on dev branch - Stable: ${formatVersionComparison(latestStableVersion, currentVersion, stableComparison)}, Beta: ${formatVersionComparison(latestBetaVersion, currentVersion, betaComparison)}`);

      // If beta has newer base version than stable, prefer beta
      if (stableVsBetaBase < 0) {
        const shouldUpdate = betaComparison > 0;
        const reason = `Stable user on dev branch - beta has newer base version (${latestBetaVersion} > ${latestStableVersion})`;
        logVersionDecision(reason, shouldUpdate);

        return {
          shouldUpdate,
          updateToVersion: shouldUpdate ? latestBetaVersion : null,
          useStable: false,
          reason
        };
      }

      // If both are newer, prefer stable for reliability
      if (stableComparison > 0 && betaComparison > 0) {
        const reason = `Stable user on dev branch - both updates available, preferring stable for reliability`;
        logVersionDecision(reason, true);

        return {
          shouldUpdate: true,
          updateToVersion: latestStableVersion,
          useStable: true,
          reason
        };
      }

      // If only one is newer, use that one
      if (stableComparison > 0) {
        const reason = `Stable user on dev branch - only stable is newer`;
        logVersionDecision(reason, true);

        return {
          shouldUpdate: true,
          updateToVersion: latestStableVersion,
          useStable: true,
          reason
        };
      }

      if (betaComparison > 0) {
        const reason = `Stable user on dev branch - only beta is newer`;
        logVersionDecision(reason, true);

        return {
          shouldUpdate: true,
          updateToVersion: latestBetaVersion,
          useStable: false,
          reason
        };
      }

      const reason = `Stable user on dev branch - no newer versions available`;
      logVersionDecision(reason, false);
      return { shouldUpdate: false, updateToVersion: null, useStable: false, reason };
    }

    // CASE 3: Current is BETA
    if (isCurrentBeta) {
      // If stable has same or higher base version than current beta, suggest stable
      const stableVsCurrentBase = compareBaseVersions(stableVer, current);

      log.info(`Beta user - comparing base versions: Stable ${formatVersionComparison(latestStableVersion, currentVersion, stableVsCurrentBase)} Current`);

      if (stableVsCurrentBase >= 0) {
        const reason = `Beta user - stable version (${latestStableVersion}) has same or higher base version than current beta (${currentVersion})`;
        logVersionDecision(reason, true);

        return {
          shouldUpdate: true,
          updateToVersion: latestStableVersion,
          useStable: true,
          reason
        };
      }

      // For dev branch users, check if newer beta is available
      if (isDevBranch) {
        const betaComparison = compareVersions(latestBetaVersion, currentVersion);
        const shouldUpdate = betaComparison > 0;
        const reason = `Beta user on dev branch - beta comparison: ${formatVersionComparison(latestBetaVersion, currentVersion, betaComparison)}`;
        logVersionDecision(reason, shouldUpdate);

        return {
          shouldUpdate,
          updateToVersion: shouldUpdate ? latestBetaVersion : null,
          useStable: false,
          reason
        };
      }

      // Beta user on stable branch with no suitable update
      const reason = `Beta user - no appropriate update available`;
      logVersionDecision(reason, false);
      return { shouldUpdate: false, updateToVersion: null, useStable: false, reason };
    }
  }

  // Default case - should never reach here unless there's a logic error
  const reason = `No update needed (default case)`;
  logVersionDecision(reason, false);
  return { shouldUpdate: false, updateToVersion: null, useStable: false, reason };
};
