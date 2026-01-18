// Playlist thumbnail generator
// Creates 512x512 thumbnails for playlists with background and month text

use crate::image_gen::utils::*;
use skia_safe::{Color4f, FontStyle, Paint, Rect};

/// Calculate crop dimensions to maintain 1:1 (square) aspect ratio
fn calculate_square_crop_dimensions(width: i32, height: i32) -> CropDimensions {
    if width > height {
        // Image is wider, crop horizontally
        let x_offset = (width - height) as f32 / 2.0;
        CropDimensions {
            sx: x_offset,
            sy: 0.0,
            sw: height as f32,
            sh: height as f32,
        }
    } else {
        // Image is taller, crop vertically
        let y_offset = (height - width) as f32 / 2.0;
        CropDimensions {
            sx: 0.0,
            sy: y_offset,
            sw: width as f32,
            sh: width as f32,
        }
    }
}

/// Generate a playlist thumbnail
/// Images are automatically cropped to 1:1 square centered (zoom to cover, not stretch)
pub async fn generate_playlist_thumbnail(
    background_url: &str,
    month: &str,
) -> Result<String, String> {
    // Fetch image bytes asynchronously
    let bytes = fetch_image_bytes(background_url).await?;

    // Do all rendering synchronously
    render_playlist_thumbnail(&bytes, month)
}

/// Synchronous rendering for playlist thumbnail
fn render_playlist_thumbnail(image_bytes: &[u8], month: &str) -> Result<String, String> {
    let size = 512;

    let mut surface = create_surface(size, size)?;
    let background = decode_image(image_bytes)?;

    // Calculate crop dimensions for 1:1 square (centered, zoom to cover)
    let crop = calculate_square_crop_dimensions(background.width(), background.height());

    {
        let canvas = surface.canvas();

        // Draw background with centered crop
        let src_rect = Rect::from_xywh(crop.sx, crop.sy, crop.sw, crop.sh);
        let dst_rect = Rect::from_xywh(0.0, 0.0, size as f32, size as f32);
        canvas.draw_image_rect(
            &background,
            Some((&src_rect, skia_safe::canvas::SrcRectConstraint::Fast)),
            dst_rect,
            &Paint::default(),
        );

        // Draw SSRM logo at top (scaled down for 512x512)
        if let Ok(logo) = load_logo() {
            let scale = 0.30;
            let logo_width = 1538.0 * scale;
            let logo_height = 262.0 * scale;
            let logo_x = (size as f32 - logo_width) / 2.0;

            canvas.draw_image_rect(
                &logo,
                None,
                Rect::from_xywh(logo_x, 50.0, logo_width, logo_height),
                &Paint::default(),
            );
        }

        // Draw month text with shadow at bottom
        let font = load_font("Aller", 54.0, FontStyle::italic());
        let text_width = font.measure_str(month, None).0;
        let x = (size as f32 - text_width) / 2.0;
        draw_text_with_shadow(
            canvas,
            month,
            x,
            460.0,
            &font,
            Color4f::new(1.0, 1.0, 1.0, 1.0),
            2.0,
        );
    }

    surface_to_data_url(&mut surface)
}
