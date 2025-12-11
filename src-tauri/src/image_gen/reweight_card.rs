// Reweight card generator
// Creates cards showing old vs new star ratings for map reweights

use crate::image_gen::utils::*;
use skia_safe::{image_filters, Color, Paint, RRect, Rect};

/// Old star rating data
#[derive(Debug, Clone, serde::Deserialize)]
pub struct OldStarRatings {
    #[serde(rename = "ES")]
    pub es: Option<String>,
    #[serde(rename = "NOR")]
    pub nor: Option<String>,
    #[serde(rename = "HARD")]
    pub hard: Option<String>,
    #[serde(rename = "EX")]
    pub ex: Option<String>,
    #[serde(rename = "EXP")]
    pub exp: Option<String>,
}

/// New star rating data
#[derive(Debug, Clone, serde::Deserialize)]
pub struct NewStarRatings {
    #[serde(rename = "ES")]
    pub es: Option<String>,
    #[serde(rename = "NOR")]
    pub nor: Option<String>,
    #[serde(rename = "HARD")]
    pub hard: Option<String>,
    #[serde(rename = "EX")]
    pub ex: Option<String>,
    #[serde(rename = "EXP")]
    pub exp: Option<String>,
}

/// Map metadata
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ReweightMapMetadata {
    #[serde(rename = "songAuthorName")]
    pub song_author_name: String,
    #[serde(rename = "songName")]
    pub song_name: String,
    #[serde(rename = "songSubName")]
    pub song_sub_name: Option<String>,
    #[serde(rename = "levelAuthorName")]
    pub level_author_name: String,
}

/// Map version info
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ReweightMapVersion {
    #[serde(rename = "coverURL")]
    pub cover_url: String,
}

/// Map info
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ReweightMapInfo {
    pub metadata: ReweightMapMetadata,
    pub versions: Vec<ReweightMapVersion>,
}

/// Get difficulty color
fn get_difficulty_color(diff: &str) -> Color {
    match diff {
        "ES" => Color::from_rgb(22, 163, 74),
        "NOR" => Color::from_rgb(59, 130, 246),
        "HARD" => Color::from_rgb(249, 115, 22),
        "EX" => Color::from_rgb(220, 38, 38),
        "EXP" => Color::from_rgb(126, 34, 206),
        _ => Color::GRAY,
    }
}

/// Get rating for difficulty
fn get_rating<'a>(ratings: &'a OldStarRatings, diff: &str) -> Option<&'a String> {
    match diff {
        "ES" => ratings.es.as_ref(),
        "NOR" => ratings.nor.as_ref(),
        "HARD" => ratings.hard.as_ref(),
        "EX" => ratings.ex.as_ref(),
        "EXP" => ratings.exp.as_ref(),
        _ => None,
    }
}

fn get_new_rating<'a>(ratings: &'a NewStarRatings, diff: &str) -> Option<&'a String> {
    match diff {
        "ES" => ratings.es.as_ref(),
        "NOR" => ratings.nor.as_ref(),
        "HARD" => ratings.hard.as_ref(),
        "EX" => ratings.ex.as_ref(),
        "EXP" => ratings.exp.as_ref(),
        _ => None,
    }
}

/// Generate a reweight card
pub async fn generate_reweight_card(
    map_data: &ReweightMapInfo,
    old_star_ratings: &OldStarRatings,
    new_star_ratings: &NewStarRatings,
    chosen_diff: &str,
) -> Result<String, String> {
    let cover_url = map_data
        .versions
        .get(0)
        .map(|v| v.cover_url.as_str())
        .ok_or_else(|| "No cover URL available".to_string())?;

    let cover_bytes = fetch_image_bytes(cover_url).await?;

    let old_rating = get_rating(old_star_ratings, chosen_diff);
    let new_rating = get_new_rating(new_star_ratings, chosen_diff);

    render_reweight_card(&cover_bytes, map_data, old_rating, new_rating, chosen_diff)
}

