mod models;

use crate::models::imagen::Imagen;
use image::ColorType;
use std::path::Path;

#[tauri::command]
fn convertir_imagenes(imagenes: Vec<Imagen>) -> Result<usize, String> {
    let mut convertidas = 0;

    for imagen in imagenes {
        let data = match std::fs::read(&imagen.path) {
            Ok(d) => d,
            Err(_) => continue,
        };

        let output = match heic::DecoderConfig::new().decode(&data, heic::PixelLayout::Rgb8) {
            Ok(o) => o,
            Err(_) => continue,
        };

        let ruta_directorio = Path::new(&imagen.path)
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or("");

        let nombre_salida = format!("{}/{}_convertida.jpg", ruta_directorio, imagen.name);

        if image::save_buffer(
            &nombre_salida,
            &output.data,
            output.width,
            output.height,
            ColorType::Rgb8,
        )
        .is_ok()
        {
            convertidas += 1;
        }
    }

    Ok(convertidas)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![convertir_imagenes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
