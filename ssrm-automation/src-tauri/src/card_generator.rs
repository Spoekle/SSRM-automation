use serde::{Deserialize, Serialize};
use image::{Rgba, RgbaImage, DynamicImage, ImageFormat, GenericImageView};
use imageproc::drawing::{draw_filled_rect_mut};
use imageproc::rect::Rect;
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarRating {
    #[serde(rename = "ES")]
    pub es: String,
    #[serde(rename = "NOR")]
    pub nor: String,
    #[serde(rename = "HARD")]
    pub hard: String,
    #[serde(rename = "EX")]
    pub ex: String,
    #[serde(rename = "EXP")]
    pub exp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MapMetadata {
    #[serde(rename = "songAuthorName")]
    pub song_author_name: String,
    #[serde(rename = "songName")]
    pub song_name: String,
    #[serde(rename = "songSubName")]
    pub song_sub_name: String,
    #[serde(rename = "levelAuthorName")]
    pub level_author_name: String,
    pub duration: u32,
    pub bpm: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MapVersion {
    #[serde(rename = "coverURL")]
    pub cover_url: String,
    pub hash: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MapInfo {
    pub metadata: MapMetadata,
    pub id: String,
    pub versions: Vec<MapVersion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardComponentConfig {
    #[serde(rename = "type")]
    pub component_type: String, // 'text' | 'image' | 'roundedRect' | 'starRating'
    pub x: f32,
    pub y: f32,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub text: Option<String>,
    pub font: Option<String>,
    #[serde(rename = "fillStyle")]
    pub fill_style: Option<String>,
    #[serde(rename = "maxWidth")]
    pub max_width: Option<f32>,
    #[serde(rename = "textAlign")]
    pub text_align: Option<String>,
    #[serde(rename = "cornerRadius")]
    pub corner_radius: Option<f32>,
    pub shadow: Option<ShadowConfig>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "srcField")]
    pub src_field: Option<String>,
    pub clip: Option<bool>,
    pub ratings: Option<Vec<RatingConfig>>,
    #[serde(rename = "defaultWidth")]
    pub default_width: Option<f32>,
    #[serde(rename = "specialWidth")]
    pub special_width: Option<f32>,
    #[serde(rename = "defaultSpacing")]
    pub default_spacing: Option<f32>,
    #[serde(rename = "specialSpacing")]
    pub special_spacing: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShadowConfig {
    pub color: String,
    #[serde(rename = "offsetX")]
    pub offset_x: f32,
    #[serde(rename = "offsetY")]
    pub offset_y: f32,
    pub blur: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RatingConfig {
    pub label: String,
    pub rating: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardBackgroundConfig {
    #[serde(rename = "type")]
    pub background_type: String, // 'color' | 'gradient' | 'cover'
    pub color: Option<String>,
    #[serde(rename = "srcField")]
    pub src_field: Option<String>,
    pub blur: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardConfig {
    pub width: u32,
    pub height: u32,
    #[serde(rename = "cardCornerRadius")]
    pub card_corner_radius: f32,
    pub background: CardBackgroundConfig,
    pub components: Vec<CardComponentConfig>,
    #[serde(rename = "configName")]
    pub config_name: Option<String>,
}

// Simple text placeholder function - for production, implement proper text rendering
fn draw_simple_text(_img: &mut RgbaImage, _text: &str, _x: u32, _y: u32, _color: Rgba<u8>) {
    // For now, we'll skip text rendering to focus on the image layout
    // In production, you'd use a proper text rendering library or service
    // This is a placeholder that doesn't actually render text
}

pub fn format_duration(seconds: u32) -> String {
    let mins = seconds / 60;
    let secs = seconds % 60;
    format!("{}:{:02}", mins, secs)
}

pub fn _truncate_text(text: &str, max_chars: usize) -> String {
    if text.len() <= max_chars {
        text.to_string()
    } else {
        format!("{}…", &text[..max_chars.saturating_sub(1)])
    }
}

pub async fn load_image_from_url(url: &str) -> Result<DynamicImage, Box<dyn std::error::Error>> {
    let response = reqwest::get(url).await?;
    let bytes = response.bytes().await?;
    let img = image::load_from_memory(&bytes)?;
    Ok(img)
}

pub fn hex_to_rgba(hex: &str) -> Rgba<u8> {
    let hex = hex.trim_start_matches('#');
    if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
        Rgba([r, g, b, 255])
    } else if hex.len() == 8 {
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
        let a = u8::from_str_radix(&hex[6..8], 16).unwrap_or(255);
        Rgba([r, g, b, a])
    } else {
        Rgba([0, 0, 0, 255]) // Default to black
    }
}

pub fn parse_rgb_color(color_str: &str) -> Rgba<u8> {
    if color_str.starts_with('#') {
        return hex_to_rgba(color_str);
    }
    
    // Parse rgb() or rgba() format
    if color_str.starts_with("rgb") {
        let values: Vec<&str> = color_str
            .trim_start_matches("rgb(")
            .trim_start_matches("rgba(")
            .trim_end_matches(')')
            .split(',')
            .map(|s| s.trim())
            .collect();
        
        if values.len() >= 3 {
            let r = values[0].parse::<u8>().unwrap_or(0);
            let g = values[1].parse::<u8>().unwrap_or(0);
            let b = values[2].parse::<u8>().unwrap_or(0);
            let a = if values.len() >= 4 {
                (values[3].parse::<f32>().unwrap_or(1.0) * 255.0) as u8
            } else {
                255
            };
            return Rgba([r, g, b, a]);
        }
    }
    
    // Default color mappings
    match color_str.to_lowercase().as_str() {
        "white" => Rgba([255, 255, 255, 255]),
        "black" => Rgba([0, 0, 0, 255]),
        "red" => Rgba([255, 0, 0, 255]),
        "green" => Rgba([0, 255, 0, 255]),
        "blue" => Rgba([0, 0, 255, 255]),
        "transparent" => Rgba([0, 0, 0, 0]),
        _ => Rgba([0, 0, 0, 255]), // Default to black
    }
}

pub fn apply_blur(img: &mut RgbaImage, radius: f32) {
    // Simple box blur implementation
    let (width, height) = img.dimensions();
    let radius = radius as u32;
    
    if radius == 0 {
        return;
    }
    
    // This is a simplified blur - for production, you might want to use a proper Gaussian blur
    let mut temp_img = img.clone();
    
    for y in 0..height {
        for x in 0..width {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut a_sum = 0u32;
            let mut count = 0u32;
            
            for dy in -(radius as i32)..=(radius as i32) {
                for dx in -(radius as i32)..=(radius as i32) {
                    let nx = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                    let ny = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;
                    
                    let pixel = img.get_pixel(nx, ny);
                    r_sum += pixel[0] as u32;
                    g_sum += pixel[1] as u32;
                    b_sum += pixel[2] as u32;
                    a_sum += pixel[3] as u32;
                    count += 1;
                }
            }
            
            temp_img.put_pixel(x, y, Rgba([
                (r_sum / count) as u8,
                (g_sum / count) as u8,
                (b_sum / count) as u8,
                (a_sum / count) as u8,
            ]));
        }
    }
    
    *img = temp_img;
}

pub fn draw_rounded_rect(img: &mut RgbaImage, x: u32, y: u32, width: u32, height: u32, _radius: f32, color: Rgba<u8>) {
    // For simplicity, we'll draw a regular rectangle for now
    // A proper implementation would draw rounded corners
    let rect = Rect::at(x as i32, y as i32).of_size(width, height);
    draw_filled_rect_mut(img, rect, color);
}

pub fn resize_and_crop_to_fit(img: &DynamicImage, target_width: u32, target_height: u32) -> DynamicImage {
    let (orig_width, orig_height) = img.dimensions();
    let target_ratio = target_width as f32 / target_height as f32;
    let orig_ratio = orig_width as f32 / orig_height as f32;
    
    if orig_ratio > target_ratio {
        // Image is wider, crop width
        let new_width = (orig_height as f32 * target_ratio) as u32;
        let x_offset = (orig_width - new_width) / 2;
        img.crop_imm(x_offset, 0, new_width, orig_height)
           .resize_exact(target_width, target_height, image::imageops::FilterType::Lanczos3)
    } else {
        // Image is taller, crop height
        let new_height = (orig_width as f32 / target_ratio) as u32;
        let y_offset = (orig_height - new_height) / 2;
        img.crop_imm(0, y_offset, orig_width, new_height)
           .resize_exact(target_width, target_height, image::imageops::FilterType::Lanczos3)
    }
}

pub async fn generate_card(
    data: MapInfo,
    star_ratings: StarRating,
    use_background: bool,
) -> Result<String, Box<dyn std::error::Error>> {
    let mut img = RgbaImage::new(900, 300);
    
    // Load cover image
    let cover_img = load_image_from_url(&data.versions[0].cover_url).await?;
    
    // Draw background if enabled
    if use_background {
        let mut bg_img = cover_img.clone().into_rgba8();
        apply_blur(&mut bg_img, 10.0);
        let bg_resized = DynamicImage::ImageRgba8(bg_img).resize_exact(900, 300, image::imageops::FilterType::Lanczos3);
        image::imageops::overlay(&mut img, &bg_resized.to_rgba8(), 0, 0);
    }
    
    // Draw cover image (260x260 at position 20,20)
    let cover_resized = resize_and_crop_to_fit(&cover_img, 260, 260);
    image::imageops::overlay(&mut img, &cover_resized.to_rgba8(), 20, 20);
    
    // Draw semi-transparent background for text (580x180 at position 300,20)
    draw_rounded_rect(&mut img, 300, 20, 580, 180, 10.0, Rgba([0, 0, 0, 51])); // 0.2 alpha * 255
    
    // For this initial implementation, we'll focus on the layout and image rendering
    // Text rendering can be added later using a proper text rendering library
    let white = Rgba([255, 255, 255, 255]);
    
    // Placeholder for text elements (positions where text would be rendered)
    draw_simple_text(&mut img, &data.metadata.song_author_name, 320, 35, white);
    draw_simple_text(&mut img, &data.metadata.song_name, 320, 70, white);
    draw_simple_text(&mut img, &data.metadata.song_sub_name, 320, 100, white);
    draw_simple_text(&mut img, &format!("Mapped by {}", data.metadata.level_author_name), 320, 160, white);
    
    // Right-aligned info (placeholder positions)
    draw_simple_text(&mut img, "Map Code:", 730, 35, white);
    draw_simple_text(&mut img, &data.id, 730, 55, white);
    draw_simple_text(&mut img, "BPM:", 730, 85, white);
    draw_simple_text(&mut img, &format!("{}", data.metadata.bpm), 730, 110, white);
    draw_simple_text(&mut img, "Duration:", 730, 140, white);
    draw_simple_text(&mut img, &format_duration(data.metadata.duration), 730, 160, white);
    
    // Draw star ratings
    let ratings = vec![
        (&star_ratings.es, "rgb(22 163 74)"),   // green
        (&star_ratings.nor, "rgb(59 130 246)"), // blue
        (&star_ratings.hard, "rgb(249 115 22)"), // orange
        (&star_ratings.ex, "rgb(220 38 38)"),   // red
        (&star_ratings.exp, "rgb(126 34 206)"), // purple
    ];
    
    let mut x = 300;
    for (rating, color_str) in ratings {
        if !rating.is_empty() {
            let is_special = rating == "Unranked" || rating == "Qualified";
            let width = if is_special { 120 } else { 100 };
            
            let color = parse_rgb_color(color_str);
            draw_rounded_rect(&mut img, x, 220, width, 50, 10.0, color);
            
            // Draw star rating text (placeholder)
            let rating_text = if is_special {
                rating.clone()
            } else {
                format!("{} ★", rating)
            };
            
            draw_simple_text(&mut img, &rating_text, x + 10, 235, white);
            
            x += if is_special { 130 } else { 110 };
        }
    }
    
    // Convert to base64
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    img.write_to(&mut cursor, ImageFormat::Png)?;
    
    let base64_string = general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64_string))
}

pub async fn generate_reweight_card(
    data: MapInfo,
    old_star_ratings: StarRating,
    new_star_ratings: StarRating,
    chosen_diff: String,
) -> Result<String, Box<dyn std::error::Error>> {
    let mut img = RgbaImage::new(800, 270);
    
    // Load cover image
    let cover_img = load_image_from_url(&data.versions[0].cover_url).await?;
    let cover_resized = resize_and_crop_to_fit(&cover_img, 230, 230);
    image::imageops::overlay(&mut img, &cover_resized.to_rgba8(), 20, 20);
    
    // Draw semi-transparent background for text
    draw_rounded_rect(&mut img, 270, 20, 480, 230, 10.0, Rgba([0, 0, 0, 51]));
    
    let white = Rgba([255, 255, 255, 255]);
    
    // Draw metadata text (simplified placeholders)
    draw_simple_text(&mut img, &data.metadata.song_author_name, 290, 35, white);
    draw_simple_text(&mut img, &data.metadata.song_name, 290, 70, white);
    draw_simple_text(&mut img, &data.metadata.song_sub_name, 290, 100, white);
    draw_simple_text(&mut img, &format!("Mapped by {}", data.metadata.level_author_name), 290, 130, white);
    
    // Right-aligned info
    draw_simple_text(&mut img, "Map Code:", 630, 35, white);
    draw_simple_text(&mut img, &data.id, 630, 55, white);
    
    // Draw reweight comparison
    let old_rating = match chosen_diff.as_str() {
        "ES" => &old_star_ratings.es,
        "NOR" => &old_star_ratings.nor,
        "HARD" => &old_star_ratings.hard,
        "EX" => &old_star_ratings.ex,
        "EXP" => &old_star_ratings.exp,
        _ => "",
    };
    
    let new_rating = match chosen_diff.as_str() {
        "ES" => &new_star_ratings.es,
        "NOR" => &new_star_ratings.nor,
        "HARD" => &new_star_ratings.hard,
        "EX" => &new_star_ratings.ex,
        "EXP" => &new_star_ratings.exp,
        _ => "",
    };
    
    // Draw old and new ratings side by side
    let comparison_text = format!("{}: {} → {}", chosen_diff, old_rating, new_rating);
    draw_simple_text(&mut img, &comparison_text, 290, 180, white);
    
    // Convert to base64
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    img.write_to(&mut cursor, ImageFormat::Png)?;
    
    let base64_string = general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64_string))
}

pub async fn generate_thumbnail(
    data: MapInfo,
    _chosen_diff: String,
    _star_ratings: StarRating,
    background_url: String,
) -> Result<String, Box<dyn std::error::Error>> {
    let mut img = RgbaImage::new(1920, 1080);
    
    // Create gradient background
    for y in 0..1080 {
        for x in 0..1920 {
            let progress = (x as f32 / 1920.0 + y as f32 / 1080.0) / 2.0;
            let r = (255.0 * (1.0 - progress)) as u8;
            let g = 0;
            let b = (255.0 * progress) as u8;
            img.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
    
    // Load and draw background image with blur
    let background_img = if !background_url.is_empty() {
        load_image_from_url(&background_url).await.unwrap_or_else(|_| {
            // Fallback to cover image
            DynamicImage::new_rgba8(1, 1) // Minimal fallback
        })
    } else {
        load_image_from_url(&data.versions[0].cover_url).await?
    };
    
    let mut bg_resized = background_img.resize_exact(1920, 1080, image::imageops::FilterType::Lanczos3).to_rgba8();
    apply_blur(&mut bg_resized, 10.0);
    image::imageops::overlay(&mut img, &bg_resized, 0, 0);
    
    // Draw dark overlay
    draw_rounded_rect(&mut img, 20, 20, 620, 1040, 50.0, Rgba([20, 20, 20, 255]));
    
    // Draw cover image
    let cover_img = load_image_from_url(&data.versions[0].cover_url).await?;
    let cover_resized = resize_and_crop_to_fit(&cover_img, 510, 510);
    image::imageops::overlay(&mut img, &cover_resized.to_rgba8(), 75, 495);
    
    // For thumbnail, we need to add more detailed text rendering
    // This is a simplified version - you'd want to add proper text layout
    
    // Convert to base64
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    img.write_to(&mut cursor, ImageFormat::Png)?;
    
    let base64_string = general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64_string))
}
