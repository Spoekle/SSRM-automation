/**
 * Update Service for Tauri v2
 * Uses the official @tauri-apps/plugin-updater for checking and installing updates
 * Supports both stable and dev (beta) update channels
 */

import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const GITHUB_OWNER = 'Spoekle';
const GITHUB_REPO = 'SSRM-automation';

export interface UpdateProgress {
    event: 'Started' | 'Progress' | 'Finished';
    contentLength?: number;
    downloaded?: number;
    chunkLength?: number;
}

export interface UpdateCheckResult {
    available: boolean;
    version?: string;
    notes?: string;
    date?: string;
    update?: Update;
    isPrerelease?: boolean;
}

interface GitHubRelease {
    tag_name: string;
    prerelease: boolean;
    draft: boolean;
    published_at: string;
    body: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

/**
 * Check if on development branch (for beta updates)
 */
function isDevBranch(): boolean {
    return localStorage.getItem('useDevelopmentBranch') === 'true';
}

/**
 * Get the current app version from tauri config
 */
async function getCurrentVersion(): Promise<string> {
    try {
        const { getVersion } = await import('@tauri-apps/api/app');
        return await getVersion();
    } catch {
        return '0.0.0';
    }
}

/**
 * Compare semver versions (basic comparison)
 * Returns true if v2 is newer than v1
 */
function isNewerVersion(v1: string, v2: string): boolean {
    // Remove 'v' prefix if present
    const clean1 = v1.replace(/^v/, '');
    const clean2 = v2.replace(/^v/, '');

    // Split into parts, handling prerelease tags
    const [version1, prerelease1] = clean1.split('-');
    const [version2, prerelease2] = clean2.split('-');

    const parts1 = version1.split('.').map(p => parseInt(p) || 0);
    const parts2 = version2.split('.').map(p => parseInt(p) || 0);

    // Compare major.minor.patch
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p2 > p1) return true;
        if (p2 < p1) return false;
    }

    // If main version is equal, compare prerelease
    // No prerelease > prerelease (stable is newer)
    if (!prerelease2 && prerelease1) return true;
    if (prerelease2 && !prerelease1) return false;

    // Both have prerelease, compare them
    if (prerelease1 && prerelease2) {
        // Extract prerelease numbers (e.g., beta.2 -> 2)
        const num1 = parseInt(prerelease1.replace(/\D/g, '')) || 0;
        const num2 = parseInt(prerelease2.replace(/\D/g, '')) || 0;
        return num2 > num1;
    }

    return false;
}

/**
 * Fetch latest release from GitHub API (includes pre-releases for dev branch)
 */
async function fetchLatestGitHubRelease(includePrerelease: boolean): Promise<GitHubRelease | null> {
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SSRM-Automation-Updater'
            }
        });

        if (!response.ok) {
            console.error('[UpdateService] GitHub API error:', response.status);
            return null;
        }

        const releases: GitHubRelease[] = await response.json();

        // Filter out drafts, and optionally filter prereleases
        const eligibleReleases = releases.filter(r => {
            if (r.draft) return false;
            if (!includePrerelease && r.prerelease) return false;
            return true;
        });

        if (eligibleReleases.length === 0) return null;

        // Sort by published date (newest first)
        eligibleReleases.sort((a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );

        return eligibleReleases[0];
    } catch (error) {
        console.error('[UpdateService] Failed to fetch GitHub releases:', error);
        return null;
    }
}

