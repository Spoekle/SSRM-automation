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

    const parts1 = clean1.split(/[-.]/).map(p => parseInt(p) || 0);
    const parts2 = clean2.split(/[-.]/).map(p => parseInt(p) || 0);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p2 > p1) return true;
        if (p2 < p1) return false;
    }

    // If numeric parts are equal, check for prerelease tags
    // A version without prerelease is newer than one with prerelease
    const hasPrerelease1 = clean1.includes('-');
    const hasPrerelease2 = clean2.includes('-');

    if (!hasPrerelease2 && hasPrerelease1) return true;

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
 * Uses different logic for stable vs dev branch
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
    try {
        const useDevChannel = isDevBranch();
        console.log(`[UpdateService] Checking for updates (dev channel: ${useDevChannel})`);

        if (useDevChannel) {
            // Dev branch: check GitHub API for latest release including prereleases
            const latestRelease = await fetchLatestGitHubRelease(true);

            if (!latestRelease) {
                console.log('[UpdateService] No releases found on GitHub');
                return { available: false };
            }

            const currentVersion = await getCurrentVersion();
            const latestVersion = latestRelease.tag_name.replace(/^v/, '');

            console.log(`[UpdateService] Current: ${currentVersion}, Latest (including beta): ${latestVersion}`);

            if (isNewerVersion(currentVersion, latestVersion)) {
                // Use the standard updater but with custom endpoint
                // The updater will download from the latest.json in that specific release
                const update = await check({
                    endpoints: [
                        `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${latestRelease.tag_name}/latest.json`
                    ]
                });

                if (update) {
                    return {
                        available: true,
                        version: update.version,
                        notes: update.body ?? latestRelease.body,
                        date: update.date ?? latestRelease.published_at,
                        update,
                    };
                }
            }

            return { available: false };
        } else {
            // Stable branch: use the default updater (points to /releases/latest/)
            const update = await check();

            if (update) {
                return {
                    available: true,
                    version: update.version,
                    notes: update.body ?? undefined,
                    date: update.date ?? undefined,
                    update,
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
