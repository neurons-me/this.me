# .me

###### Everything is just a hash of a knowledge unit

# 📦  Installation

**From crates.io:**

```bash
cargo install this-me
```

**From source locally:**

```bash
cargo install --path .
```

---

## Basic Usage

```
fn main() {
    // Header / logo
    println!(
        "{}",
        "
▄ ▄▄▄▄  ▗▞▀▚▖
  █ █ █ ▐▛▀▀▘
  █   █ ▝▚▄▄▖
             "
            .bright_green()
            .bold()
    );

    // Additional header block
    println!(
        "{}",
        "
   ┓   ┏┓
┓┏┏┣┓┏┓┏┛
┗┻┛┛┗┗┛•
        "
        .bright_white()
        .bold()
    );
```

