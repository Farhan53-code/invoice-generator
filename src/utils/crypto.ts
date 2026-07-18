/**
 * Zero-Knowledge Client-Side Encryption Utilities
 * Uses the native Web Crypto API (AES-GCM 256-bit + PBKDF2 SHA-256)
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Derive an AES-GCM key from masterPassword and salt using PBKDF2
async function deriveKey(password: string, saltBuffer: Uint8Array): Promise<CryptoKey> {
  const passwordBuffer = stringToUint8Array(password);
  
  // Import the password as raw key material
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer as any,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive the AES-GCM key
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer as any,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a plaintext string using a master password
 * Returns a serialized format: "saltBase64.ivBase64.ciphertextBase64"
 */
export async function encryptText(plaintext: string, masterPassword: string): Promise<string> {
  if (!plaintext) return "";
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(masterPassword, salt);
    
    const encodedText = stringToUint8Array(plaintext);
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encodedText as any
    );

    const saltBase64 = arrayBufferToBase64(salt.buffer);
    const ivBase64 = arrayBufferToBase64(iv.buffer);
    const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);

    return `${saltBase64}.${ivBase64}.${ciphertextBase64}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data client-side.");
  }
}

/**
 * Decrypt a serialized string back to plaintext using the master password
 * Stored format: "saltBase64.ivBase64.ciphertextBase64"
 */
export async function decryptText(encryptedString: string, masterPassword: string): Promise<string> {
  if (!encryptedString) return "";
  try {
    const parts = encryptedString.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format");
    }

    const [saltBase64, ivBase64, ciphertextBase64] = parts;
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);

    const key = await deriveKey(masterPassword, salt);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.warn("Decryption failed:", error);
    throw new Error("Decryption failed. Incorrect Master Password or corrupted data.");
  }
}

/**
 * Generate a cryptographically secure password verifier string
 * We encrypt a standard constant string ("verification_token") with the master password.
 * If we can decrypt it successfully, the master password is correct.
 */
export async function generateVerifier(masterPassword: string): Promise<string> {
  return await encryptText("verification_token", masterPassword);
}

/**
 * Verify a master password against an encrypted verifier string
 */
export async function verifyMasterPassword(masterPassword: string, verifier: string): Promise<boolean> {
  try {
    const decrypted = await decryptText(verifier, masterPassword);
    return decrypted === "verification_token";
  } catch (error) {
    return false;
  }
}
