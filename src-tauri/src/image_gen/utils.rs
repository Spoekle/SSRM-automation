// Image generation utilities - shared functions for all generators
// Provides font loading, surface creation, and image utilities

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use skia_safe::{
    images, surfaces, Color, Color4f, EncodedImageFormat, Font, FontMgr, FontStyle, Image, Paint,
    Surface,
};

/// Surface/canvas utilities

/// Create a new raster surface
pub fn create_surface(width: i32, height: i32) -> Result<Surface, String> {
    surfaces::raster_n32_premul((width, height))
        .ok_or_else(|| "Failed to create surface".to_string())
}

/// Encode a surface to a PNG data URL
pub fn surface_to_data_url(surface: &mut Surface) -> Result<String, String> {
    let image = surface.image_snapshot();
    let data = image
        .encode(None, EncodedImageFormat::PNG, None)
        .ok_or_else(|| "Failed to encode image to PNG".to_string())?;
    let base64_encoded = BASE64.encode(data.as_bytes());
    Ok(format!("data:image/png;base64,{}", base64_encoded))
}

/// Font loading utilities
/// Uses embedded fonts with proper weight and style matching

/// Font weight presets for easy font loading
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum FontWeight {
    Thin,     // 100
    Light,    // 300
    Regular,  // 400
    Medium,   // 500
    SemiBold, // 600
    Bold,     // 700
    Heavy,    // 800
}

impl FontWeight {
    /// Convert to skia weight value (100-900)
    pub fn to_weight(self) -> i32 {
        match self {
            FontWeight::Thin => 100,
            FontWeight::Light => 300,
            FontWeight::Regular => 400,
            FontWeight::Medium => 500,
            FontWeight::SemiBold => 600,
            FontWeight::Bold => 700,
            FontWeight::Heavy => 800,
        }
    }
}

// Embed Torus Pro fonts at compile time
const TORUS_THIN: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-Thin.ttf");
const TORUS_LIGHT: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-Light.ttf");
const TORUS_REGULAR: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-Regular.ttf");
const TORUS_SEMIBOLD: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-SemiBold.ttf");
const TORUS_BOLD: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-Bold.ttf");
const TORUS_HEAVY: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-Heavy.ttf");
const TORUS_ITALIC: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-Italic.ttf");
const TORUS_THIN_ITALIC: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-ThinItalic.ttf");
const TORUS_LIGHT_ITALIC: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-LightItalic.ttf");
const TORUS_SEMIBOLD_ITALIC: &[u8] =
    include_bytes!("../../fonts/Torus.Pro/TorusPro-SemiBoldItalic.ttf");
const TORUS_BOLD_ITALIC: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-BoldItalic.ttf");
const TORUS_HEAVY_ITALIC: &[u8] = include_bytes!("../../fonts/Torus.Pro/TorusPro-HeavyItalic.ttf");

// Embed Aller font
const ALLER_ITALIC: &[u8] = include_bytes!("../../fonts/Aller_It.ttf");

// Embed Heebo fonts
const HEEBO_THIN: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-Thin.ttf");
const HEEBO_EXTRALIGHT: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-ExtraLight.ttf");
const HEEBO_LIGHT: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-Light.ttf");
const HEEBO_REGULAR: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-Regular.ttf");
const HEEBO_MEDIUM: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-Medium.ttf");
const HEEBO_SEMIBOLD: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-SemiBold.ttf");
const HEEBO_BOLD: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-Bold.ttf");
const HEEBO_EXTRABOLD: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-ExtraBold.ttf");
const HEEBO_BLACK: &[u8] = include_bytes!("../../fonts/Heebo/Heebo-Black.ttf");

/// Load embedded font from bytes
fn load_embedded_typeface(font_data: &[u8]) -> Option<skia_safe::Typeface> {
    let data = skia_safe::Data::new_copy(font_data);
    FontMgr::new().new_from_data(&data, None)
}

