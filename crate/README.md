# .me

**Everything is just a hash of a knowledge unit**

###### 📦 Installation

**From crates.io:**

```bash
cargo install this-me
```

**From source locally:**

```bash
cargo install --path .
```

---

###### Basic Usage
Create a new `.me` identity:

```bash
me --create --usr suign --pin 1234
```

Each `.me` command follows the pattern:

```bash
me --usr <username> --pin <password> --verb <key:value> --subject <key:value> --predicate <key:value> --context <context>
```

---

## Relational Examples
Express your relationships and connections with simple commands:

```bash
me --usr suign --pin 1234 --verb relate --subject friend --predicate family member
me --usr suign --pin 1234 --verb call --subject john.doe --predicate certify healthcare
me --usr suign --pin 1234 --verb relate --subject partner --predicate us citizen
```

---

## Practical Examples
Store your belongings, credentials, and context declaratively:

```bash
me --username suign --password 1234 --verb have --subject wallet --predicate "eth:0xabc123"
me --username suign --password 1234 --verb have --subject cleaker.app:pass123 --predicate "wallet passsord"
me --username suign --password 1234 --verb at --subject location --predicate "Veracruz"
me --username suign --password 1234 --verb be --subject role --predicate "software developer."
```

---

## Retrieving Data
Query your stored sentences easily:

```bash
me get --usr suign --pin 1234 --verb be
me get --usr suign --pin 1234 --verb have
me get --usr suign --pin 1234 --verb relate --subject @emmaar
me get --usr suign --pin 1234 --verb all
```

---

 — you remember sentences.

| **Table**      | **Purpose**                                                  |
| -------------- | ------------------------------------------------------------ |
| **me**         | Contains the main identity (username, public/private keys, creation timestamp) |
| **keys**       | Registered keys, contexts, or addresses associated with the user |
| **objects**    | Anything that can act as a subject or object in a relation — users, things, concepts |
| **verbs**      | Available verbs (can be created dynamically, not hardcoded)  |
| **predicates** | Qualifiers or modifiers of verbs (e.g., “in”, “for”, “with”) |
| **relations**  | Connects objects through verbs, optionally with predicates or context |
---

1. main.rs → el binario CLI
	Este archivo compila en el ejecutable llamado me.
	Su función no es lógica, sino de orquestación y UX:
	•	Lee argumentos con clap (vía cli.rs).
	•	Llama a funciones de la librería (this_me::me).
	•	Muestra salida colorida y legible en terminal.
	•	No contiene lógica de dominio ni manipula la base directamente.

📦 En otras palabras:
main.rs = interfaz (CLI wrapper)
lib.rs + core/ = lógica del sistema .me

2. cli.rs → interfaz de argumentos
Define qué parámetros acepta el CLI:

me --username abella --password 1234 --verb have --key wallet --value eth

