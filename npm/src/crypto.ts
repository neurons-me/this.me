import sha3 from "js-sha3";
// --- crypto helpers (portable) ---
const { keccak256 } = sha3;
export function asciiToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(buf: Uint8Array): `0x${string}` {
  let hex = "";
  for (let i = 0; i < buf.length; i++) {
    hex += buf[i].toString(16).padStart(2, "0");
  }
  return ("0x" + hex) as `0x${string}`;
}

export function xorEncrypt(value: any, secret: string, path: string[]): `0x${string}` {
  const json = JSON.stringify(value);
  const bytes = asciiToBytes(json);
  const key = keccak256(secret + ":" + path.join("."));
  const keyBytes = asciiToBytes(key);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return bytesToHex(out);
}

export function xorDecrypt(hex: string, secret: string, path: string[]): any {
  try {
    const encryptedBytes = hexToBytes(hex);
    const key = keccak256(secret + ":" + path.join("."));
    const keyBytes = asciiToBytes(key);
    const out = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      out[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    const json = new TextDecoder().decode(out);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isEncryptedBlob(v: any): v is `0x${string}` {
  // Our xorEncrypt always returns 0x + even-length hex bytes. Require at least 1 byte.
  if (typeof v !== "string") return false;
  if (!v.startsWith("0x")) return false;
  const hex = v.slice(2);
  if (hex.length < 2) return false; // at least 1 byte
  if (hex.length % 2 !== 0) return false;
  return /^[0-9a-fA-F]+$/.test(hex);
}