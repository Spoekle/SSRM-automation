use crate::img_gen::card_generation::{types::*, utils::*};
use image::{Rgba, RgbaImage};

pub async fn generate_map_card(
    map_info: MapInfo,
    star_ratings: StarRating,
    use_background: bool,
) -> Result<String, Box<dyn std::error::Error>> {
    // Create the canvas with dimensions 900x300
    let mut canvas = RgbaImage::new(900, 300);
    
    // Fill with a solid background color first (we'll apply transparency at the end)
    for pixel in canvas.pixels_mut() {
        *pixel = Rgba([32, 32, 32, 255]); // Dark background for proper blending
    }
    
    // Load cover image
    let cover_url = &map_info.versions[0].cover_url;
    let cover_image = load_image_from_url(cover_url).await?;
    
    // If use_background is true, draw blurred background
    if use_background {
        let bg_image = resize_and_crop_to_fit(&cover_image, 900, 300);
        let mut bg_rgba = bg_image.to_rgba8();
        apply_blur(&mut bg_rgba, 10.0);
        
        // Apply background only within the rounded rectangle area
        for (x, y, bg_pixel) in bg_rgba.enumerate_pixels() {
            if is_point_in_rounded_rect(x, y, 900, 300, 20.0) {
                canvas.put_pixel(x, y, *bg_pixel);
            }
        }
    }
    
    // Draw shadow for cover image using proper alpha blending
    let shadow_offset_x = 10;
    let shadow_offset_y = 10;
    let shadow_blur_radius = 5;
    
    // Create shadow with proper rounded corners and blur
    for blur_step in 0..shadow_blur_radius {
        let current_alpha = 128 / (shadow_blur_radius + 1) / (blur_step + 1);
        if current_alpha > 0 {
            let shadow_x = 20 + shadow_offset_x + blur_step;
            let shadow_y = 20 + shadow_offset_y + blur_step;
            let shadow_size = 260 - (blur_step * 2);
            
            if shadow_x + shadow_size <= 900 && shadow_y + shadow_size <= 300 {
                // Draw rounded shadow rectangle
                draw_rounded_rect_blended(&mut canvas, shadow_x, shadow_y, shadow_size, shadow_size, 10.0, Rgba([0, 0, 0, current_alpha as u8]));
            }
        }
    }
    
    // Draw cover image with rounded corners using proper masking
    let cover_resized = resize_and_crop_to_fit(&cover_image, 260, 260);
    let cover_rgba = cover_resized.to_rgba8();
    
    // Apply cover image with rounded corners using pixel-by-pixel masking
    for (rel_x, rel_y, cover_pixel) in cover_rgba.enumerate_pixels() {
        let canvas_x = rel_x + 20;
        let canvas_y = rel_y + 20;
        
        if canvas_x < 900 && canvas_y < 300 {
            // Check if this pixel should be within the rounded rectangle
            let should_draw = is_point_in_rounded_rect(rel_x, rel_y, 260, 260, 10.0);
            
            if should_draw {
                canvas.put_pixel(canvas_x, canvas_y, *cover_pixel);
            }
        }
    }
    
    // Draw semi-transparent background for text with proper rounded corners and alpha blending
    draw_rounded_rect_blended(&mut canvas, 300, 20, 580, 180, 10.0, Rgba([0, 0, 0, 51]));
    
    // Draw metadata text
    let white = Rgba([255, 255, 255, 255]);
    
    // Song author name (24px font, left-aligned at x=320)
    let author_name = truncate_text_with_width(&map_info.metadata.song_author_name, 480, 24.0);
    draw_text_with_font(&mut canvas, &author_name, 320, 35, 24.0, white, false);
    
    // Song name (30px bold font, left-aligned at x=320)
    let song_name = truncate_text_with_width(&map_info.metadata.song_name, 480, 30.0);
    draw_text_with_font(&mut canvas, &song_name, 320, 70, 30.0, white, true);
    
    // Song sub name (20px font, left-aligned at x=320)
    let sub_name = truncate_text_with_width(&map_info.metadata.song_sub_name, 480, 20.0);
    draw_text_with_font(&mut canvas, &sub_name, 320, 100, 20.0, white, false);
    
    // Level author name (20px font, left-aligned at x=320)
    let level_author = format!("Mapped by {}", map_info.metadata.level_author_name);
    let level_author_text = truncate_text_with_width(&level_author, 480, 20.0);
    draw_text_with_font(&mut canvas, &level_author_text, 320, 160, 20.0, white, false);
    
    // Right-aligned metadata (positioned to end at x=860)
    let duration_formatted = format_duration(map_info.metadata.duration);
    let right_edge = 860u32;
    
    // Map Code (right-aligned)
    let map_code_label_width = get_text_width("Map Code:", 20.0);
    let map_code_value_width = get_text_width(&map_info.id, 20.0);
    draw_text_with_font(&mut canvas, "Map Code:", right_edge - map_code_label_width, 35, 20.0, white, false);
    draw_text_with_font(&mut canvas, &map_info.id, right_edge - map_code_value_width, 55, 20.0, white, false);
    
    // BPM (right-aligned)
    let bpm_label_width = get_text_width("BPM:", 20.0);
    let bpm_value_width = get_text_width(&map_info.metadata.bpm.to_string(), 20.0);
    draw_text_with_font(&mut canvas, "BPM:", right_edge - bpm_label_width, 85, 20.0, white, false);
    draw_text_with_font(&mut canvas, &map_info.metadata.bpm.to_string(), right_edge - bpm_value_width, 110, 20.0, white, false);
    
    // Duration (right-aligned)
    let duration_label_width = get_text_width("Song Duration:", 20.0);
    let duration_value_width = get_text_width(&duration_formatted, 20.0);
    draw_text_with_font(&mut canvas, "Song Duration:", right_edge - duration_label_width, 140, 20.0, white, false);
    draw_text_with_font(&mut canvas, &duration_formatted, right_edge - duration_value_width, 160, 20.0, white, false);
    
    // Draw star ratings with colors and proper spacing
    let ratings = [
        (&star_ratings.es, parse_rgb_color("rgb(22, 163, 74)")), // Green
        (&star_ratings.nor, parse_rgb_color("rgb(59, 130, 246)")), // Blue  
        (&star_ratings.hard, parse_rgb_color("rgb(249, 115, 22)")), // Orange
        (&star_ratings.ex, parse_rgb_color("rgb(220, 38, 38)")), // Red
        (&star_ratings.exp, parse_rgb_color("rgb(126, 34, 206)")), // Purple
    ];
    
    let mut x = 300u32;
    
    for (rating, color) in ratings.iter() {
        if !rating.is_empty() && *rating != "0.0" {
            let is_special = *rating == "Unranked" || *rating == "Qualified";
            let width = if is_special { 120 } else { 100 };
            
            // Draw rating background rectangle with rounded corners
            draw_rounded_rect_blended(&mut canvas, x, 220, width, 50, 10.0, *color);
            
            // Draw rating text (properly centered in the rectangle)
            let text = if is_special {
                (*rating).clone()
            } else {
                format!("{} ★", rating)
            };
            
            // Calculate proper text centering
            let text_width = get_text_width(&text, 20.0);
            let text_x = x + (width / 2) - (text_width / 2);
            let text_y = 245; // Vertically centered in the 50px height rectangle (220 + 25)
            
            draw_text_with_font(&mut canvas, &text, text_x, text_y, 20.0, white, true);
            
            // Move x position for next rating
            x += if is_special { 130 } else { 110 };
        }
    }
    
    // Apply the canvas mask to ensure rounded corners for the entire image
    // First create a final transparent canvas
    let mut final_canvas = RgbaImage::new(900, 300);
    for pixel in final_canvas.pixels_mut() {
        *pixel = Rgba([0, 0, 0, 0]); // Transparent background
    }
    
    // Copy pixels from canvas to final_canvas only where the rounded rectangle allows
    for (x, y, canvas_pixel) in canvas.enumerate_pixels() {
        if is_point_in_rounded_rect(x, y, 900, 300, 20.0) {
            final_canvas.put_pixel(x, y, *canvas_pixel);
        }
    }
    
    // Convert to base64
    let base64_image = image_to_base64(&final_canvas)?;
    Ok(base64_image)
}

