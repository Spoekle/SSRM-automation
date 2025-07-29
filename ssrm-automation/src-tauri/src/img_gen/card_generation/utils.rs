use image::{Rgba, RgbaImage, DynamicImage, ImageFormat, GenericImageView};
use imageproc::drawing::{draw_filled_rect_mut, draw_text_mut};
use imageproc::rect::Rect;
use ab_glyph::{FontRef, PxScale};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};
use std::sync::OnceLock;
use rayon::prelude::*;

// Global font cache to avoid repeated file loading
static FONT_CACHE: OnceLock<Option<Vec<u8>>> = OnceLock::new();

// For now, we'll use a simple implementation without external fonts
pub fn get_text_width(text: &str, font_size: f32) -> u32 {
    // Simple approximation - each character is roughly 0.6 * font_size wide
    (text.len() as f32 * font_size * 0.6) as u32
}

pub fn truncate_text_with_width(text: &str, max_width: u32, font_size: f32) -> String {
    let estimated_width = get_text_width(text, font_size);
    if estimated_width <= max_width {
        return text.to_string();
    }
    
    let ellipsis = "…";
    let ellipsis_width = get_text_width(ellipsis, font_size);
    let available_width = max_width.saturating_sub(ellipsis_width);
    
    // Estimate how many characters we can fit
    let chars_that_fit = (available_width as f32 / (font_size * 0.6)) as usize;
    if chars_that_fit == 0 {
        return ellipsis.to_string();
    }
    
    let truncated = &text[..chars_that_fit.min(text.len())];
    format!("{}{}", truncated, ellipsis)
}

pub fn format_duration(seconds: u32) -> String {
    let mins = seconds / 60;
    let secs = seconds % 60;
    format!("{}:{:02}", mins, secs)
}

pub fn truncate_text(text: &str, max_chars: usize) -> String {
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
    // Use parallel processing for blur to leverage multiple CPU cores
    let (width, height) = img.dimensions();
    let radius = radius as u32;
    
    if radius == 0 {
        return;
    }
    
    // Use separable blur with parallel processing for better performance
    let mut temp_img = img.clone();
    
    // Horizontal pass - parallel processing
    temp_img.enumerate_pixels_mut().par_bridge().for_each(|(x, y, pixel)| {
        if x >= radius && x < width - radius {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut a_sum = 0u32;
            let count = (2 * radius + 1) as u32;
            
            for dx in 0..=2 * radius {
                let px = x - radius + dx;
                let orig_pixel = img.get_pixel(px, y);
                r_sum += orig_pixel[0] as u32;
                g_sum += orig_pixel[1] as u32;
                b_sum += orig_pixel[2] as u32;
                a_sum += orig_pixel[3] as u32;
            }
            
            *pixel = Rgba([
                (r_sum / count) as u8,
                (g_sum / count) as u8,
                (b_sum / count) as u8,
                (a_sum / count) as u8,
            ]);
        }
    });
    
    // Vertical pass - parallel processing
    img.enumerate_pixels_mut().par_bridge().for_each(|(x, y, pixel)| {
        if y >= radius && y < height - radius {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut a_sum = 0u32;
            let count = (2 * radius + 1) as u32;
            
            for dy in 0..=2 * radius {
                let py = y - radius + dy;
                let temp_pixel = temp_img.get_pixel(x, py);
                r_sum += temp_pixel[0] as u32;
                g_sum += temp_pixel[1] as u32;
                b_sum += temp_pixel[2] as u32;
                a_sum += temp_pixel[3] as u32;
            }
            
            *pixel = Rgba([
                (r_sum / count) as u8,
                (g_sum / count) as u8,
                (b_sum / count) as u8,
                (a_sum / count) as u8,
            ]);
        }
    });
}

