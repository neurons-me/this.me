mod me;
use me::{Me, MeError};

use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Uso: me <comando> [...args]");
        eprintln!("Comandos disponibles: create, unlock, be, lock, show");
        return;
    }

    let command = &args[1];

    match command.as_str() {
        "create" => {
            if args.len() < 4 {
                eprintln!("Uso: me create <username> <hash>");
                return;
            }
            let username = &args[2];
            let hash = &args[3];
            match Me::create(username, hash) {
                Ok(_) => println!("🆕 Identidad '{}' creada con éxito.", username),
                Err(MeError::Io(e)) => eprintln!("📁 Error de IO: {}", e),
                Err(MeError::Crypto(e)) => eprintln!("🔐 Error criptográfico: {}", e),
                Err(MeError::Serde(e)) => eprintln!("🧩 Error de serialización: {}", e),
                Err(MeError::InvalidHash) => eprintln!("🚫 Hash incorrecto o archivo corrupto"),
                Err(e) => eprintln!("❌ Otro error: {}", e),
            }
        }
        "unlock" => {
            if args.len() < 4 {
                eprintln!("Uso: me unlock <username> <hash>");
                return;
            }
            let username = &args[2];
            let hash = &args[3];
            match Me::load(username, hash) {
                Ok(me) => {
                    println!("🔓 Identidad '{}' desbloqueada.", username);
                    if let Some(attrs) = me.get_attributes() {
                        println!("🧬 Atributos: {:?}", attrs);
                    }
                }
                Err(MeError::Io(e)) => eprintln!("📁 Error de IO: {}", e),
                Err(MeError::Crypto(e)) => eprintln!("🔐 Error criptográfico: {}", e),
                Err(MeError::Serde(e)) => eprintln!("🧩 Error de serialización: {}", e),
                Err(MeError::InvalidHash) => eprintln!("🚫 Hash incorrecto o archivo corrupto"),
                Err(e) => eprintln!("❌ Otro error: {}", e),
            }
        }
        "be" => {
            if args.len() < 6 {
                eprintln!("Uso: me be <username> <hash> <key> <value>");
                return;
            }
            let username = &args[2];
            let hash = &args[3];
            let key = &args[4];
            let value = &args[5];
            match Me::load(username, hash) {
                Ok(mut me) => {
                    if let Err(e) = me.be(key, value) {
                        eprintln!("❌ Error: {}", e);
                        return;
                    }
                    if let Err(e) = me.save(hash) {
                        eprintln!("❌ Error al guardar: {}", e);
                        return;
                    }
                    println!("✅ Atributo agregado: {} = {}", key, value);
                }
                Err(MeError::Io(e)) => eprintln!("📁 Error de IO: {}", e),
                Err(MeError::Crypto(e)) => eprintln!("🔐 Error criptográfico: {}", e),
                Err(MeError::Serde(e)) => eprintln!("🧩 Error de serialización: {}", e),
                Err(MeError::InvalidHash) => eprintln!("🚫 Hash incorrecto o archivo corrupto"),
                Err(e) => eprintln!("❌ Otro error: {}", e),
            }
        }
        _ => {
            eprintln!("❓ Comando desconocido: {}", command);
        }
    }
}