use std::path::Path;
use std::process::Command;
use serde::{Deserialize, Serialize};
use tempfile::NamedTempFile;
use base64::{Engine as _, engine::general_purpose};

mod card_generator;

use card_generator::{MapInfo, StarRating, generate_card, generate_reweight_card, generate_thumbnail};

#[derive(Debug, Serialize, Deserialize)]
struct ScoreSaberResponse {
    #[serde(flatten)]
    data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct BeatSaverResponse {
    #[serde(flatten)]
    data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct ThumbnailResponse {
    thumbnail: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    prerelease: bool,
    assets: Vec<GitHubAsset>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GitHubAsset {
    name: String,
    browser_download_url: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn check_scoresaber() -> Result<bool, String> {
    let client = reqwest::Client::new();
    match client
        .get("https://scoresaber.com/api/")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn check_beatsaver() -> Result<bool, String> {
    let client = reqwest::Client::new();
    match client
        .get("https://api.beatsaver.com/maps/id/3d56e")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn check_ffmpeg() -> Result<bool, String> {
    let output = Command::new("ffmpeg")
        .arg("-version")
        .output();
    
    match output {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn get_scoresaber_data(hash: &str, difficulty: &str) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://scoresaber.com/api/leaderboard/by-hash/{}/info?difficulty={}", hash, difficulty);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status() == 404 {
                return Err("ScoreSaber data not found, diff does not exist probably!".to_string());
            }
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => Ok(data),
                    Err(e) => Err(format!("Failed to parse ScoreSaber response: {}", e)),
                }
            } else {
                Err("Failed to fetch data from ScoreSaber API".to_string())
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[tauri::command]
async fn get_beatsaver_data(hash: &str) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("https://api.beatsaver.com/maps/hash/{}", hash);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => Ok(data),
                    Err(e) => Err(format!("Failed to parse BeatSaver response: {}", e)),
                }
            } else {
                Err("Failed to fetch data from BeatSaver API".to_string())
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[tauri::command]
async fn generate_thumbnail_from_video(file_path: &str) -> Result<String, String> {
    // First check if ffmpeg is available
    if !check_ffmpeg().await.unwrap_or(false) {
        return Err("FFmpeg is not installed or not available".to_string());
    }

    // Get video duration using ffprobe
    let probe_output = Command::new("ffprobe")
        .args([
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            file_path
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}", e))?;

    let duration_str = String::from_utf8_lossy(&probe_output.stdout).trim().to_string();
    let duration: f64 = duration_str.parse().unwrap_or(10.0);
    let random_time = rand::random::<f64>() * duration;

    // Create temporary file for the thumbnail
    let temp_file = NamedTempFile::with_suffix(".png")
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    let temp_path = temp_file.path();

    // Extract frame using ffmpeg
    let output = Command::new("ffmpeg")
        .args([
            "-i", file_path,
            "-ss", &format!("{:.2}", random_time),
            "-vframes", "1",
            "-s", "1920x1080",
            "-y",
            temp_path.to_str().unwrap()
        ])
        .output()
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    if !output.status.success() {
        return Err(format!("FFmpeg failed: {}", String::from_utf8_lossy(&output.stderr)));
    }

    // Read the generated image and encode as base64
    let image_data = std::fs::read(temp_path)
        .map_err(|e| format!("Failed to read generated image: {}", e))?;
    
    let base64_image = general_purpose::STANDARD.encode(&image_data);
    Ok(format!("data:image/png;base64,{}", base64_image))
}

#[tauri::command]
async fn generate_thumbnail_from_image(file_path: &str) -> Result<String, String> {
    // Read the image file
    let image_data = std::fs::read(file_path)
        .map_err(|e| format!("Failed to read image file: {}", e))?;

    // Get file extension to determine MIME type
    let extension = Path::new(file_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("jpg")
        .to_lowercase();

    let mime_type = match extension.as_str() {
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        _ => "image/jpeg",
    };

    let base64_image = general_purpose::STANDARD.encode(&image_data);
    Ok(format!("data:{};base64,{}", mime_type, base64_image))
}

#[tauri::command]
async fn get_github_releases() -> Result<Vec<GitHubRelease>, String> {
    let client = reqwest::Client::new();
    
    match client
        .get("https://api.github.com/repos/Spoekle/SSRM-automation/releases")
        .header("User-Agent", "SSRM-automation")
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<GitHubRelease>>().await {
                    Ok(releases) => Ok(releases),
                    Err(e) => Err(format!("Failed to parse GitHub releases: {}", e)),
                }
            } else {
                Err("Failed to fetch GitHub releases".to_string())
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

#[tauri::command]
async fn generate_map_card(
    data: MapInfo,
    star_ratings: StarRating,
    use_background: bool,
) -> Result<String, String> {
    match generate_card(data, star_ratings, use_background).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to generate card: {}", e)),
    }
}

#[tauri::command]
async fn generate_map_reweight_card(
    data: MapInfo,
    old_star_ratings: StarRating,
    new_star_ratings: StarRating,
    chosen_diff: String,
) -> Result<String, String> {
    match generate_reweight_card(data, old_star_ratings, new_star_ratings, chosen_diff).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to generate reweight card: {}", e)),
    }
}

#[tauri::command]
async fn generate_map_thumbnail(
    data: MapInfo,
    chosen_diff: String,
    star_ratings: StarRating,
    background_url: String,
) -> Result<String, String> {
    match generate_thumbnail(data, chosen_diff, star_ratings, background_url).await {
        Ok(result) => Ok(result),
        Err(e) => Err(format!("Failed to generate thumbnail: {}", e)),
    }
}

#[tauri::command]
async fn generate_card_from_config(
    _config: serde_json::Value,
    _data: Option<serde_json::Value>,
    _star_ratings: Option<StarRating>,
    _use_background: Option<bool>,
) -> Result<String, String> {
    // For now, return a placeholder implementation
    // This would need to be implemented based on the config structure
    Err("generateCardFromConfig not yet implemented in Rust".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_scoresaber,
            check_beatsaver,
            check_ffmpeg,
            get_scoresaber_data,
            get_beatsaver_data,
            generate_thumbnail_from_video,
            generate_thumbnail_from_image,
            get_github_releases,
            generate_map_card,
            generate_map_reweight_card,
            generate_map_thumbnail,
            generate_card_from_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
