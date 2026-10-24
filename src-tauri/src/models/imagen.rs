use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Imagen {
    pub name: String,
    pub path: String,
}
