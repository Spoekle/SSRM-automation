use image::{Rgba, RgbaImage, DynamicImage};
use crate::img_gen::card_generation::types::{MapInfo, StarRating};
use crate::img_gen::card_generation::utils::{
    load_image_from_url, apply_blur, draw_rounded_rect, resize_and_crop_to_fit,
    draw_simple_text, format_duration, image_to_base64
};

pub async fn generate_thumbnail(
    data: MapInfo,
    chosen_diff: String,
    star_ratings: StarRating,
    background_url: String,
) -> Result<String, Box<dyn std::error::Error>> {
    let mut img = RgbaImage::new(1920, 1080);
    
    // Create base gradient background
    create_gradient_background(&mut img);
    
    // Load and apply background image
    let background_img = if !background_url.is_empty() {
        load_image_from_url(&background_url).await.unwrap_or_else(|_| {
            // Fallback to cover image if background URL fails
            DynamicImage::new_rgba8(1, 1)
        })
    } else {
        load_image_from_url(&data.versions[0].cover_url).await?
    };
    
    // Apply background with blur
    if background_img.width() > 1 && background_img.height() > 1 {
        let mut bg_resized = background_img.resize_exact(1920, 1080, image::imageops::FilterType::Lanczos3).to_rgba8();
        apply_blur(&mut bg_resized, 15.0);
        
        // Create dark overlay for better text readability
        for pixel in bg_resized.pixels_mut() {
            pixel[0] = (pixel[0] as f32 * 0.3) as u8;
            pixel[1] = (pixel[1] as f32 * 0.3) as u8;
            pixel[2] = (pixel[2] as f32 * 0.3) as u8;
        }
        
        image::imageops::overlay(&mut img, &bg_resized, 0, 0);
    }
    
    // Draw main content panel
    draw_rounded_rect(&mut img, 60, 60, 620, 960, 50.0, Rgba([20, 20, 20, 240]));
    
    // Load and draw cover image
    let cover_img = load_image_from_url(&data.versions[0].cover_url).await?;
    let cover_resized = resize_and_crop_to_fit(&cover_img, 510, 510);
    
    // Add shadow for cover
    draw_rounded_rect(&mut img, 85, 520, 510, 510, 25.0, Rgba([0, 0, 0, 180]));
    image::imageops::overlay(&mut img, &cover_resized.to_rgba8(), 75, 510);
    
    // Draw text content
    draw_thumbnail_text(&mut img, &data, &chosen_diff, &star_ratings)?;
    
    // Draw decorative elements
    draw_thumbnail_decorations(&mut img)?;
    
    image_to_base64(&img)
}

fn create_gradient_background(img: &mut RgbaImage) {
    let (width, height) = img.dimensions();
    
    for y in 0..height {
        for x in 0..width {
            let progress_x = x as f32 / width as f32;
            let progress_y = y as f32 / height as f32;
            
            // Create a diagonal gradient
            let progress = (progress_x + progress_y) / 2.0;
            
            // Dark purple to dark blue gradient
            let r = (30.0 + (60.0 * (1.0 - progress))) as u8;
            let g = (20.0 + (40.0 * progress)) as u8;
            let b = (80.0 + (120.0 * progress)) as u8;
            
            img.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }
}

fn draw_thumbnail_text(
    img: &mut RgbaImage,
    data: &MapInfo,
    chosen_diff: &str,
    star_ratings: &StarRating,
) -> Result<(), Box<dyn std::error::Error>> {
    let white = Rgba([255, 255, 255, 255]);
    let gray = Rgba([200, 200, 200, 255]);
    let accent = Rgba([100, 200, 255, 255]);
    
    // Title area
    draw_simple_text(img, "BEAT SABER", 100, 120, accent);
    draw_simple_text(img, "SCORE SUBMISSION", 100, 160, accent);
    
    // Song information
    draw_simple_text(img, &data.metadata.song_author_name, 100, 220, gray);
    draw_simple_text(img, &data.metadata.song_name, 100, 280, white);
    
    if !data.metadata.song_sub_name.is_empty() {
        draw_simple_text(img, &data.metadata.song_sub_name, 100, 340, gray);
    }
    
    // Mapper information
    draw_simple_text(img, "MAPPED BY", 100, 400, gray);
    draw_simple_text(img, &data.metadata.level_author_name, 100, 440, white);
    
    // Map details
    draw_simple_text(img, &format!("Map Code: {}", data.id), 400, 120, gray);
    draw_simple_text(img, &format!("BPM: {}", data.metadata.bpm), 400, 160, gray);
    draw_simple_text(img, &format!("Duration: {}", format_duration(data.metadata.duration)), 400, 200, gray);
    
    // Selected difficulty and star rating
    let selected_rating = match chosen_diff {
        "ES" => &star_ratings.es,
        "NOR" => &star_ratings.nor,
        "HARD" => &star_ratings.hard,
        "EX" => &star_ratings.ex,
        "EXP" => &star_ratings.exp,
        _ => "",
    };
    
    if !selected_rating.is_empty() && selected_rating != "0.0" {
        draw_simple_text(img, &format!("DIFFICULTY: {}", chosen_diff), 100, 1040, accent);
        
        let rating_text = if selected_rating == "Unranked" || selected_rating == "Qualified" {
            selected_rating.to_string()
        } else {
            format!("{} ★", selected_rating)
        };
        draw_simple_text(img, &rating_text, 400, 1040, white);
    }
    
    Ok(())
}

fn draw_thumbnail_decorations(img: &mut RgbaImage) -> Result<(), Box<dyn std::error::Error>> {
    let accent = Rgba([100, 200, 255, 100]);
    let accent_bright = Rgba([100, 200, 255, 200]);
    
    // Right side decorative panel
    draw_rounded_rect(img, 720, 60, 40, 960, 20.0, accent);
    
    // Top accent bar
    draw_rounded_rect(img, 60, 20, 620, 20, 10.0, accent_bright);
    
    // Bottom accent bar
    draw_rounded_rect(img, 60, 1040, 620, 20, 10.0, accent_bright);
    
    // Corner decorations
    draw_rounded_rect(img, 800, 100, 200, 10, 5.0, accent);
    draw_rounded_rect(img, 800, 150, 150, 10, 5.0, accent);
    draw_rounded_rect(img, 800, 200, 180, 10, 5.0, accent);
    
    Ok(())
}
