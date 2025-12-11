// SSRM thumbnail generator
// Creates video thumbnails with map info, cover art, and difficulty display

use crate::image_gen::utils::*;
use skia_safe::{image_filters, Color, FontStyle, Paint, RRect, Rect, TileMode};
use skia_safe::gradient_shader;

/// Star rating data
#[derive(Debug, Clone, serde::Deserialize)]
pub struct SsrmStarRating {
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
pub struct SsrmMapMetadata {
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
pub struct SsrmMapVersion {
    #[serde(rename = "coverURL")]
    pub cover_url: String,
}

/// Map info
#[derive(Debug, Clone, serde::Deserialize)]
pub struct SsrmMapInfo {
    pub metadata: SsrmMapMetadata,
    pub versions: Vec<SsrmMapVersion>,
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

/// Get difficulty name
fn get_difficulty_name(diff: &str) -> &str {
    match diff {
        "ES" => "Easy",
        "NOR" => "Normal",
        "HARD" => "Hard",
        "EX" => "Expert",
        "EXP" => "Expert+",
        _ => "",
    }
}

/// Calculate crop dimensions for square aspect ratio
fn calculate_square_crop(width: i32, height: i32) -> CropDimensions {
    if width > height {
        let x_offset = (width - height) as f32 / 2.0;
        CropDimensions {
            sx: x_offset,
            sy: 0.0,
            sw: height as f32,
            sh: height as f32,
        }
    } else {
        let y_offset = (height - width) as f32 / 2.0;
        CropDimensions {
            sx: 0.0,
            sy: y_offset,
            sw: width as f32,
            sh: width as f32,
        }
    }
}

/// Generate an SSRM video thumbnail
pub async fn generate_ssrm_thumbnail(
    map_data: &SsrmMapInfo,
    chosen_diff: &str,
    star_ratings: &SsrmStarRating,
    background_url: &str,
) -> Result<String, String> {
    // Fetch cover and background images
    let cover_url = map_data
        .versions
        .get(0)
        .map(|v| v.cover_url.as_str())
        .ok_or_else(|| "No cover URL available".to_string())?;

    let cover_bytes = fetch_image_bytes(cover_url).await?;
    let background_bytes = fetch_image_bytes(background_url)
        .await
        .unwrap_or_else(|_| cover_bytes.clone());

    // Get rating for chosen difficulty
    let rating = match chosen_diff {
        "ES" => star_ratings.es.clone(),
        "NOR" => star_ratings.nor.clone(),
        "HARD" => star_ratings.hard.clone(),
        "EX" => star_ratings.ex.clone(),
        "EXP" => star_ratings.exp.clone(),
        _ => None,
    };

    render_ssrm_thumbnail(
        &cover_bytes,
        &background_bytes,
        map_data,
        chosen_diff,
        rating.as_deref(),
    )
}

/// Synchronous rendering
fn render_ssrm_thumbnail(
    cover_bytes: &[u8],
    background_bytes: &[u8],
    map_data: &SsrmMapInfo,
    chosen_diff: &str,
    rating: Option<&str>,
) -> Result<String, String> {
    let width = 1920;
    let height = 1080;

    let mut surface = create_surface(width, height)?;
    let cover = decode_image(cover_bytes)?;
    let background = decode_image(background_bytes)?;
    let diff_color = get_difficulty_color(chosen_diff);

    {
        let canvas = surface.canvas();

        // Draw gradient background
        let mut gradient_paint = Paint::default();
        let colors = [
            Color::from_rgb(15, 8, 208),   // Dark blue/black
            Color::from_rgb(155, 11, 57),  // Dark red
        ];
        let shader = gradient_shader::linear(
            ((0.0, 0.0), (width as f32, height as f32)),
            colors.as_slice(),
            None,
            TileMode::Clamp,
            None,
            None,
        );
        gradient_paint.set_shader(shader);
        canvas.draw_rect(
            Rect::from_xywh(0.0, 0.0, width as f32, height as f32),
            &gradient_paint,
        );

        // Clip to rounded rect
        let rrect = RRect::new_rect_xy(Rect::from_xywh(20.0, 20.0, 1880.0, 1040.0), 50.0, 50.0);
        canvas.save();
        canvas.clip_rrect(rrect, None, Some(true));

        // Draw blurred background
        let bg_crop = calculate_crop_dimensions(background.width(), background.height());
        let mut blur_paint = Paint::default();
        if let Some(blur_filter) = image_filters::blur((10.0, 10.0), None, None, None) {
            blur_paint.set_image_filter(blur_filter);
        }
        canvas.draw_image_rect(
            &background,
            Some((
                &Rect::from_xywh(bg_crop.sx, bg_crop.sy, bg_crop.sw, bg_crop.sh),
                skia_safe::canvas::SrcRectConstraint::Fast,
            )),
            Rect::from_xywh(0.0, 0.0, width as f32, height as f32),
            &blur_paint,
        );

        canvas.restore();

        // Left panel background
        canvas.save();
        let left_panel = RRect::new_rect_xy(Rect::from_xywh(20.0, 20.0, 620.0, 1040.0), 50.0, 50.0);
        let mut panel_paint = Paint::default();
        panel_paint.set_color(Color::from_rgb(20, 20, 20));
        canvas.draw_rrect(left_panel, &panel_paint);
        canvas.restore();

        // Cover image with rounded corners
        canvas.save();
        let cover_rrect =
            RRect::new_rect_xy(Rect::from_xywh(75.0, 495.0, 510.0, 510.0), 50.0, 50.0);
        canvas.clip_rrect(cover_rrect, None, Some(true));
        let cover_crop = calculate_square_crop(cover.width(), cover.height());
        canvas.draw_image_rect(
            &cover,
            Some((
                &Rect::from_xywh(cover_crop.sx, cover_crop.sy, cover_crop.sw, cover_crop.sh),
                skia_safe::canvas::SrcRectConstraint::Fast,
            )),
            Rect::from_xywh(75.0, 495.0, 510.0, 510.0),
            &Paint::default(),
        );
        canvas.restore();

        // Cover outline
        let mut outline_paint = Paint::default();
        outline_paint.set_color(Color::WHITE);
        outline_paint.set_style(skia_safe::PaintStyle::Stroke);
        outline_paint.set_stroke_width(10.0);
        canvas.draw_rrect(cover_rrect, &outline_paint);

        // Main outline
        let main_outline =
            RRect::new_rect_xy(Rect::from_xywh(20.0, 20.0, 1880.0, 1040.0), 50.0, 50.0);
        canvas.draw_rrect(main_outline, &outline_paint);

        // Text - use draw_text_with_fallback for text that may contain special characters
        // Left panel is 620px wide, text starts at 50px, so max width is about 560px
        draw_text_with_fallback(
            canvas,
            &map_data.metadata.song_author_name,
            50.0,
            95.0,
            &["Heebo", "Segoe UI", "Arial"],
            48.0,
            FontWeight::Regular,
            Color::WHITE,
            Some(560.0),
        );
        draw_text_with_fallback(
            canvas,
            &map_data.metadata.song_name,
            50.0,
            160.0,
            &["Heebo", "Segoe UI", "Arial"],
            56.0,
            FontWeight::Bold,
            Color::WHITE,
            Some(560.0),
        );
        if let Some(ref sub) = map_data.metadata.song_sub_name {
            if !sub.is_empty() {
                draw_text_with_fallback(
                    canvas,
                    sub,
                    50.0,
                    220.0,
                    &["Heebo", "Segoe UI", "Arial"],
                    48.0,
                    FontWeight::Regular,
                    Color::WHITE,
                    Some(560.0),
                );
            }
        }
        draw_text_with_fallback(
            canvas,
            &format!("Mapped by {}", map_data.metadata.level_author_name),
            50.0,
            295.0,
            &["Heebo", "Segoe UI", "Arial"],
            40.0,
            FontWeight::Regular,
            Color::WHITE,
            Some(560.0),
        );

        // Difficulty rating box
        if let Some(rating_str) = rating {
            let mut text_paint = Paint::default();
            text_paint.set_color(Color::WHITE);
            text_paint.set_anti_alias(true);

            let mut diff_paint = Paint::default();
            diff_paint.set_color(diff_color);
            let diff_rrect =
                RRect::new_rect_xy(Rect::from_xywh(75.0, 360.0, 510.0, 100.0), 25.0, 25.0);
            canvas.draw_rrect(diff_rrect, &diff_paint);

            let diff_name = get_difficulty_name(chosen_diff);
            let diff_font = load_font("Heebo", 48.0, FontStyle::bold());

            if rating_str == "Unranked" || rating_str == "Qualified" {
                // No star for unranked/qualified
                let display_text = format!("{} {}", diff_name, rating_str);
                let tw = diff_font.measure_str(&display_text, None).0;
                canvas.draw_str(
                    &display_text,
                    (330.0 - tw / 2.0, 425.0),
                    &diff_font,
                    &text_paint,
                );
            } else {
                // Draw text without star, then draw star icon separately
                let display_text = format!("{} {}", diff_name, rating_str);
                let tw = diff_font.measure_str(&display_text, None).0;
                let star_size = 40.0; // Larger star for SSRM thumbnail
                let total_width = tw + 8.0 + star_size; // text + gap + star
                let start_x = 330.0 - total_width / 2.0;

                canvas.draw_str(&display_text, (start_x, 425.0), &diff_font, &text_paint);
                draw_star(
                    canvas,
                    start_x + tw + 8.0 + star_size / 2.0,
                    410.0,
                    star_size / 2.0,
                    Color::WHITE,
                );
            }
        }

        // Dotted line separator
        let dot_x = 640.0;
        let mut dot_paint = Paint::default();
        dot_paint.set_color(diff_color);
        dot_paint.set_anti_alias(true);
        for i in 0..17 {
            let y = 50.0 + (i as f32 * 61.0);
            canvas.draw_circle((dot_x, y), 15.0, &dot_paint);
        }
    }

    surface_to_data_url(&mut surface)
}