/// Get the correct embedded font for Torus Pro based on weight and italic
fn get_torus_typeface(weight: FontWeight, italic: bool) -> Option<skia_safe::Typeface> {
    let font_bytes = if italic {
        match weight {
            FontWeight::Thin => TORUS_THIN_ITALIC,
            FontWeight::Light => TORUS_LIGHT_ITALIC,
            FontWeight::Regular => TORUS_ITALIC,
            FontWeight::Medium => TORUS_ITALIC, // No medium italic, fallback to regular italic
            FontWeight::SemiBold => TORUS_SEMIBOLD_ITALIC,
            FontWeight::Bold => TORUS_BOLD_ITALIC,
            FontWeight::Heavy => TORUS_HEAVY_ITALIC,
        }
    } else {
        match weight {
            FontWeight::Thin => TORUS_THIN,
            FontWeight::Light => TORUS_LIGHT,
            FontWeight::Regular => TORUS_REGULAR,
            FontWeight::Medium => TORUS_REGULAR, // No medium, fallback to regular
            FontWeight::SemiBold => TORUS_SEMIBOLD,
            FontWeight::Bold => TORUS_BOLD,
            FontWeight::Heavy => TORUS_HEAVY,
        }
    };
    load_embedded_typeface(font_bytes)
}

/// Get the correct embedded font for Heebo based on weight
/// Note: Heebo doesn't have italic variants, so italic parameter is ignored
fn get_heebo_typeface(weight: FontWeight) -> Option<skia_safe::Typeface> {
    let font_bytes = match weight {
        FontWeight::Thin => HEEBO_THIN,
        FontWeight::Light => HEEBO_LIGHT,
        FontWeight::Regular => HEEBO_REGULAR,
        FontWeight::Medium => HEEBO_MEDIUM,
        FontWeight::SemiBold => HEEBO_SEMIBOLD,
        FontWeight::Bold => HEEBO_BOLD,
        FontWeight::Heavy => HEEBO_BLACK, // Use Black for Heavy
    };
    load_embedded_typeface(font_bytes)
}

/// Load a custom font with weight and italic options
///
/// Fonts are loaded from embedded resources. No system installation required.
///
/// # Examples
/// ```
/// let font = load_custom_font("Torus Pro", 24.0, FontWeight::SemiBold, true); // SemiBold Italic
/// let font = load_custom_font("Aller", 48.0, FontWeight::Bold, false);        // Bold
/// ```
pub fn load_custom_font(family_name: &str, size: f32, weight: FontWeight, italic: bool) -> Font {
    use skia_safe::font_style::{Slant, Weight, Width};

    // Try embedded fonts first
    let typeface = match family_name.to_lowercase().as_str() {
        name if name.contains("torus") => get_torus_typeface(weight, italic),
        name if name.contains("heebo") => get_heebo_typeface(weight),
        name if name.contains("aller") => load_embedded_typeface(ALLER_ITALIC),
        _ => None,
    };

    if let Some(tf) = typeface {
        return Font::from_typeface(tf, size);
    }

    // Fallback to system fonts
    let font_mgr = FontMgr::new();
    let slant = if italic {
        Slant::Italic
    } else {
        Slant::Upright
    };
    let style = FontStyle::new(Weight::from(weight.to_weight()), Width::NORMAL, slant);

    // Try fallback fonts with the same style
    let fallbacks = ["Segoe UI", "Arial", "Helvetica", "sans-serif"];
    for fallback in fallbacks {
        if let Some(typeface) = font_mgr.match_family_style(fallback, style) {
            return Font::from_typeface(typeface, size);
        }
    }

    // Ultimate fallback - use default font
    let mut font = Font::default();
    font.set_size(size);
    font
}

/// Load a font from system fonts with fallbacks (convenience wrapper for FontStyle)
pub fn load_font(family_name: &str, size: f32, style: FontStyle) -> Font {
    // Check if bold or normal based on common FontStyle patterns
    let weight = if style == FontStyle::bold() || style == FontStyle::bold_italic() {
        FontWeight::Bold
    } else {
        FontWeight::Regular
    };
    let italic = style == FontStyle::italic() || style == FontStyle::bold_italic();

    load_custom_font(family_name, size, weight, italic)
}

/// Load a font with specific weight (100-900) - for raw weight values
pub fn load_font_with_weight(family_name: &str, size: f32, weight_value: i32) -> Font {
    let weight = match weight_value {
        w if w <= 100 => FontWeight::Thin,
        w if w <= 300 => FontWeight::Light,
        w if w <= 400 => FontWeight::Regular,
        w if w <= 500 => FontWeight::Medium,
        w if w <= 600 => FontWeight::SemiBold,
        w if w <= 700 => FontWeight::Bold,
        _ => FontWeight::Heavy,
    };

    load_custom_font(family_name, size, weight, false)
}

/// Image loading utilities

