### **✅ Resumen de responsabilidades:**

| **Archivo** | **Rol**                                                      |
| ----------- | ------------------------------------------------------------ |
| main.rs     | Orquesta el flujo principal. Llama comandos. No se mete con SQL. |
| cli.rs      | Define la interfaz de línea de comandos (argumentos, subcomandos). |
| lib.rs      | Expone módulos si el crate se usa como librería. No toca conexiones. |
| me.rs       | 🧠 *La mente del usuario.* Maneja todo: validación, conexión SQL, lógica de verbos, carga y persistencia. |