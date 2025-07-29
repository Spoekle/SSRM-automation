use image::{Rgba, RgbaImage};
use crate::img_gen::card_generation::types::{MapInfo, StarRating};
use crate::img_gen::card_generation::utils::{
    load_image_from_url, draw_rounded_rect, resize_and_crop_to_fit,
    draw_simple_text, parse_rgb_color, image_to_base64
};

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
    
    // Draw cover with shadow
    draw_rounded_rect(&mut img, 25, 25, 230, 230, 10.0, Rgba([0, 0, 0, 128])); // Shadow
    image::imageops::overlay(&mut img, &cover_resized.to_rgba8(), 20, 20);
    
    // Draw semi-transparent background for text area
    draw_rounded_rect(&mut img, 270, 20, 480, 230, 10.0, Rgba([0, 0, 0, 51]));
    
    let white = Rgba([255, 255, 255, 255]);
    
    // Draw metadata text (left side of text area)
    draw_simple_text(&mut img, &data.metadata.song_author_name, 290, 35, white);
    draw_simple_text(&mut img, &data.metadata.song_name, 290, 70, white);
    draw_simple_text(&mut img, &data.metadata.song_sub_name, 290, 100, white);
    draw_simple_text(&mut img, &format!("Mapped by {}", data.metadata.level_author_name), 290, 130, white);
    
    // Draw metadata info (right side of text area)
    draw_simple_text(&mut img, "Map Code:", 630, 35, white);
    draw_simple_text(&mut img, &data.id, 630, 55, white);
    
    // Get old and new ratings for the chosen difficulty
    let (old_rating, new_rating) = get_ratings_for_difficulty(&old_star_ratings, &new_star_ratings, &chosen_diff);
    
    // Draw reweight comparison
    draw_reweight_comparison(&mut img, &chosen_diff, &old_rating, &new_rating, 290, 160)?;
    
    image_to_base64(&img)
}

fn get_ratings_for_difficulty(old_ratings: &StarRating, new_ratings: &StarRating, chosen_diff: &str) -> (String, String) {
    let old_rating = match chosen_diff {
        "ES" => &old_ratings.es,
        "NOR" => &old_ratings.nor,
        "HARD" => &old_ratings.hard,
        "EX" => &old_ratings.ex,
        "EXP" => &old_ratings.exp,
        _ => "",
    };
    
    let new_rating = match chosen_diff {
        "ES" => &new_ratings.es,
        "NOR" => &new_ratings.nor,
        "HARD" => &new_ratings.hard,
        "EX" => &new_ratings.ex,
        "EXP" => &new_ratings.exp,
        _ => "",
    };
    
    (old_rating.to_string(), new_rating.to_string())
}

fn draw_reweight_comparison(
    img: &mut RgbaImage,
    chosen_diff: &str,
    old_rating: &str,
    new_rating: &str,
    x: u32,
    y: u32,
) -> Result<(), Box<dyn std::error::Error>> {
    let white = Rgba([255, 255, 255, 255]);
    let gray = Rgba([160, 160, 160, 255]);
    let green = parse_rgb_color("rgb(22 163 74)");
    let red = parse_rgb_color("rgb(220 38 38)");
    
    // Draw difficulty label
    let diff_color = match chosen_diff {
        "ES" => parse_rgb_color("rgb(22 163 74)"),   // green
        "NOR" => parse_rgb_color("rgb(59 130 246)"), // blue
        "HARD" => parse_rgb_color("rgb(249 115 22)"), // orange
        "EX" => parse_rgb_color("rgb(220 38 38)"),   // red
        "EXP" => parse_rgb_color("rgb(126 34 206)"), // purple
        _ => white,
    };
    
    // Draw difficulty badge
    draw_rounded_rect(img, x, y, 60, 30, 5.0, diff_color);
    draw_simple_text(img, chosen_diff, x + 10, y + 20, white);
    
    // Draw "OLD" label and rating
    draw_simple_text(img, "OLD:", x + 80, y + 20, gray);
    draw_simple_text(img, old_rating, x + 130, y + 20, white);
    
    // Draw arrow
    draw_simple_text(img, "→", x + 210, y + 20, white);
    
    // Draw "NEW" label and rating
    draw_simple_text(img, "NEW:", x + 240, y + 20, gray);
    
    // Color new rating based on change
    let new_color = if let (Ok(old_val), Ok(new_val)) = (old_rating.parse::<f32>(), new_rating.parse::<f32>()) {
        if new_val > old_val {
            green // Increased rating
        } else if new_val < old_val {
            red // Decreased rating
        } else {
            white // Same rating
        }
    } else {
        white // Non-numeric ratings
    };
    
    draw_simple_text(img, new_rating, x + 290, y + 20, new_color);
    
    // Draw change indicator if both ratings are numeric
    if let (Ok(old_val), Ok(new_val)) = (old_rating.parse::<f32>(), new_rating.parse::<f32>()) {
        let change = new_val - old_val;
        if change.abs() > 0.01 { // Only show if meaningful change
            let change_text = if change > 0.0 {
                format!("+{:.2}", change)
            } else {
                format!("{:.2}", change)
            };
            let change_color = if change > 0.0 { green } else { red };
            draw_simple_text(img, &change_text, x + 370, y + 20, change_color);
        }
    }
    
    Ok(())
}