/// Fetch image bytes from URL (async)
pub async fn fetch_image_bytes(url: &str) -> Result<Vec<u8>, String> {
    if url.starts_with("data:") {
        // Parse data URL
        let parts: Vec<&str> = url.splitn(2, ',').collect();
        if parts.len() != 2 {
            return Err("Invalid data URL format".to_string());
        }
        BASE64
            .decode(parts[1])
            .map_err(|e| format!("Failed to decode base64: {}", e))
    } else if url.starts_with("http") || url.starts_with("https") {
        let response = reqwest::get(url)
            .await
            .map_err(|e| format!("Failed to fetch image: {}", e))?;
        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read image bytes: {}", e))?;
        Ok(bytes.to_vec())
    } else {
        // Treat as local file path
        std::fs::read(url).map_err(|e| format!("Failed to read local file: {}", e))
    }
}

/// Decode image bytes to skia Image using the image crate for better format support (incl. WebP)
pub fn decode_image(bytes: &[u8]) -> Result<Image, String> {
    // First try skia's native decoder
    let data = skia_safe::Data::new_copy(bytes);
    if let Some(img) = Image::from_encoded(data) {
        return Ok(img);
    }

    // Fall back to image crate for formats like WebP
    let dynamic_image =
        image::load_from_memory(bytes).map_err(|e| format!("Failed to decode image: {}", e))?;

    let rgba = dynamic_image.to_rgba8();
    let (width, height) = (rgba.width(), rgba.height());
    let raw_pixels = rgba.into_raw();

    let info = skia_safe::ImageInfo::new(
        (width as i32, height as i32),
        skia_safe::ColorType::RGBA8888,
        skia_safe::AlphaType::Unpremul,
        None,
    );

    images::raster_from_data(
        &info,
        skia_safe::Data::new_copy(&raw_pixels),
        width as usize * 4,
    )
    .ok_or_else(|| "Failed to create skia image from decoded data".to_string())
}

/// Embedded SSRM logo as PNG bytes (compile-time embedded)
static SSRM_LOGO_PNG: &[u8] = include_bytes!("../../../assets/thumbnails/SSRB_Logo.png");

/// Load the embedded SSRM logo
pub fn load_logo() -> Result<Image, String> {
    decode_image(SSRM_LOGO_PNG)
}

/// Format utilities

/// Format duration from seconds to MM:SS
pub fn format_duration(seconds: i32) -> String {
    let mins = seconds / 60;
    let secs = seconds % 60;
    format!("{}:{:02}", mins, secs)
}

/// Drawing utilities

/// Draw text with shadow effect
pub fn draw_text_with_shadow(
    canvas: &skia_safe::Canvas,
    text: &str,
    x: f32,
    y: f32,
    font: &Font,
    color: Color4f,
    shadow_offset: f32,
) {
    // Draw shadow
    if shadow_offset > 0.0 {
        let mut shadow_paint = Paint::default();
        shadow_paint.set_color4f(Color4f::new(0.0, 0.0, 0.0, 0.5), None);
        shadow_paint.set_anti_alias(true);
        canvas.draw_str(
            text,
            (x + shadow_offset, y + shadow_offset),
            font,
            &shadow_paint,
        );
    }
    // Draw main text
    let mut paint = Paint::default();
    paint.set_color4f(color, None);
    paint.set_anti_alias(true);
    canvas.draw_str(text, (x, y), font, &paint);
}

