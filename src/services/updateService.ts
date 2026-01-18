/**
 * Update Service for Tauri v2
 * Uses the official @tauri-apps/plugin-updater for checking and installing updates
 * 
 * Update Channels:
 * - Stable users: only see releases without -alpha, -beta, -rc in version
 * - Dev branch users: see all releases including beta versions
 */

import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

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
    isBetaVersion?: boolean;
}

/**
 * Check if on development branch (for beta updates)
 */
function isDevBranch(): boolean {
    return localStorage.getItem('useDevelopmentBranch') === 'true';
}

/**
 * Check if a version string is a beta/prerelease version
 */
function isBetaVersion(version: string): boolean {
    const lower = version.toLowerCase();
    return lower.includes('-alpha') || lower.includes('-beta') || lower.includes('-rc');
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
 * Compare semver versions
 * Returns true if v2 is newer than v1
 */
function isNewerVersion(v1: string, v2: string): boolean {
    const clean1 = v1.replace(/^v/, '');
    const clean2 = v2.replace(/^v/, '');

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

    // Same base version - compare prerelease
    if (!prerelease2 && prerelease1) return true; // stable > prerelease
    if (prerelease2 && !prerelease1) return false; // prerelease < stable

    // Both have prerelease, compare numbers
    if (prerelease1 && prerelease2) {
        const num1 = parseInt(prerelease1.replace(/\D/g, '')) || 0;
        const num2 = parseInt(prerelease2.replace(/\D/g, '')) || 0;
        return num2 > num1;
    }

    return false;
}

/**
 * Check if an update is available
 * - Stable users: only get updates that don't have -beta/-alpha/-rc
 * - Dev branch users: get all updates including beta versions
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
    try {
        const useDevChannel = isDevBranch();
        const currentVersion = await getCurrentVersion();
        console.log(`[UpdateService] Current version: ${currentVersion}, Dev channel: ${useDevChannel}`);

        // Check for updates using the standard updater
        const update = await check();

        if (!update) {
            console.log('[UpdateService] No update available');
            return { available: false };
        }

        const updateVersion = update.version;
        const updateIsBeta = isBetaVersion(updateVersion);

        console.log(`[UpdateService] Found update: ${updateVersion} (beta: ${updateIsBeta})`);

        // Verify it's actually newer
        if (!isNewerVersion(currentVersion, updateVersion)) {
            console.log(`[UpdateService] Update ${updateVersion} is not newer than current ${currentVersion}`);
            return { available: false };
        }

        // If the update is a beta version and user is NOT on dev branch, skip it
        if (updateIsBeta && !useDevChannel) {
            console.log(`[UpdateService] Skipping beta update ${updateVersion} for stable user`);
            return { available: false };
        }

        // Update is available and appropriate for user's channel
        return {
            available: true,
            version: updateVersion,
            notes: update.body ?? undefined,
            date: update.date ?? undefined,
            update,
            isBetaVersion: updateIsBeta,
        };
    } catch (error) {
        console.error('[UpdateService] Error checking for updates:', error);
        throw error;
    }
}

/**
 * Download and install an update, then restart the application
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
