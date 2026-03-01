/**
 * Update Service for SSRM Automation
 * Uses GitHub Releases API to check for updates and downloads the correct
 * platform-specific installer from the release assets.
 *
 * Update Channels:
 * - Stable users: only see releases where the tag does NOT contain -alpha, -beta, -rc
 * - Dev branch users: see all releases including pre-release versions
 */

import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { platform } from '@tauri-apps/plugin-os';
import { compareVersions } from '../helpers/versionHelpers';

const GITHUB_RELEASES_URL =
    'https://api.github.com/repos/Spoekle/SSRM-automation/releases';

// --- Types ---

export interface UpdateProgress {
    event: 'Started' | 'Progress' | 'Finished';
    contentLength?: number;
    downloaded?: number;
    chunkLength?: number;
}

export interface ReleaseInfo {
    version: string;
    notes: string | null;
    date: string | null;
    downloadUrl: string;
    isBetaVersion: boolean;
}

export interface UpdateCheckResult {
    available: boolean;
    version?: string;
    notes?: string;
    date?: string;
    release?: ReleaseInfo;
    isBetaVersion?: boolean;
}

interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

interface GitHubRelease {
    tag_name: string;
    body: string | null;
    published_at: string | null;
    prerelease: boolean;
    assets: GitHubAsset[];
}

// --- Helpers ---

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
 * Get the current app version from Tauri
 */
async function getCurrentVersion(): Promise<string> {
    try {
        return await getVersion();
    } catch {
        return '0.0.0';
    }
}

/**
 * Determine which asset file pattern to look for based on the current OS.
 * Returns a function that matches asset names.
 */
function getAssetMatcher(): (name: string) => boolean {
    const os = platform();
    switch (os) {
        case 'windows':
            return (name: string) => name.endsWith('_x64-setup.exe') && !name.endsWith('.sig');
        case 'macos':
            return (name: string) => name.endsWith('_universal.dmg') && !name.endsWith('.sig');
        case 'linux':
            return (name: string) => name.endsWith('_amd64.AppImage') && !name.endsWith('.sig');
        default:
            console.warn(`[UpdateService] Unknown platform: ${os}, falling back to exe`);
            return (name: string) => name.endsWith('.exe') && !name.endsWith('.sig');
    }
}

/**
 * Fetch all releases from GitHub and find the appropriate one
 */
async function fetchTargetRelease(useDevChannel: boolean): Promise<GitHubRelease | null> {
    const response = await fetch(GITHUB_RELEASES_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const releases: GitHubRelease[] = await response.json();

    if (useDevChannel) {
        // Dev users get the very latest release (stable or beta), whichever is newest
        return releases[0] ?? null;
    }

    // Stable users: find first release whose tag has no prerelease suffix
    return releases.find((r) => !isBetaVersion(r.tag_name)) ?? null;
}

// --- Public API ---

/**
 * Check if an update is available.
 * - Stable users: only get updates for non-prerelease tags
 * - Dev branch users: get the latest release regardless
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
    try {
        const useDevChannel = isDevBranch();
        const currentVersion = await getCurrentVersion();
        console.log(
            `[UpdateService] Current version: ${currentVersion}, Dev channel: ${useDevChannel}`
        );

        const release = await fetchTargetRelease(useDevChannel);

        if (!release) {
            console.log('[UpdateService] No suitable release found');
            return { available: false };
        }

        const releaseVersion = release.tag_name.replace(/^v/, '');
        const updateIsBeta = isBetaVersion(releaseVersion);

        console.log(
            `[UpdateService] Found release: ${releaseVersion} (beta: ${updateIsBeta})`
        );

        // Check if the release is actually newer
        if (compareVersions(releaseVersion, currentVersion) <= 0) {
            console.log(
                `[UpdateService] Release ${releaseVersion} is not newer than current ${currentVersion}`
            );
            return { available: false };
        }

        // Find the correct asset for this platform
        const matcher = getAssetMatcher();
        const asset = release.assets.find((a) => matcher(a.name));

        if (!asset) {
            console.warn(
                `[UpdateService] No matching asset found for this platform in release ${releaseVersion}`
            );
            return { available: false };
        }

        const releaseInfo: ReleaseInfo = {
            version: releaseVersion,
            notes: release.body,
            date: release.published_at,
            downloadUrl: asset.browser_download_url,
            isBetaVersion: updateIsBeta,
        };

        return {
            available: true,
            version: releaseVersion,
            notes: release.body ?? undefined,
            date: release.published_at ?? undefined,
            release: releaseInfo,
            isBetaVersion: updateIsBeta,
        };
    } catch (error) {
        console.error('[UpdateService] Error checking for updates:', error);
        throw error;
    }
}

/**
 * Download and install an update.
 * Downloads the installer via the Rust backend and then launches it.
 */
export async function downloadAndInstallUpdate(
    release: ReleaseInfo,
    onProgress?: (progress: UpdateProgress) => void
): Promise<void> {
    try {
        onProgress?.({ event: 'Started' });
        console.log(
            `[UpdateService] Downloading update from: ${release.downloadUrl}`
        );

        onProgress?.({
            event: 'Progress',
            downloaded: 0,
            contentLength: 100,
            chunkLength: 50,
        });

        // Invoke the Rust command to download and run the installer
        await invoke('download_and_run_update', {
            downloadUrl: release.downloadUrl,
        });

        onProgress?.({ event: 'Finished', downloaded: 100, contentLength: 100 });
        console.log('[UpdateService] Update downloaded and installer launched');
        // The Rust side will exit the app after launching the installer
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

    if (result.available && result.release) {
        await downloadAndInstallUpdate(result.release, onProgress);
        return true;
    }

    return false;
}