pub fn draw_rounded_rect(img: &mut RgbaImage, x: u32, y: u32, width: u32, height: u32, radius: f32, color: Rgba<u8>) {
    let radius = radius as u32;
    
    // Simple rounded rectangle - draw main rectangle and corner circles
    if width <= 2 * radius || height <= 2 * radius {
        // If radius is too large, just draw a regular rectangle
        let rect = Rect::at(x as i32, y as i32).of_size(width, height);
        draw_filled_rect_mut(img, rect, color);
        return;
    }
    
    // Draw main rectangle (without corners)
    let main_rect = Rect::at(x as i32, (y + radius) as i32).of_size(width, height - 2 * radius);
    draw_filled_rect_mut(img, main_rect, color);
    
    // Draw top and bottom rectangles (for rounded corners)
    let top_rect = Rect::at((x + radius) as i32, y as i32).of_size(width - 2 * radius, radius);
    draw_filled_rect_mut(img, top_rect, color);
    
    let bottom_rect = Rect::at((x + radius) as i32, (y + height - radius) as i32).of_size(width - 2 * radius, radius);
    draw_filled_rect_mut(img, bottom_rect, color);
    
    // Draw corner "circles" (simplified as small rectangles for now)
    if radius > 0 {
        let corner_size = radius / 2;
        
        // Top-left corner
        let tl_rect = Rect::at((x + corner_size) as i32, (y + corner_size) as i32).of_size(corner_size, corner_size);
        draw_filled_rect_mut(img, tl_rect, color);
        
        // Top-right corner
        let tr_rect = Rect::at((x + width - radius + corner_size) as i32, (y + corner_size) as i32).of_size(corner_size, corner_size);
        draw_filled_rect_mut(img, tr_rect, color);
        
        // Bottom-left corner
        let bl_rect = Rect::at((x + corner_size) as i32, (y + height - radius + corner_size) as i32).of_size(corner_size, corner_size);
        draw_filled_rect_mut(img, bl_rect, color);
        
        // Bottom-right corner
        let br_rect = Rect::at((x + width - radius + corner_size) as i32, (y + height - radius + corner_size) as i32).of_size(corner_size, corner_size);
        draw_filled_rect_mut(img, br_rect, color);
    }
}

// Enhanced rounded rectangle with proper alpha blending
pub fn draw_rounded_rect_blended(img: &mut RgbaImage, x: u32, y: u32, width: u32, height: u32, radius: f32, color: Rgba<u8>) {
    let radius = radius as u32;
    
    // For each pixel in the rectangle area, determine if it should be drawn and apply alpha blending
    for py in y..(y + height) {
        for px in x..(x + width) {
            if px >= img.width() || py >= img.height() {
                continue;
            }
            
            let mut should_draw = false;
            
            // Check if pixel is within the rounded rectangle
            let rel_x = px - x;
            let rel_y = py - y;
            
            if radius == 0 {
                should_draw = true;
            } else if rel_x >= radius && rel_x < width - radius {
                // In the main vertical area
                should_draw = true;
            } else if rel_y >= radius && rel_y < height - radius {
                // In the main horizontal area
                should_draw = true;
            } else {
                // Check corners
                let mut corner_center_x = 0;
                let mut corner_center_y = 0;
                
                if rel_x < radius && rel_y < radius {
                    // Top-left corner
                    corner_center_x = radius;
                    corner_center_y = radius;
                } else if rel_x >= width - radius && rel_y < radius {
                    // Top-right corner
                    corner_center_x = width - radius;
                    corner_center_y = radius;
                } else if rel_x < radius && rel_y >= height - radius {
                    // Bottom-left corner
                    corner_center_x = radius;
                    corner_center_y = height - radius;
                } else if rel_x >= width - radius && rel_y >= height - radius {
                    // Bottom-right corner
                    corner_center_x = width - radius;
                    corner_center_y = height - radius;
                }
                
                if corner_center_x > 0 || corner_center_y > 0 {
                    let dx = rel_x as f32 - corner_center_x as f32;
                    let dy = rel_y as f32 - corner_center_y as f32;
                    let distance = (dx * dx + dy * dy).sqrt();
                    should_draw = distance <= radius as f32;
                }
            }
            
            if should_draw {
                // Apply alpha blending
                let existing_pixel = img.get_pixel(px, py);
                let overlay_alpha = color[3] as f32 / 255.0;
                let existing_alpha = 1.0 - overlay_alpha;
                
                let blended_r = ((existing_pixel[0] as f32 * existing_alpha) + (color[0] as f32 * overlay_alpha)) as u8;
                let blended_g = ((existing_pixel[1] as f32 * existing_alpha) + (color[1] as f32 * overlay_alpha)) as u8;
                let blended_b = ((existing_pixel[2] as f32 * existing_alpha) + (color[2] as f32 * overlay_alpha)) as u8;
                
                img.put_pixel(px, py, Rgba([blended_r, blended_g, blended_b, 255]));
            }
        }
    }
}