/// Uses Skia's Paragraph API which supports font fallback
/// If max_width is provided, text will be truncated with ellipsis if it exceeds the width
pub fn draw_text_with_fallback(
    canvas: &skia_safe::Canvas,
    text: &str,
    x: f32,
    y: f32,
    font_families: &[&str],
    font_size: f32,
    font_weight: FontWeight,
    color: Color,
    max_width: Option<f32>,
) {
    use skia_safe::textlayout::{
        FontCollection, ParagraphBuilder, ParagraphStyle, TextStyle, TextAlign,
        TypefaceFontProvider,
    };
    use skia_safe::font_style::{Slant, Weight, Width};

    // Create font provider with our embedded fonts
    let mut font_provider = TypefaceFontProvider::new();

    // Register Torus Pro fonts based on weight
    let torus_typeface = match font_weight {
        FontWeight::Thin => load_embedded_typeface(TORUS_THIN),
        FontWeight::Light => load_embedded_typeface(TORUS_LIGHT),
        FontWeight::Regular => load_embedded_typeface(TORUS_REGULAR),
        FontWeight::Medium => load_embedded_typeface(TORUS_REGULAR), // No medium, fall back
        FontWeight::SemiBold => load_embedded_typeface(TORUS_SEMIBOLD),
        FontWeight::Bold => load_embedded_typeface(TORUS_BOLD),
        FontWeight::Heavy => load_embedded_typeface(TORUS_HEAVY),
    };
    if let Some(tf) = torus_typeface {
        font_provider.register_typeface(tf, Some("Torus Pro"));
    }

    // Register Heebo fonts based on weight
    let heebo_typeface = match font_weight {
        FontWeight::Thin => load_embedded_typeface(HEEBO_THIN),
        FontWeight::Light => load_embedded_typeface(HEEBO_LIGHT),
        FontWeight::Regular => load_embedded_typeface(HEEBO_REGULAR),
        FontWeight::Medium => load_embedded_typeface(HEEBO_MEDIUM),
        FontWeight::SemiBold => load_embedded_typeface(HEEBO_SEMIBOLD),
        FontWeight::Bold => load_embedded_typeface(HEEBO_BOLD),
        FontWeight::Heavy => load_embedded_typeface(HEEBO_BLACK),
    };
    if let Some(tf) = heebo_typeface {
        font_provider.register_typeface(tf, Some("Heebo"));
    }

    // Create font collection with our custom fonts and system fallback
    let mut font_collection = FontCollection::new();
    font_collection.set_asset_font_manager(Some(font_provider.into()));
    font_collection.set_default_font_manager(FontMgr::new(), None);

    // Build paragraph style
    let mut para_style = ParagraphStyle::new();
    para_style.set_text_align(TextAlign::Left);

    // Set ellipsis for text overflow
    if max_width.is_some() {
        para_style.set_ellipsis("…");
        para_style.set_max_lines(1);
    }

    // Build text style with primary and fallback fonts
    let mut text_style = TextStyle::new();
    text_style.set_color(color);
    text_style.set_font_size(font_size);

    // Set font families (first is primary, rest are fallbacks)
    let families: Vec<String> = font_families.iter().map(|s| s.to_string()).collect();
    let family_refs: Vec<&str> = families.iter().map(|s| s.as_str()).collect();
    text_style.set_font_families(&family_refs);

    // Set font weight
    let weight = Weight::from(font_weight.to_weight());
    text_style.set_font_style(FontStyle::new(weight, Width::NORMAL, Slant::Upright));

    para_style.set_text_style(&text_style);

    // Build and layout paragraph
    let mut builder = ParagraphBuilder::new(&para_style, font_collection);
    builder.push_style(&text_style);
    builder.add_text(text);

    let mut paragraph = builder.build();

    // Use max_width if provided, otherwise use large width to prevent wrapping
    let layout_width = max_width.unwrap_or(10000.0);
    paragraph.layout(layout_width);

    // Get the baseline offset (paragraph draws from top, we need baseline)
    let line_height = paragraph.height();
    let baseline_y = y - line_height + (font_size * 0.2); // Approximate baseline adjustment

    paragraph.paint(canvas, (x, baseline_y));
}

/// Crop dimensions for maintaining aspect ratio
pub struct CropDimensions {
    pub sx: f32,
    pub sy: f32,
    pub sw: f32,
    pub sh: f32,
}

/// Calculate crop dimensions to maintain 16:9 aspect ratio
pub fn calculate_crop_dimensions(width: i32, height: i32) -> CropDimensions {
    let target_ratio = 16.0 / 9.0;
    let current_ratio = width as f32 / height as f32;

    if current_ratio > target_ratio {
        let new_width = height as f32 * target_ratio;
        let x_offset = (width as f32 - new_width) / 2.0;
        CropDimensions {
            sx: x_offset,
            sy: 0.0,
            sw: new_width,
            sh: height as f32,
        }
    } else {
        let new_height = width as f32 / target_ratio;
        let y_offset = (height as f32 - new_height) / 2.0;
        CropDimensions {
            sx: 0.0,
            sy: y_offset,
            sw: width as f32,
            sh: new_height,
        }
    }
}

/// SVG icon rendering

/// Embedded SVG string for key icon
const SVG_KEY: &str = r#"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>"#;

/// Embedded SVG string for clock icon
const SVG_CLOCK: &str = r#"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>"#;

