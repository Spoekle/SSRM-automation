// Batch thumbnail generator
// Creates thumbnails for monthly batch videos

use crate::image_gen::utils::*;
use skia_safe::{Color4f, FontStyle, Paint, Rect};

/// Background transform options
#[derive(Debug, Clone, serde::Deserialize)]
pub struct BackgroundTransform {
    pub scale: Option<f32>,
    pub x: Option<f32>,
    pub y: Option<f32>,
}

/// Generate a batch thumbnail
pub async fn generate_batch_thumbnail(
    background_url: &str,
    month: &str,
    background_transform: Option<BackgroundTransform>,
) -> Result<String, String> {
    // Fetch image bytes asynchronously
    let bytes = fetch_image_bytes(background_url).await?;

    // Do all rendering synchronously
    render_batch_thumbnail(&bytes, month, background_transform)
}

/// Synchronous rendering for batch thumbnail
fn render_batch_thumbnail(
    image_bytes: &[u8],
    month: &str,
    background_transform: Option<BackgroundTransform>,
) -> Result<String, String> {
    let width = 1920;
    let height = 1080;

    let mut surface = create_surface(width, height)?;
    let background = decode_image(image_bytes)?;

    // Calculate crop dimensions for 16:9
    let crop = calculate_crop_dimensions(background.width(), background.height());

    {
        let canvas = surface.canvas();
        canvas.save();

        // Apply transform
        if let Some(transform) = background_transform {
            let scale = transform.scale.unwrap_or(1.0);
            let tx = transform.x.unwrap_or(0.0);
            let ty = transform.y.unwrap_or(0.0);
            canvas.translate((tx, ty));
            canvas.scale((scale, scale));
        }

        // Draw background
        let src_rect = Rect::from_xywh(crop.sx, crop.sy, crop.sw, crop.sh);
        let dst_rect = Rect::from_xywh(0.0, 0.0, width as f32, height as f32);
        canvas.draw_image_rect(
            &background,
            Some((&src_rect, skia_safe::canvas::SrcRectConstraint::Fast)),
            dst_rect,
            &Paint::default(),
        );
        canvas.restore();

        // Draw SSRM logo at top (larger for 1920x1080)
        if let Ok(logo) = load_logo() {
            let scale: f32 = 1.0;
            let logo_width = 1538.0 * scale;
            let logo_height = 262.0 * scale;
            let logo_x = (width as f32 - logo_width) / 2.0;

            canvas.draw_image_rect(
                &logo,
                None,
                Rect::from_xywh(logo_x, 100.0, logo_width, logo_height),
                &Paint::default(),
            );
        }

        // Draw month text
        let font = load_font("Aller", 130.0, FontStyle::bold());
        let text_width = font.measure_str(month, None).0;
        let x = (width as f32 - text_width) / 2.0;
        draw_text_with_shadow(
            canvas,
            month,
            x,
            760.0,
            &font,
            Color4f::new(1.0, 1.0, 1.0, 1.0),
            3.0,
        );
    }

    surface_to_data_url(&mut surface)
}