/**
 * Check if an update is available
 * For dev branch: checks GitHub API for prereleases
 * For stable: uses default updater endpoint from tauri.conf.json
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
    try {
        const useDevChannel = isDevBranch();
        console.log(`[UpdateService] Checking for updates (dev channel: ${useDevChannel})`);

        // First, always try the standard check (uses tauri.conf.json endpoints)
        const standardUpdate = await check();

        if (useDevChannel) {
            // Dev branch: also check GitHub API for prereleases
            const latestRelease = await fetchLatestGitHubRelease(true);

            if (!latestRelease) {
                // Fall back to standard update if GitHub API fails
                if (standardUpdate) {
                    return {
                        available: true,
                        version: standardUpdate.version,
                        notes: standardUpdate.body ?? undefined,
                        date: standardUpdate.date ?? undefined,
                        update: standardUpdate,
                        isPrerelease: false,
                    };
                }
                return { available: false };
            }

            const currentVersion = await getCurrentVersion();
            const latestVersion = latestRelease.tag_name.replace(/^v/, '');

            console.log(`[UpdateService] Current: ${currentVersion}, Latest (including beta): ${latestVersion}`);

            // Check if the GitHub release is newer than current
            if (isNewerVersion(currentVersion, latestVersion)) {
                // For prereleases, we need to check if we got an update from standard check
                // and if the prerelease is actually newer
                if (standardUpdate) {
                    // Compare standard update version with GitHub prerelease
                    if (isNewerVersion(standardUpdate.version, latestVersion)) {
                        // Prerelease is newer, but we can't use custom endpoints at runtime
                        // Return info about the prerelease for display, but use standard update mechanism
                        console.log(`[UpdateService] Prerelease ${latestVersion} available, but using standard updater`);
                        return {
                            available: true,
                            version: latestVersion,
                            notes: latestRelease.body,
                            date: latestRelease.published_at,
                            update: standardUpdate, // Use the standard update object
                            isPrerelease: latestRelease.prerelease,
                        };
                    }
                    // Standard update is same or newer
                    return {
                        available: true,
                        version: standardUpdate.version,
                        notes: standardUpdate.body ?? undefined,
                        date: standardUpdate.date ?? undefined,
                        update: standardUpdate,
                        isPrerelease: false,
                    };
                }

                // No standard update available, inform user about prerelease
                // They'll need to download manually from GitHub
                return {
                    available: true,
                    version: latestVersion,
                    notes: latestRelease.body,
                    date: latestRelease.published_at,
                    update: undefined, // No automatic update available
                    isPrerelease: latestRelease.prerelease,
                };
            }

            // Current version is up to date
            return { available: false };
        } else {
            // Stable branch: use the default updater only
            if (standardUpdate) {
                return {
                    available: true,
                    version: standardUpdate.version,
                    notes: standardUpdate.body ?? undefined,
                    date: standardUpdate.date ?? undefined,
                    update: standardUpdate,
                    isPrerelease: false,
                };
            }

            return { available: false };
        }
    } catch (error) {
        console.error('[UpdateService] Error checking for updates:', error);
        throw error;
    }
}

/**
 * Download and install an update, then restart the application
 * @param update - The update object from checkForUpdate
 * @param onProgress - Optional callback for download progress
 */
export async function downloadAndInstallUpdate(
    update: Update,
    onProgress?: (progress: UpdateProgress) => void
): Promise<void> {
    try {
        let downloaded = 0;
        let contentLength = 0;

        await update.downloadAndInstall((event) => {
            switch (event.event) {
                case 'Started':
                    contentLength = event.data.contentLength ?? 0;
                    onProgress?.({
                        event: 'Started',
                        contentLength,
                    });
                    console.log(`[UpdateService] Started downloading ${contentLength} bytes`);
                    break;

                case 'Progress':
                    downloaded += event.data.chunkLength;
                    onProgress?.({
                        event: 'Progress',
                        downloaded,
                        contentLength,
                        chunkLength: event.data.chunkLength,
                    });
                    break;

                case 'Finished':
                    onProgress?.({
                        event: 'Finished',
                        downloaded,
                        contentLength,
                    });
                    console.log('[UpdateService] Download finished');
                    break;
            }
        });

        console.log('[UpdateService] Update installed, restarting...');
        await relaunch();
    } catch (error) {
        console.error('[UpdateService] Error installing update:', error);
        throw error;
    }
}

/**
 * Convenience function to check and install updates in one call
 */
export async function checkAndInstallUpdate(
    onProgress?: (progress: UpdateProgress) => void
): Promise<boolean> {
    const result = await checkForUpdate();

    if (result.available && result.update) {
        await downloadAndInstallUpdate(result.update, onProgress);
        return true;
    }

    return false;
}

/**
 * Open the GitHub releases page for manual download
 * Used when automatic update isn't available for prereleases
 */
export function openReleasesPage(): void {
    window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, '_blank');
}