/// Embedded SVG string for metronome icon (from assets)
const SVG_METRONOME: &str = r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280"><g><path fill="#FFFFFF" d="M703.47,886.75l-428.38-463.1c-9.94-10.75-26.71-11.4-37.46-1.46l-41.85,38.72c-10.75,9.94-11.4,26.71-1.46,37.46l428.38,463.1c9.94,10.75,26.71,11.4,37.46,1.46l41.85-38.72C712.76,914.27,713.41,897.5,703.47,886.75z"/><polygon fill="#FFFFFF" points="817.7,135.5 484.43,135.5 392.26,471.63 470.09,555.77 558.65,232.81 743.36,232.81 965.35,1047.19 335.33,1047.19 400.45,809.71 322.62,725.58 207.75,1144.5 1092.73,1144.5"/></g></svg>"##;

/// Render an SVG string to a skia Image
pub fn render_svg_to_image(svg_data: &str, size: u32) -> Option<Image> {
    use usvg::TreeParsing;

    let opt = usvg::Options::default();
    let usvg_tree = usvg::Tree::from_data(svg_data.as_bytes(), &opt).ok()?;
    let tree = resvg::Tree::from_usvg(&usvg_tree);

    let mut pixmap = tiny_skia::Pixmap::new(size, size)?;

    let svg_size = tree.size;
    let scale = size as f32 / svg_size.width().max(svg_size.height());
    let transform = tiny_skia::Transform::from_scale(scale, scale);

    tree.render(transform, &mut pixmap.as_mut());

    // Convert tiny_skia pixmap to skia-safe Image
    let data = pixmap.data();
    let info = skia_safe::ImageInfo::new(
        (size as i32, size as i32),
        skia_safe::ColorType::RGBA8888,
        skia_safe::AlphaType::Premul,
        None,
    );

    images::raster_from_data(&info, skia_safe::Data::new_copy(data), size as usize * 4)
}

/// Draw an SVG icon at the specified position
pub fn draw_svg_icon(canvas: &skia_safe::Canvas, svg_data: &str, x: f32, y: f32, size: f32) {
    if let Some(img) = render_svg_to_image(svg_data, size as u32) {
        canvas.draw_image(&img, (x, y), None);
    }
}

/// Draw a key icon
pub fn draw_key_icon(canvas: &skia_safe::Canvas, x: f32, y: f32, size: f32) {
    draw_svg_icon(canvas, SVG_KEY, x, y, size);
}

/// Draw a metronome icon
pub fn draw_metronome_icon(canvas: &skia_safe::Canvas, x: f32, y: f32, size: f32) {
    draw_svg_icon(canvas, SVG_METRONOME, x, y, size);
}

/// Draw a clock icon
pub fn draw_clock_icon(canvas: &skia_safe::Canvas, x: f32, y: f32, size: f32) {
    draw_svg_icon(canvas, SVG_CLOCK, x, y, size);
}

/// Draw a 5-point star at the given position
pub fn draw_star(canvas: &skia_safe::Canvas, cx: f32, cy: f32, radius: f32, color: Color) {
    use skia_safe::Path;

    let mut path = Path::new();
    let inner_radius = radius * 0.4;

    // Create 5-point star
    for i in 0..10 {
        let angle = (i as f32 * 36.0 - 90.0) * std::f32::consts::PI / 180.0;
        let r = if i % 2 == 0 { radius } else { inner_radius };
        let px = cx + r * angle.cos();
        let py = cy + r * angle.sin();

        if i == 0 {
            path.move_to((px, py));
        } else {
            path.line_to((px, py));
        }
    }
    path.close();

    let mut paint = Paint::default();
    paint.set_color(color);
    paint.set_anti_alias(true);
    canvas.draw_path(&path, &paint);
}

/// Draw a right-pointing triangle arrow at the given position
pub fn draw_arrow(canvas: &skia_safe::Canvas, cx: f32, cy: f32, size: f32, color: Color) {
    use skia_safe::Path;

    let mut path = Path::new();
    let half_height = size * 0.5;
    let half_width = size * 0.4;

    // Triangle pointing right
    path.move_to((cx - half_width, cy - half_height)); // Top left
    path.line_to((cx + half_width, cy)); // Right point
    path.line_to((cx - half_width, cy + half_height)); // Bottom left
    path.close();

    let mut paint = Paint::default();
    paint.set_color(color);
    paint.set_anti_alias(true);
    canvas.draw_path(&path, &paint);
}