/// Synchronous rendering
fn render_reweight_card(
    cover_bytes: &[u8],
    map_data: &ReweightMapInfo,
    old_rating: Option<&String>,
    new_rating: Option<&String>,
    chosen_diff: &str,
) -> Result<String, String> {
    let width = 600;
    let height = 270;

    let mut surface = create_surface(width, height)?;
    let cover = decode_image(cover_bytes)?;
    let diff_color = get_difficulty_color(chosen_diff);

    // Parse ratings to determine buff/nerf
    let old_val: f32 = old_rating.and_then(|r| r.parse().ok()).unwrap_or(0.0);
    let new_val: f32 = new_rating.and_then(|r| r.parse().ok()).unwrap_or(0.0);

    {
        let canvas = surface.canvas();
        canvas.clear(Color::TRANSPARENT);

        // Semi-transparent background
        let mut bg_paint = Paint::default();
        bg_paint.set_color(Color::from_argb(77, 0, 0, 0));
        let bg_rrect = RRect::new_rect_xy(
            Rect::from_xywh(0.0, 0.0, width as f32, height as f32),
            40.0,
            40.0,
        );
        canvas.draw_rrect(bg_rrect, &bg_paint);

        // Background glow for buff/nerf
        if new_val > old_val {
            // Green glow for buff
            let mut glow_paint = Paint::default();
            glow_paint.set_color(Color::from_argb(26, 22, 163, 74));
            if let Some(blur_filter) = image_filters::blur((20.0, 20.0), None, None, None) {
                glow_paint.set_image_filter(blur_filter);
            }
            let glow_rrect =
                RRect::new_rect_xy(Rect::from_xywh(40.0, 40.0, 520.0, 190.0), 20.0, 20.0);
            canvas.draw_rrect(glow_rrect, &glow_paint);
        } else if new_val < old_val {
            // Red glow for nerf
            let mut glow_paint = Paint::default();
            glow_paint.set_color(Color::from_argb(26, 220, 38, 38));
            if let Some(blur_filter) = image_filters::blur((20.0, 20.0), None, None, None) {
                glow_paint.set_image_filter(blur_filter);
            }
            let glow_rrect =
                RRect::new_rect_xy(Rect::from_xywh(40.0, 40.0, 520.0, 190.0), 20.0, 20.0);
            canvas.draw_rrect(glow_rrect, &glow_paint);
        }

        // Cover image with rounded corners
        canvas.save();
        let cover_rrect = RRect::new_rect_xy(Rect::from_xywh(20.0, 20.0, 230.0, 230.0), 20.0, 20.0);
        canvas.clip_rrect(cover_rrect, None, Some(true));
        canvas.draw_image_rect(
            &cover,
            None,
            Rect::from_xywh(20.0, 20.0, 230.0, 230.0),
            &Paint::default(),
        );
        canvas.restore();

        // Text
        let mut text_paint = Paint::default();
        text_paint.set_color(Color::WHITE);
        text_paint.set_anti_alias(true);

        // Font weights: author=300, song=700, sub=400, mapper=500
        // Use draw_text_with_fallback for text that may contain special characters
        // Max width is about 310px (270 to 580)
        draw_text_with_fallback(
            canvas,
            &map_data.metadata.song_author_name,
            270.0,
            55.0,
            &["Torus Pro", "Segoe UI", "Arial"],
            24.0,
            FontWeight::Light,
            Color::WHITE,
            Some(300.0),
        );
        draw_text_with_fallback(
            canvas,
            &map_data.metadata.song_name,
            270.0,
            90.0,
            &["Torus Pro", "Segoe UI", "Arial"],
            30.0,
            FontWeight::Bold,
            Color::WHITE,
            Some(300.0),
        );

        if let Some(ref sub) = map_data.metadata.song_sub_name {
            if !sub.is_empty() {
                draw_text_with_fallback(
                    canvas,
                    sub,
                    270.0,
                    120.0,
                    &["Torus Pro", "Segoe UI", "Arial"],
                    20.0,
                    FontWeight::Regular,
                    Color::from_rgb(200, 200, 200),
                    Some(300.0),
                );
            }
        }
        draw_text_with_fallback(
            canvas,
            &format!("Mapped by {}", map_data.metadata.level_author_name),
            270.0,
            170.0,
            &["Torus Pro", "Segoe UI", "Arial"],
            20.0,
            FontWeight::Medium,
            Color::WHITE,
            Some(300.0),
        );

        // Rating comparison (if both ratings exist)
        if let (Some(old), Some(new)) = (old_rating, new_rating) {
            let center_x = 405.0f32;
            let y_pos = 218.0f32;

            // Old rating box
            let mut box_paint = Paint::default();
            box_paint.set_color(diff_color);
            canvas.draw_rrect(
                RRect::new_rect_xy(
                    Rect::from_xywh(center_x - 135.0, y_pos - 17.0, 100.0, 34.0),
                    10.0,
                    10.0,
                ),
                &box_paint,
            );

            // Old rating text + star
            let rating_font = load_font_with_weight("Torus Pro", 24.0, 700);
            let old_tw = rating_font.measure_str(old, None).0;
            let star_size = 10.0;
            let old_total_width = old_tw + star_size + 4.0;
            let old_start_x = center_x - 85.0 - old_total_width / 2.0;
            canvas.draw_str(old, (old_start_x, y_pos + 8.0), &rating_font, &text_paint);
            draw_star(
                canvas,
                old_start_x + old_tw + 4.0 + star_size / 2.0,
                y_pos,
                star_size,
                Color::WHITE,
            );

            // Arrow with color based on buff/nerf
            let arrow_color = if new_val > old_val {
                Color::from_rgb(22, 163, 74) // Green for buff
            } else if new_val < old_val {
                Color::from_rgb(220, 38, 38) // Red for nerf
            } else {
                Color::GRAY
            };
            draw_arrow(canvas, center_x, y_pos, 20.0, arrow_color);

            // New rating box
            canvas.draw_rrect(
                RRect::new_rect_xy(
                    Rect::from_xywh(center_x + 35.0, y_pos - 17.0, 100.0, 34.0),
                    10.0,
                    10.0,
                ),
                &box_paint,
            );

            // New rating text + star
            let new_tw = rating_font.measure_str(new, None).0;
            let new_total_width = new_tw + star_size + 4.0;
            let new_start_x = center_x + 85.0 - new_total_width / 2.0;
            canvas.draw_str(new, (new_start_x, y_pos + 8.0), &rating_font, &text_paint);
            draw_star(
                canvas,
                new_start_x + new_tw + 4.0 + star_size / 2.0,
                y_pos,
                star_size,
                Color::WHITE,
            );
        }
    }

    surface_to_data_url(&mut surface)
}
