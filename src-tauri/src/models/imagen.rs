use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Imagen {
    pub nombre: String,
    pub path: String,
}