// Helper function to check if a point is within a rounded rectangle
pub fn is_point_in_rounded_rect(x: u32, y: u32, width: u32, height: u32, radius: f32) -> bool {
    let radius = radius as u32;
    
    if radius == 0 {
        return x < width && y < height;
    }
    
    // Check if point is in the main areas (non-corner regions)
    if x >= radius && x < width - radius {
        // In the main vertical area
        return y < height;
    }
    
    if y >= radius && y < height - radius {
        // In the main horizontal area
        return x < width;
    }
    
    // Check corners
    let mut corner_center_x = 0;
    let mut corner_center_y = 0;
    
    if x < radius && y < radius {
        // Top-left corner
        corner_center_x = radius;
        corner_center_y = radius;
    } else if x >= width - radius && y < radius {
        // Top-right corner
        corner_center_x = width - radius;
        corner_center_y = radius;
    } else if x < radius && y >= height - radius {
        // Bottom-left corner
        corner_center_x = radius;
        corner_center_y = height - radius;
    } else if x >= width - radius && y >= height - radius {
        // Bottom-right corner
        corner_center_x = width - radius;
        corner_center_y = height - radius;
    } else {
        return false; // Outside the rectangle entirely
    }
    
    let dx = x as f32 - corner_center_x as f32;
    let dy = y as f32 - corner_center_y as f32;
    let distance = (dx * dx + dy * dy).sqrt();
    distance <= radius as f32
}

pub fn resize_and_crop_to_fit(img: &DynamicImage, target_width: u32, target_height: u32) -> DynamicImage {
    // Use standard resize but with better filtering for quality
    let (orig_width, orig_height) = img.dimensions();
    let target_ratio = target_width as f32 / target_height as f32;
    let orig_ratio = orig_width as f32 / orig_height as f32;
    
    if orig_ratio > target_ratio {
        // Image is wider, crop width
        let new_width = (orig_height as f32 * target_ratio) as u32;
        let x_offset = (orig_width - new_width) / 2;
        img.crop_imm(x_offset, 0, new_width, orig_height)
           .resize_exact(target_width, target_height, image::imageops::FilterType::CatmullRom) // Better quality filter
    } else {
        // Image is taller, crop height
        let new_height = (orig_width as f32 / target_ratio) as u32;
        let y_offset = (orig_height - new_height) / 2;
        img.crop_imm(0, y_offset, orig_width, new_height)
           .resize_exact(target_width, target_height, image::imageops::FilterType::CatmullRom) // Better quality filter
    }
}

