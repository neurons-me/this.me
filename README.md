Filosofía: this.me como estructura declarativa

this.me no es una sesión, ni una “identity en runtime”, ni una wallet cargada en memoria.
Es una declaración de identidad cifrada, y cada operación sobre ella debe:
	•	Leer y desencriptar el archivo .me
	•	Aplicar la mutación declarativa (como be, have, endorse)
	•	Volver a cifrar y escribir
	•	Salir sin dejar estado

Esto lo alinea con:
	•	🔐 Seguridad por diseño (nada queda cargado)
	•	🌿 Filosofía de inmutabilidad declarativa (no “vive”, se describe)
	•	🧩 Componibilidad con otros entornos (monad, env, cleaker…)
---

Me::create()
🧱 create(username, hash) → Construye una identidad nueva

Este método:
	1.	Verifica si ya existe un archivo .me para ese usuario (para no sobrescribir).
	2.	Crea una estructura base de identidad:
	•	username
	•	claves (aunque sean placeholders)
	•	atributos, relaciones, reacciones, endosos
	3.	Llama internamente a save() para guardar esa estructura cifrada en disco.

✅ Se usa una sola vez por usuario: al registrar la identidad por primera vez.
Crea identidad cifrada
------
me.save()
Guarda .me con hash
💾 save(hash) → Guarda los datos actuales al disco

Este método:
	1.	Toma el estado actual de this.data (atributos, claves, etc.)
	2.	Lo cifra con el hash proporcionado (como contraseña)
	3.	Lo escribe a disco, sobreescribiendo el archivo .me correspondiente.

✅ Se usa múltiples veces: cada vez que haces un cambio y quieres persistirlo (como me.be("artist", "true")).
⚠️ Peligro si confundes:
	•	Llamar save() sin haber hecho create() o unlock() antes → error: No data to save.
	•	Llamar create() sobre un usuario existente → error: Identity already exists.
-----
Me::load()
Carga y desencripta identidad
-----
me.unlock()
Desbloquea identidad
me.lock()
Limpia de RAM
me.be()
Añade atributos
me.addEndorsement()
Añade endoso
me.getAttributes()
Lee atributos
