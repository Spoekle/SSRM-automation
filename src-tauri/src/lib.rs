// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};

mod image_gen;
#[derive(Serialize, Deserialize)]
pub struct ApiCheckResult {
    available: bool,
    message: String,
}

// Check if ScoreSaber API is available
#[tauri::command]
async fn check_scoresaber() -> Result<bool, String> {
    match reqwest::get("https://scoresaber.com/api/").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

// Fetch ScoreSaber leaderboard data by hash and difficulty
#[tauri::command]
async fn fetch_scoresaber(hash: String, difficulty: String) -> Result<serde_json::Value, String> {
    let url = format!(
        "https://scoresaber.com/api/leaderboard/by-hash/{}/info?difficulty={}",
        hash, difficulty
    );

    match reqwest::get(&url).await {
        Ok(response) => {
            if response.status().is_success() {
                response
                    .json::<serde_json::Value>()
                    .await
                    .map_err(|e| format!("Failed to parse response: {}", e))
            } else if response.status().as_u16() == 404 {
                Err("ScoreSaber data not found, difficulty may not exist".to_string())
            } else {
                Err(format!("API error: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

// Check if BeatSaver API is available
#[tauri::command]
async fn check_beatsaver() -> Result<bool, String> {
    match reqwest::get("https://api.beatsaver.com/maps/id/3d56e").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

// Fetch BeatSaver map data by hash
#[tauri::command]
async fn fetch_beatsaver(hash: String) -> Result<serde_json::Value, String> {
    let url = format!("https://api.beatsaver.com/maps/hash/{}", hash);

    match reqwest::get(&url).await {
        Ok(response) => {
            if response.status().is_success() {
                response
                    .json::<serde_json::Value>()
                    .await
                    .map_err(|e| format!("Failed to parse response: {}", e))
            } else {
                Err(format!("BeatSaver API error: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Request failed: {}", e)),
    }
}

// Load fonts (stub for now - returns success)
#[tauri::command]
async fn load_fonts() -> Result<i32, String> {
    Ok(1)
}

// Splash complete handler
#[tauri::command]
async fn splash_complete() -> Result<bool, String> {
    Ok(true)
}

// Open the bundled fonts folder in file explorer
#[tauri::command]
async fn open_fonts_folder(app_handle: tauri::AppHandle) -> Result<bool, String> {
    use std::process::Command;

    // Get the resource directory where fonts are bundled
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    let fonts_path = resource_path.join("fonts");

    // Check if the fonts directory exists
    if !fonts_path.exists() {
        return Err("Fonts folder not found. It may not be bundled in this build.".to_string());
    }

    // Open the folder in file explorer (Windows)
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(fonts_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    // macOS
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(fonts_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    // Linux
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(fonts_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(true)
}

// Install fonts to the system
#[tauri::command]
async fn install_fonts(app_handle: tauri::AppHandle) -> Result<bool, String> {
    use std::fs;

    println!("[FontInstall] Starting font installation...");

    // Try to find fonts in multiple locations (dev vs release)
    let fonts_path = {
        // First try resource directory (release builds)
        let resource_path = app_handle
            .path()
            .resource_dir()
            .ok()
            .map(|p| p.join("fonts"));

        println!("[FontInstall] Resource path: {:?}", resource_path);

        if resource_path.as_ref().map_or(false, |p| p.exists()) {
            println!("[FontInstall] Using resource directory fonts");
            resource_path.unwrap()
        } else {
            // In dev mode, try the src-tauri/fonts directory relative to exe
            let exe_path =
                std::env::current_exe().map_err(|e| format!("Failed to get exe path: {}", e))?;

            println!("[FontInstall] Exe path: {:?}", exe_path);

            // Try multiple parent levels to find src-tauri
            let mut dev_fonts: Option<std::path::PathBuf> = None;
            let mut current = exe_path.as_path();

            for _ in 0..5 {
                if let Some(parent) = current.parent() {
                    let candidate = parent.join("fonts");
                    println!("[FontInstall] Checking: {:?}", candidate);
                    if candidate.exists() {
                        dev_fonts = Some(candidate);
                        break;
                    }
                    current = parent;
                } else {
                    break;
                }
            }

            if let Some(fonts) = dev_fonts {
                println!("[FontInstall] Using dev fonts at: {:?}", fonts);
                fonts
            } else {
                let err_msg = format!(
                    "Fonts folder not found. Checked resource dir and parent directories of {:?}",
                    exe_path
                );
                println!("[FontInstall] Error: {}", err_msg);
                return Err(err_msg);
            }
        }
    };

    println!("[FontInstall] Final fonts path: {:?}", fonts_path);

    if !fonts_path.exists() {
        return Err(format!("Fonts folder not found at: {:?}", fonts_path));
    }

    // Collect all font files
    let mut font_files: Vec<std::path::PathBuf> = Vec::new();

    // Add Torus Pro fonts
    let torus_path = fonts_path.join("Torus.Pro");
    if torus_path.exists() {
        if let Ok(entries) = fs::read_dir(&torus_path) {
            for entry in entries.flatten() {
                if entry
                    .path()
                    .extension()
                    .map_or(false, |ext| ext == "ttf" || ext == "otf")
                {
                    font_files.push(entry.path());
                }
            }
        }
    }

    // Add Aller font
    let aller_path = fonts_path.join("Aller_It.ttf");
    if aller_path.exists() {
        font_files.push(aller_path);
    }

    let total_fonts = font_files.len();
    if total_fonts == 0 {
        return Err("No font files found to install.".to_string());
    }

    // Get Windows Fonts directory
    #[cfg(target_os = "windows")]
    let fonts_dir = {
        let local_app_data =
            std::env::var("LOCALAPPDATA").map_err(|_| "Failed to get LOCALAPPDATA")?;
        std::path::PathBuf::from(local_app_data)
            .join("Microsoft")
            .join("Windows")
            .join("Fonts")
    };

    #[cfg(not(target_os = "windows"))]
    let fonts_dir = {
        let home = std::env::var("HOME").map_err(|_| "Failed to get HOME")?;
        std::path::PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("fonts")
    };

    // Create fonts directory if it doesn't exist
    fs::create_dir_all(&fonts_dir)
        .map_err(|e| format!("Failed to create fonts directory: {}", e))?;

    let mut installed = 0;
    let mut errors: Vec<String> = Vec::new();

    for font_path in &font_files {
        let file_name = font_path.file_name().ok_or("Invalid font file name")?;
        let dest_path = fonts_dir.join(file_name);

        // Emit progress event
        let progress = ((installed as f32 / total_fonts as f32) * 100.0) as u32;
        let font_name = file_name.to_string_lossy().to_string();
        app_handle
            .emit(
                "font-install-progress",
                serde_json::json!({
                    "current": installed + 1,
                    "total": total_fonts,
                    "progress": progress,
                    "fontName": font_name,
                }),
            )
            .ok();

        // Copy font file
        match fs::copy(font_path, &dest_path) {
            Ok(_) => installed += 1,
            Err(e) => errors.push(format!("{}: {}", font_name, e)),
        }
    }

    // Final progress event
    app_handle
        .emit(
            "font-install-progress",
            serde_json::json!({
                "current": total_fonts,
                "total": total_fonts,
                "progress": 100,
                "fontName": "Complete",
                "done": true,
                "installed": installed,
                "errors": errors.len(),
            }),
        )
        .ok();

    if installed == 0 {
        return Err(format!(
            "Failed to install any fonts. Errors: {}",
            errors.join(", ")
        ));
    }

    Ok(true)
}

// Check if FFmpeg is installed
#[tauri::command]
async fn check_ffmpeg() -> Result<bool, String> {
    use std::process::Command;

    let result = Command::new("ffmpeg").arg("-version").output();

    match result {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

// Install FFmpeg using platform-specific package manager
#[tauri::command]
async fn install_ffmpeg(app_handle: tauri::AppHandle) -> Result<bool, String> {
    use std::process::Command;

    let _ = app_handle.emit(
        "ffmpeg-install-progress",
        "Beginning FFmpeg installation...",
    );

    #[cfg(target_os = "windows")]
    {
        let _ = app_handle.emit(
            "ffmpeg-install-progress",
            "Platform: Windows. Using Chocolatey...",
        );

        // Check if chocolatey is installed, if not install it first
        let choco_check = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Get-Command choco -ErrorAction SilentlyContinue",
            ])
            .output();

        let has_choco = choco_check.map(|o| o.status.success()).unwrap_or(false);

        if !has_choco {
            let _ = app_handle.emit(
                "ffmpeg-install-progress",
                "Chocolatey not found. Installing Chocolatey first...",
            );

            let install_choco = Command::new("powershell")
                .args([
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-Command",
                    "Start-Process powershell -Verb runAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"iex ((New-Object System.Net.WebClient).DownloadString(''https://community.chocolatey.org/install.ps1''))\"'"
                ])
                .output();

            if install_choco.is_err() {
                return Err("Failed to install Chocolatey".to_string());
            }
            let _ = app_handle.emit("ffmpeg-install-progress", "Chocolatey installed.");
        }

        let _ = app_handle.emit(
            "ffmpeg-install-progress",
            "Installing FFmpeg via Chocolatey...",
        );

        let result = Command::new("powershell")
            .args([
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-Command",
                "Start-Process powershell -Verb runAs -Wait -ArgumentList '-NoProfile -Command \"choco install ffmpeg -y\"'"
            ])
            .output();

        match result {
            Ok(output) if output.status.success() => {
                let _ = app_handle.emit(
                    "ffmpeg-install-progress",
                    "FFmpeg installation completed successfully.",
                );
                Ok(true)
            }
            _ => Err("FFmpeg installation failed".to_string()),
        }
    }

    #[cfg(target_os = "macos")]
    {
        let _ = app_handle.emit(
            "ffmpeg-install-progress",
            "Platform: macOS. Using Homebrew...",
        );

        let result = Command::new("brew").args(["install", "ffmpeg"]).output();

        match result {
            Ok(output) if output.status.success() => {
                let _ = app_handle.emit(
                    "ffmpeg-install-progress",
                    "FFmpeg installation completed successfully.",
                );
                Ok(true)
            }
            _ => Err("FFmpeg installation failed. Make sure Homebrew is installed.".to_string()),
        }
    }

    #[cfg(target_os = "linux")]
    {
        let _ = app_handle.emit("ffmpeg-install-progress", "Platform: Linux. Using apt...");

        let result = Command::new("bash")
            .args([
                "-c",
                "sudo apt-get update && sudo apt-get install -y ffmpeg",
            ])
            .output();

        match result {
            Ok(output) if output.status.success() => {
                let _ = app_handle.emit(
                    "ffmpeg-install-progress",
                    "FFmpeg installation completed successfully.",
                );
                Ok(true)
            }
            _ => Err("FFmpeg installation failed".to_string()),
        }
    }
}

// Reinstall FFmpeg (same as install)
#[tauri::command]
async fn reinstall_ffmpeg(app_handle: tauri::AppHandle) -> Result<bool, String> {
    install_ffmpeg(app_handle).await
}

// Force check update - placeholder
#[tauri::command]
async fn force_check_update() -> Result<bool, String> {
    Ok(true)
}

// Update application - placeholder
#[tauri::command]
async fn update_application() -> Result<String, String> {
    Err("Update not yet implemented in Tauri version".to_string())
}

// Generate a thumbnail from video data by extracting a frame using FFmpeg
// Accepts base64-encoded video data, saves to temp, extracts frame, returns base64 image
// Generate a thumbnail from video data by extracting a frame using FFmpeg
// Accepts base64-encoded video data OR a direct file path
#[tauri::command]
async fn generate_video_thumbnail(
    video_data: Option<String>,
    video_path: Option<String>,
) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::process::Command;

    println!(
        "[Debugging IPC] Received args: video_data is_some={}, video_path={:?}",
        video_data.is_some(),
        video_path
    );

    // Create temp files
    let temp_dir = std::env::temp_dir();
    let temp_input_path = temp_dir.join("ssrm_video_input.mp4");
    let output_path = temp_dir.join("ssrm_video_frame.png");

    let input_path: PathBuf;
    let cleanup_input: bool;

    if let Some(path_str) = video_path {
        // Use provided path
        let path = Path::new(&path_str);
        if !path.exists() {
            return Err(format!("Video file not found at path: {}", path_str));
        }
        input_path = path.to_path_buf();
        cleanup_input = false;
        println!("[VideoThumbnail] Using direct file path: {:?}", input_path);
    } else if let Some(data) = video_data {
        println!("[VideoThumbnail] Processing base64 video data");
        // Decode base64 video data and save to temp file
        let base64_data = if data.starts_with("data:") {
            // Extract base64 part from data URL
            if let Some(comma_pos) = data.find(',') {
                let data_part = &data[comma_pos + 1..];
                data_part.to_string()
            } else {
                return Err("Invalid video data URL format - no comma found".to_string());
            }
        } else {
            data
        };

        // Clean up the base64 string
        let cleaned_base64: String = base64_data
            .chars()
            .filter(|c| !c.is_whitespace())
            .map(|c| match c {
                '-' => '+', // URL-safe to standard
                '_' => '/', // URL-safe to standard
                other => other,
            })
            .collect();

        // Pad if necessary
        let padded_base64 = if cleaned_base64.is_empty() {
            return Err("Base64 data is empty".to_string());
        } else {
            let remainder = cleaned_base64.len() % 4;
            if remainder == 0 {
                cleaned_base64
            } else {
                format!("{}{}", cleaned_base64, "=".repeat(4 - remainder))
            }
        };

        let video_bytes = BASE64
            .decode(&padded_base64)
            .map_err(|e| format!("Failed to decode video base64: {}", e))?;

        fs::write(&temp_input_path, &video_bytes)
            .map_err(|e| format!("Failed to write video to temp file: {}", e))?;

        input_path = temp_input_path;
        cleanup_input = true;
        println!("[VideoThumbnail] Wrote temp video file: {:?}", input_path);
    } else {
        return Err("No video data or video path provided".to_string());
    }

    // Check FFmpeg exists
    let ffmpeg_check = Command::new("ffmpeg").arg("-version").output();

    if ffmpeg_check.is_err() {
        if cleanup_input {
            let _ = fs::remove_file(&input_path);
        }
        return Err("FFmpeg is not installed or not in PATH".to_string());
    }

    // Extract frame
    let timestamp_str = {
        let probe_output = Command::new("ffprobe")
            .args([
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                input_path.to_str().unwrap(),
            ])
            .output();

        match probe_output {
            Ok(output) if output.status.success() => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(duration) = output_str.trim().parse::<f64>() {
                    if duration > 10.0 {
                        use std::time::{SystemTime, UNIX_EPOCH};
                        let nanos = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .map(|d| d.as_nanos())
                            .unwrap_or(0);
                        // Simple pseudo-random between 0.0 and 1.0
                        let random_factor = (nanos % 1000) as f64 / 1000.0;
                        let start = 10.0;
                        let end = duration - 1.0;
                        let target = if end > start {
                            start + random_factor * (end - start)
                        } else {
                            start
                        };
                        println!("[VideoThumbnail] Video duration: {:.2}s. Extracting random frame at: {:.2}s", duration, target);
                        format!("{:.2}", target)
                    } else {
                        println!("[VideoThumbnail] Video duration {:.2}s is too short for random seek. Using 1s.", duration);
                        "00:00:01".to_string()
                    }
                } else {
                    println!(
                        "[VideoThumbnail] Failed to parse duration: '{}'. Using 1s.",
                        output_str
                    );
                    "00:00:01".to_string()
                }
            }
            _ => {
                println!("[VideoThumbnail] Failed to probe video duration. Using 1s.");
                "00:00:01".to_string()
            }
        }
    };

    let result = Command::new("ffmpeg")
        .args([
            "-y",
            "-i",
            input_path.to_str().unwrap(),
            "-ss",
            &timestamp_str,
            "-vframes",
            "1",
            "-f",
            "image2",
            output_path.to_str().unwrap(),
        ])
        .output()
        .map_err(|e| format!("Failed to run FFmpeg: {}", e))?;

    // Clean up input file if it was temporary
    if cleanup_input {
        let _ = fs::remove_file(&input_path);
    }

    if !result.status.success() {
        let stderr = String::from_utf8_lossy(&result.stderr);
        return Err(format!("FFmpeg failed: {}", stderr));
    }

    // Read the output file and convert to base64
    let image_bytes =
        fs::read(&output_path).map_err(|e| format!("Failed to read output image: {}", e))?;

    // Clean up output file
    let _ = fs::remove_file(&output_path);

    // Return as data URL
    let base64_data = BASE64.encode(&image_bytes);
    Ok(format!("data:image/png;base64,{}", base64_data))
}

// Read an image file from disk and return as base64 data URL
#[tauri::command]
async fn read_image_as_base64(image_path: String) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
    use std::fs;
    use std::path::Path;

    let path = Path::new(&image_path);

    if !path.exists() {
        return Err(format!("Image file not found: {}", image_path));
    }

    // Read the file
    let image_bytes = fs::read(path).map_err(|e| format!("Failed to read image file: {}", e))?;

    // Determine MIME type from extension
    let mime_type = match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("bmp") => "image/bmp",
        _ => "image/png", // Default to PNG
    };

    // Return as data URL
    let base64_data = BASE64.encode(&image_bytes);
    Ok(format!("data:{};base64,{}", mime_type, base64_data))
}

// Generate batch thumbnail
#[tauri::command]
async fn generate_batch_thumbnail(background_url: String, month: String) -> Result<String, String> {
    image_gen::generate_batch_thumbnail(&background_url, &month).await
}

// Generate SSRM thumbnail
#[tauri::command]
async fn generate_ssrm_thumbnail(
    map_data: serde_json::Value,
    chosen_diff: String,
    star_ratings: serde_json::Value,
    background_image: String,
) -> Result<String, String> {
    let map_info: image_gen::SsrmMapInfo =
        serde_json::from_value(map_data).map_err(|e| format!("Failed to parse map data: {}", e))?;
    let ratings: image_gen::SsrmStarRating = serde_json::from_value(star_ratings)
        .map_err(|e| format!("Failed to parse star ratings: {}", e))?;
    image_gen::generate_ssrm_thumbnail(&map_info, &chosen_diff, &ratings, &background_image).await
}

// Generate playlist thumbnail
#[tauri::command]
async fn generate_playlist_thumbnail(
    background_url: String,
    month: String,
) -> Result<String, String> {
    image_gen::generate_playlist_thumbnail(&background_url, &month).await
}

// Generate card
#[tauri::command]
async fn generate_card(
    map_data: serde_json::Value,
    star_ratings: serde_json::Value,
    use_background: bool,
) -> Result<String, String> {
    let map_info: image_gen::MapInfo =
        serde_json::from_value(map_data).map_err(|e| format!("Failed to parse map data: {}", e))?;
    let ratings: image_gen::StarRating = serde_json::from_value(star_ratings)
        .map_err(|e| format!("Failed to parse star ratings: {}", e))?;
    image_gen::generate_card(&map_info, &ratings, use_background).await
}

// Generate reweight card - placeholder
#[tauri::command]
async fn generate_reweight_card(
    map_data: serde_json::Value,
    old_star_ratings: serde_json::Value,
    new_star_ratings: serde_json::Value,
    chosen_diff: String,
) -> Result<String, String> {
    let map_info: image_gen::ReweightMapInfo =
        serde_json::from_value(map_data).map_err(|e| format!("Failed to parse map data: {}", e))?;
    let old_ratings: image_gen::OldStarRatings = serde_json::from_value(old_star_ratings)
        .map_err(|e| format!("Failed to parse old star ratings: {}", e))?;
    let new_ratings: image_gen::NewStarRatings = serde_json::from_value(new_star_ratings)
        .map_err(|e| format!("Failed to parse new star ratings: {}", e))?;
    image_gen::generate_reweight_card(&map_info, &old_ratings, &new_ratings, &chosen_diff).await
}

// Save file to disk
#[tauri::command]
async fn save_file(path: String, data_base64: String) -> Result<bool, String> {
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
    use std::fs;

    println!("[save_file] Saving to: {}", path);
    println!("[save_file] Data length: {}", data_base64.len());

    // Clean up base64 string
    let cleaned_base64 = if data_base64.starts_with("data:") {
        if let Some(comma_pos) = data_base64.find(',') {
            &data_base64[comma_pos + 1..]
        } else {
            return Err("Invalid data URL".to_string());
        }
    } else {
        &data_base64
    };

    let bytes = BASE64
        .decode(cleaned_base64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    fs::write(&path, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_scoresaber,
            fetch_scoresaber,
            check_beatsaver,
            fetch_beatsaver,
            load_fonts,
            splash_complete,
            open_fonts_folder,
            install_fonts,
            check_ffmpeg,
            install_ffmpeg,
            reinstall_ffmpeg,
            force_check_update,
            update_application,
            generate_video_thumbnail,
            read_image_as_base64,
            generate_batch_thumbnail,
            generate_ssrm_thumbnail,
            generate_playlist_thumbnail,
            generate_card,
            generate_reweight_card,
            save_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