// Enhanced text drawing function with font caching and proper fallback
pub fn draw_text_with_font(
    img: &mut RgbaImage,
    text: &str,
    x: u32,
    y: u32,
    font_size: f32,
    color: Rgba<u8>,
    bold: bool,
) {
    // Skip font loading for empty text
    if text.is_empty() {
        return;
    }
    
    // Try to get cached font or load it once
    let font_data = FONT_CACHE.get_or_init(|| {
        let font_paths = if bold {
            [
                "C:/Windows/Fonts/ariblk.ttf", // Arial Black for bold
                "C:/Windows/Fonts/calibrib.ttf", // Calibri Bold
                "C:/Windows/Fonts/arial.ttf",
            ]
        } else {
            [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/calibri.ttf",
                "C:/Windows/Fonts/segoeui.ttf", // Segoe UI
            ]
        };
        
        for font_path in font_paths {
            if let Ok(data) = std::fs::read(font_path) {
                return Some(data);
            }
        }
        None
    });

    if let Some(data) = font_data {
        if let Ok(font) = FontRef::try_from_slice(data) {
            let scale = PxScale::from(font_size);
            draw_text_mut(img, color, x as i32, y as i32, scale, &font, text);
            return;
        }
    }
    
    // Enhanced fallback that better represents the text
    draw_enhanced_text_placeholder(img, text, x, y, font_size, color, bold);
}

// Enhanced placeholder that better represents text positioning
pub fn draw_enhanced_text_placeholder(
    img: &mut RgbaImage, 
    text: &str, 
    x: u32, 
    y: u32, 
    font_size: f32, 
    color: Rgba<u8>,
    bold: bool
) {
    let text_width = get_text_width(text, font_size);
    let text_height = (font_size * 1.2) as u32; // Add some line height
    
    if text_width > 0 && text_height > 0 && x < img.width() && y < img.height() {
        // Draw a subtle outline to show text boundaries (for debugging)
        let outline_color = Rgba([color[0] / 8, color[1] / 8, color[2] / 8, 32]);
        let rect = Rect::at(x as i32, (y as i32) - (text_height as i32 / 2)).of_size(
            text_width.min(img.width() - x),
            text_height.min(img.height() - y.saturating_sub(text_height / 2))
        );
        draw_filled_rect_mut(img, rect, outline_color);
        
        // Simulate text rendering with small rectangles for each character
        let char_width = font_size * 0.6;
        let char_height = font_size * 0.8;
        
        for (i, _) in text.char_indices() {
            let char_x = x + (i as f32 * char_width) as u32;
            let char_y = y - (char_height / 2.0) as u32;
            
            if char_x + (char_width as u32) < img.width() && char_y + (char_height as u32) < img.height() {
                let char_rect = Rect::at(char_x as i32, char_y as i32).of_size(
                    (char_width * 0.8) as u32,
                    char_height as u32
                );
                
                // Use more opaque color for bold text
                let text_color = if bold {
                    Rgba([color[0], color[1], color[2], (color[3] as f32 * 0.9) as u8])
                } else {
                    Rgba([color[0], color[1], color[2], (color[3] as f32 * 0.7) as u8])
                };
                
                draw_filled_rect_mut(img, char_rect, text_color);
            }
        }
    }
}

// Simple text placeholder function - for production, implement proper text rendering
pub fn draw_simple_text(img: &mut RgbaImage, text: &str, x: u32, y: u32, color: Rgba<u8>) {
    // For now, we'll draw a simple rectangle to indicate where text would be
    // This is a placeholder that shows text positioning but doesn't render actual text
    let text_width = get_text_width(text, 16.0);
    let text_height = 16;
    
    // Draw a subtle background rectangle to show where text would be placed
    if text_width > 0 && text_height > 0 && x < img.width() && y < img.height() {
        let rect = Rect::at(x as i32, y as i32).of_size(
            text_width.min(img.width() - x),
            text_height.min(img.height() - y)
        );
        // Draw with a very subtle color to indicate text placement
        let text_bg = Rgba([color[0] / 4, color[1] / 4, color[2] / 4, 64]);
        draw_filled_rect_mut(img, rect, text_bg);
    }
}

pub fn image_to_base64(img: &RgbaImage) -> Result<String, Box<dyn std::error::Error>> {
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    img.write_to(&mut cursor, ImageFormat::Png)?;
    
    let base64_string = general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64_string))
}
