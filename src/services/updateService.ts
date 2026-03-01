import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';

import { compareVersions } from '../helpers/versionHelpers';

const GITHUB_RELEASES_URL =
    'https://api.github.com/repos/Spoekle/SSRM-automation/releases';


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

function isDevBranch(): boolean {
    return localStorage.getItem('useDevelopmentBranch') === 'true';
}

function isBetaVersion(version: string): boolean {
    const lower = version.toLowerCase();
    return lower.includes('-alpha') || lower.includes('-beta') || lower.includes('-rc');
}

async function getCurrentVersion(): Promise<string> {
    try {
        return await getVersion();
    } catch {
        return '0.0.0';
    }
}

function normalizeVersion(version: string): string {
    const clean = version.replace(/^v/, '');
    const match = clean.match(/^(\d+\.\d+\.\d+)-(\d+)$/);
    if (match) {
        return `${match[1]}-beta.${match[2]}`;
    }
    return clean;
}

function getAssetMatcher(): (name: string) => boolean {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) {
        return (name: string) => name.endsWith('_x64-setup.exe') && !name.endsWith('.sig');
    } else if (ua.includes('mac') || ua.includes('darwin')) {
        return (name: string) => name.endsWith('_universal.dmg') && !name.endsWith('.sig');
    } else if (ua.includes('linux')) {
        return (name: string) => name.endsWith('_amd64.AppImage') && !name.endsWith('.sig');
    }
    console.warn('[UpdateService] Unknown platform, falling back to exe');
    return (name: string) => name.endsWith('.exe') && !name.endsWith('.sig');
}

async function fetchTargetRelease(useDevChannel: boolean): Promise<GitHubRelease | null> {
    const response = await fetch(GITHUB_RELEASES_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const releases: GitHubRelease[] = await response.json();

    if (useDevChannel) {
        return releases[0] ?? null;
    }

    return releases.find((r) => !isBetaVersion(r.tag_name)) ?? null;
}

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

        const normalizedRelease = normalizeVersion(releaseVersion);
        const normalizedCurrent = normalizeVersion(currentVersion);

        console.log(
            `[UpdateService] Found release: ${releaseVersion} (beta: ${updateIsBeta}), comparing ${normalizedCurrent} vs ${normalizedRelease}`
        );

        if (compareVersions(normalizedRelease, normalizedCurrent) <= 0) {
            console.log(
                `[UpdateService] Release ${normalizedRelease} is not newer than current ${normalizedCurrent}`
            );
            return { available: false };
        }

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

        await invoke('download_and_run_update', {
            downloadUrl: release.downloadUrl,
        });

        onProgress?.({ event: 'Finished', downloaded: 100, contentLength: 100 });
        console.log('[UpdateService] Update downloaded and installer launched');
    } catch (error) {
        console.error('[UpdateService] Error installing update:', error);
        throw error;
    }
}

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
