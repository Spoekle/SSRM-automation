// Image generation module
// Provides thumbnail and card generation matching the original skia-canvas implementation

pub mod batch_thumbnail;
pub mod card;
pub mod playlist_thumbnail;
pub mod reweight_card;
pub mod ssrm_thumbnail;
pub mod utils;

// Re-export main types and functions for convenience
pub use batch_thumbnail::{generate_batch_thumbnail, BackgroundTransform};
pub use card::{generate_card, MapInfo, StarRating};
pub use playlist_thumbnail::{generate_playlist_thumbnail, PlaylistBackgroundTransform};
pub use reweight_card::{generate_reweight_card, NewStarRatings, OldStarRatings, ReweightMapInfo};
pub use ssrm_thumbnail::{generate_ssrm_thumbnail, SsrmMapInfo, SsrmStarRating};
