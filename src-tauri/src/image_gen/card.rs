// Card generator
// Creates map info cards with cover art, metadata, and difficulty ratings

use crate::image_gen::utils::*;
use skia_safe::{image_filters, Color, FontStyle, Paint, RRect, Rect};

/// Star rating data for cards
#[derive(Debug, Clone, serde::Deserialize)]
pub struct StarRating {
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

/// Map metadata for cards
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MapMetadata {
    #[serde(rename = "songAuthorName")]
    pub song_author_name: String,
    #[serde(rename = "songName")]
    pub song_name: String,
    #[serde(rename = "songSubName")]
    pub song_sub_name: Option<String>,
    #[serde(rename = "levelAuthorName")]
    pub level_author_name: String,
    pub duration: i32,
    pub bpm: f32,
}

/// Map version info
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MapVersion {
    #[serde(rename = "coverURL")]
    pub cover_url: String,
    pub hash: String,
}

/// Map info for cards
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MapInfo {
    pub id: String,
    pub metadata: MapMetadata,
    pub versions: Vec<MapVersion>,
}

/// Generate a map card
pub async fn generate_card(
    map_data: &MapInfo,
    star_ratings: &StarRating,
    use_background: bool,
) -> Result<String, String> {
    let cover_url = map_data
        .versions
        .get(0)
        .map(|v| v.cover_url.as_str())
        .ok_or_else(|| "No cover URL available".to_string())?;

    // Fetch image bytes asynchronously
    let bytes = fetch_image_bytes(cover_url).await?;

    // Do all rendering synchronously
    render_card(&bytes, map_data, star_ratings, use_background)
}

/// Synchronous rendering for card
fn render_card(
    cover_bytes: &[u8],
    map_data: &MapInfo,
    star_ratings: &StarRating,
    use_background: bool,
) -> Result<String, String> {
    let width = 900;
    let height = 300;

    let mut surface = create_surface(width, height)?;
    let cover = decode_image(cover_bytes)?;

    {
        let canvas = surface.canvas();
        canvas.clear(Color::TRANSPARENT);

        // Create rounded clip
        let rrect = RRect::new_rect_xy(
            Rect::from_xywh(0.0, 0.0, width as f32, height as f32),
            20.0,
            20.0,
        );
        canvas.clip_rrect(rrect, None, Some(true));

        if use_background {
            // Draw scaled background with blur
            let scale =
                (width as f32 / cover.width() as f32).max(height as f32 / cover.height() as f32);
            let scaled_w = cover.width() as f32 * scale;
            let scaled_h = cover.height() as f32 * scale;
            let offset_x = (width as f32 - scaled_w) / 2.0;
            let offset_y = (height as f32 - scaled_h) / 2.0;

            // Create blurred paint
            let mut blur_paint = Paint::default();
            if let Some(blur_filter) = image_filters::blur((10.0, 10.0), None, None, None) {
                blur_paint.set_image_filter(blur_filter);
            }

            canvas.draw_image_rect(
                &cover,
                None,
                Rect::from_xywh(offset_x, offset_y, scaled_w, scaled_h),
                &blur_paint,
            );

            // Darken overlay
            let mut overlay = Paint::default();
            overlay.set_color(Color::from_argb(102, 0, 0, 0));
            canvas.draw_rrect(rrect, &overlay);
        }

        // Draw cover image
        canvas.save();
        let cover_rrect = RRect::new_rect_xy(Rect::from_xywh(20.0, 20.0, 260.0, 260.0), 10.0, 10.0);
        canvas.clip_rrect(cover_rrect, None, Some(true));
        canvas.draw_image_rect(
            &cover,
            None,
            Rect::from_xywh(20.0, 20.0, 260.0, 260.0),
            &Paint::default(),
        );
        canvas.restore();

        // Metadata background
        let mut meta_bg = Paint::default();
        meta_bg.set_color(Color::from_argb(51, 0, 0, 0));
        canvas.draw_rrect(
            RRect::new_rect_xy(Rect::from_xywh(300.0, 20.0, 580.0, 180.0), 10.0, 10.0),
            &meta_bg,
        );

        // Text - left side (matching original font weights)
        let mut text_paint = Paint::default();
        text_paint.set_color(Color::WHITE);
        text_paint.set_anti_alias(true);

        // Font weights matching original: author=400, song=800, sub=500, mapper=600
        // Use draw_text_with_fallback for text that may contain special characters
        // Max width for left side text area is about 500px (320 to 820)
        draw_text_with_fallback(
            canvas,
            &map_data.metadata.song_author_name,
            320.0,
            55.0,
            &["Torus Pro", "Segoe UI", "Arial"],
            24.0,
            FontWeight::Regular,
            Color::WHITE,
            Some(380.0), // Max width before ellipsis
        );
        draw_text_with_fallback(
            canvas,
            &map_data.metadata.song_name,
            320.0,
            90.0,
            &["Torus Pro", "Segoe UI", "Arial"],
            30.0,
            FontWeight::Heavy,
            Color::WHITE,
            Some(380.0),
        );
        if let Some(ref sub) = map_data.metadata.song_sub_name {
            if !sub.is_empty() {
                draw_text_with_fallback(
                    canvas,
                    sub,
                    320.0,
                    125.0,
                    &["Torus Pro", "Segoe UI", "Arial"],
                    20.0,
                    FontWeight::Medium,
                    Color::WHITE,
                    Some(380.0),
                );
            }
        }
        draw_text_with_fallback(
            canvas,
            &format!("Mapped by {}", map_data.metadata.level_author_name),
            320.0,
            180.0,
            &["Torus Pro", "Segoe UI", "Arial"],
            20.0,
            FontWeight::SemiBold,
            Color::WHITE,
            Some(380.0),
        );

        // Right-side metadata (ID, BPM, Duration)
        let font_right = load_font("Torus Pro", 24.0, FontStyle::normal());

        // ID
        let id_text = &map_data.id;
        let id_width = font_right.measure_str(id_text, None).0;
        canvas.draw_str(id_text, (830.0 - id_width, 55.0), &font_right, &text_paint);
        draw_key_icon(canvas, 840.0, 34.0, 24.0);

        // BPM
        let bpm_text = format!("{:.0}", map_data.metadata.bpm);
        let bpm_width = font_right.measure_str(&bpm_text, None).0;
        canvas.draw_str(
            &bpm_text,
            (830.0 - bpm_width, 85.0),
            &font_right,
            &text_paint,
        );
        draw_metronome_icon(canvas, 840.0, 64.0, 24.0);

        // Duration
        let duration_text = format_duration(map_data.metadata.duration);
        let dur_width = font_right.measure_str(&duration_text, None).0;
        canvas.draw_str(
            &duration_text,
            (830.0 - dur_width, 115.0),
            &font_right,
            &text_paint,
        );
        draw_clock_icon(canvas, 840.0, 94.0, 24.0);

        // Difficulty boxes
        let ratings = [
            (&star_ratings.es, Color::from_rgb(22, 163, 74)),
            (&star_ratings.nor, Color::from_rgb(59, 130, 246)),
            (&star_ratings.hard, Color::from_rgb(249, 115, 22)),
            (&star_ratings.ex, Color::from_rgb(220, 38, 38)),
            (&star_ratings.exp, Color::from_rgb(126, 34, 206)),
        ];

        let mut x = 300.0f32;
        for (rating, color) in ratings.iter() {
            // Only draw if rating has a value (not None and not empty string)
            if let Some(val) = rating {
                if val.is_empty() {
                    continue;
                }

                let mut box_paint = Paint::default();
                box_paint.set_color(*color);
                canvas.draw_rrect(
                    RRect::new_rect_xy(Rect::from_xywh(x, 220.0, 107.0, 50.0), 10.0, 10.0),
                    &box_paint,
                );

                let is_text_only = val == "Unranked" || val == "Qualified";
                let rating_font = if is_text_only {
                    load_font("Torus Pro", 20.0, FontStyle::bold())
                } else {
                    load_font("Torus Pro", 28.0, FontStyle::bold())
                };

                if is_text_only {
                    let tw = rating_font.measure_str(val, None).0;
                    canvas.draw_str(
                        val,
                        (x + (107.0 - tw) / 2.0, 252.0),
                        &rating_font,
                        &text_paint,
                    );
                } else {
                    // Draw the number and a star
                    let star_size = 18.0;
                    let num_text = val.as_str();
                    let num_width = rating_font.measure_str(num_text, None).0;
                    let total_width = num_width + star_size + 4.0;
                    let start_x = x + (107.0 - total_width) / 2.0;

                    canvas.draw_str(num_text, (start_x, 252.0), &rating_font, &text_paint);
                    draw_star(
                        canvas,
                        start_x + num_width + 4.0 + star_size / 2.0,
                        244.0,
                        star_size / 2.0,
                        Color::WHITE,
                    );
                }

                x += 118.0;
            }
        }
    }

    surface_to_data_url(&mut surface)
}
