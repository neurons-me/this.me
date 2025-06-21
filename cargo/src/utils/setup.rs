// src/utils/setup.rs
use std::{fs, io};
use dirs::home_dir;

/// Garantiza ~/.this/me y devuelve Ok(()) o el error subyacente.
pub fn validate_setup(verbose: bool) -> io::Result<()> {
    let home = home_dir().ok_or_else(|| io::Error::new(
        io::ErrorKind::NotFound,
        "No se pudo determinar el directorio HOME",
    ))?;

    let me_path = home.join(".this").join("me");

    if !me_path.exists() {
        fs::create_dir_all(&me_path)?;
        if verbose {
            println!("✅ Creado {}", me_path.display());
        }
    } else if verbose {
        println!(".me >> init.");
    }
    Ok(())
}