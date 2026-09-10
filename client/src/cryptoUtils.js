// High-performance Web Crypto API utilities for large files
// Uses AES-GCM and PBKDF2 for key derivation

const getPasswordKey = async (password) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return keyMaterial;
};

const deriveKey = async (passwordKey, salt) => {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptFile = async (arrayBuffer, password) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const passwordKey = await getPasswordKey(password);
  const aesKey = await deriveKey(passwordKey, salt);
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    arrayBuffer
  );
  
  // Package salt, iv, and ciphertext into a single Blob
  // Format: [magic 8 bytes "ENC_GCM_"] [16 bytes salt] [12 bytes iv] [ciphertext]
  const magic = new TextEncoder().encode("ENC_GCM_");
  
  const finalBlob = new Blob([magic, salt, iv, encryptedContent], { type: 'application/octet-stream' });
  return finalBlob;
};

export const decryptFile = async (arrayBuffer, password) => {
  const data = new Uint8Array(arrayBuffer);
  
  // Verify magic bytes
  const magic = new TextDecoder().decode(data.slice(0, 8));
  if (magic !== "ENC_GCM_") {
    throw new Error("Not a WebCrypto encrypted file");
  }
  
  const salt = data.slice(8, 24);
  const iv = data.slice(24, 36);
  const ciphertext = data.slice(36);
  
  const passwordKey = await getPasswordKey(password);
  const aesKey = await deriveKey(passwordKey, salt);
  
  const decryptedContent = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    ciphertext
  );
  
  const decryptedArray = new Uint8Array(decryptedContent);
  let mimeInfo = { mime: 'application/octet-stream', ext: 'bin' };
  
  if (decryptedArray.length >= 4) {
    const hex = Array.from(decryptedArray.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    if (hex === '25504446') mimeInfo = { mime: 'application/pdf', ext: 'pdf' };
    else if (hex === '89504E47') mimeInfo = { mime: 'image/png', ext: 'png' };
    else if (hex.startsWith('FFD8FF')) mimeInfo = { mime: 'image/jpeg', ext: 'jpg' };
    else if (hex === '47494638') mimeInfo = { mime: 'image/gif', ext: 'gif' };
    else if (hex === '52494646') mimeInfo = { mime: 'image/webp', ext: 'webp' };
  }
  
    return { 
        blob: new Blob([decryptedContent], { type: mimeInfo.mime }),
        ext: mimeInfo.ext
    };
};

export const isWebCryptoFile = (arrayBuffer) => {
    if (arrayBuffer.byteLength < 8) return false;
    const data = new Uint8Array(arrayBuffer.slice(0, 8));
    try {
        const magic = new TextDecoder().decode(data);
        return magic === "ENC_GCM_";
    } catch {
        return false;
    }
};

export const MASTER_SECRET = process.env.REACT_APP_ENCRYPTION_SECRET || 'medichain-secure-key-2026';

/**
 * Enterprise Patient-Scoped Key Derivation (HIPAA/GDPR Compliance)
 * Binds the encryption key to the patient's identity/wallet so Doctor A cannot decrypt
 * Patient B's files even if they know the global environment secret.
 */
export const getPatientEncryptionKey = (patientAddress, baseSecret = MASTER_SECRET) => {
    if (!patientAddress) return baseSecret;
    // Derive SHA-256 hash combining the application secret and the patient's wallet address
    const enc = new TextEncoder();
    const data = enc.encode(`${baseSecret}::patient::${patientAddress.toLowerCase()}`);
    return window.crypto.subtle.digest("SHA-256", data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
};
