use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarRating {
    #[serde(rename = "ES")]
    pub es: String,
    #[serde(rename = "NOR")]
    pub nor: String,
    #[serde(rename = "HARD")]
    pub hard: String,
    #[serde(rename = "EX")]
    pub ex: String,
    #[serde(rename = "EXP")]
    pub exp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MapMetadata {
    #[serde(rename = "songAuthorName")]
    pub song_author_name: String,
    #[serde(rename = "songName")]
    pub song_name: String,
    #[serde(rename = "songSubName")]
    pub song_sub_name: String,
    #[serde(rename = "levelAuthorName")]
    pub level_author_name: String,
    pub duration: u32,
    pub bpm: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MapVersion {
    #[serde(rename = "coverURL")]
    pub cover_url: String,
    pub hash: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MapInfo {
    pub metadata: MapMetadata,
    pub id: String,
    pub versions: Vec<MapVersion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardComponentConfig {
    #[serde(rename = "type")]
    pub component_type: String, // 'text' | 'image' | 'roundedRect' | 'starRating'
    pub x: f32,
    pub y: f32,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub text: Option<String>,
    pub font: Option<String>,
    #[serde(rename = "fillStyle")]
    pub fill_style: Option<String>,
    #[serde(rename = "maxWidth")]
    pub max_width: Option<f32>,
    #[serde(rename = "textAlign")]
    pub text_align: Option<String>,
    #[serde(rename = "cornerRadius")]
    pub corner_radius: Option<f32>,
    pub shadow: Option<ShadowConfig>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "srcField")]
    pub src_field: Option<String>,
    pub clip: Option<bool>,
    pub ratings: Option<Vec<RatingConfig>>,
    #[serde(rename = "defaultWidth")]
    pub default_width: Option<f32>,
    #[serde(rename = "specialWidth")]
    pub special_width: Option<f32>,
    #[serde(rename = "defaultSpacing")]
    pub default_spacing: Option<f32>,
    #[serde(rename = "specialSpacing")]
    pub special_spacing: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShadowConfig {
    pub color: String,
    #[serde(rename = "offsetX")]
    pub offset_x: f32,
    #[serde(rename = "offsetY")]
    pub offset_y: f32,
    pub blur: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RatingConfig {
    pub label: String,
    pub rating: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardBackgroundConfig {
    #[serde(rename = "type")]
    pub background_type: String, // 'color' | 'gradient' | 'cover'
    pub color: Option<String>,
    #[serde(rename = "srcField")]
    pub src_field: Option<String>,
    pub blur: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardConfig {
    pub width: u32,
    pub height: u32,
    #[serde(rename = "cardCornerRadius")]
    pub card_corner_radius: f32,
    pub background: CardBackgroundConfig,
    pub components: Vec<CardComponentConfig>,
    #[serde(rename = "configName")]
    pub config_name: Option<String>,
}
