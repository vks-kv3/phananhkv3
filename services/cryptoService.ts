// Mã hóa đầu-cuối cho đơn phản ánh.
//
// - Mỗi đơn được mã hóa bằng một khóa AES-256-GCM ngẫu nhiên, sinh ngay trên máy người dân.
// - Khóa AES đó được "khóa" lại bằng khóa công khai RSA-OAEP 3072 của Viện kiểm sát.
// - Chỉ ai có tệp chìa khóa bí mật (lưu trên máy/USB của quản trị viên) mới giải mã được.
// - Firebase/Google chỉ lưu dữ liệu đã mã hóa.

export const KEY_FILE_TYPE = 'VKSKV3-chia-khoa-giai-ma';
export const ENC_VERSION = 1;

const RSA_PARAMS: RsaHashedKeyGenParams = {
  name: 'RSA-OAEP',
  modulusLength: 3072,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};
const RSA_IMPORT = { name: 'RSA-OAEP', hash: 'SHA-256' };

export interface EncryptedPayload {
  v: number;          // phiên bản định dạng
  kid: string;        // dấu vân tay của khóa công khai đã dùng
  key: string;        // khóa AES đã được bọc bằng RSA (base64)
  iv: string;         // vector khởi tạo AES-GCM (base64)
  data: Uint8Array;   // nội dung đã mã hóa
}

export interface KeyFile {
  type: string;
  version: number;
  createdAt: string;
  fingerprint: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

const toB64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

const fromB64 = (b64: string): Uint8Array => {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

// Dấu vân tay ngắn của khóa công khai, dùng để đối chiếu đúng cặp khóa
export const fingerprintOf = async (publicJwk: JsonWebKey): Promise<string> => {
  const canonical = JSON.stringify({ e: publicJwk.e, kty: publicJwk.kty, n: publicJwk.n });
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  const hex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 16).toUpperCase().match(/.{4}/g)!.join('-');
};

// Tạo cặp khóa mới (chạy trên máy quản trị viên)
export const generateKeyFile = async (): Promise<KeyFile> => {
  const pair = await crypto.subtle.generateKey(RSA_PARAMS, true, ['encrypt', 'decrypt']);
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return {
    type: KEY_FILE_TYPE,
    version: 1,
    createdAt: new Date().toISOString(),
    fingerprint: await fingerprintOf(publicKeyJwk),
    publicKeyJwk,
    privateKeyJwk,
  };
};

// Đọc tệp chìa khóa, kiểm tra hợp lệ, trả về khóa giải mã + dấu vân tay
export const loadKeyFile = async (text: string): Promise<{ privateKey: CryptoKey; fingerprint: string; publicKeyJwk: JsonWebKey }> => {
  let file: KeyFile;
  try {
    file = JSON.parse(text);
  } catch {
    throw new Error('Tệp không đúng định dạng chìa khóa.');
  }
  if (file?.type !== KEY_FILE_TYPE || !file.privateKeyJwk || !file.publicKeyJwk) {
    throw new Error('Đây không phải tệp chìa khóa giải mã của hệ thống.');
  }
  const fingerprint = await fingerprintOf(file.publicKeyJwk);
  let privateKey: CryptoKey;
  try {
    privateKey = await crypto.subtle.importKey('jwk', file.privateKeyJwk, RSA_IMPORT, false, ['decrypt']);
  } catch {
    throw new Error('Tệp chìa khóa bị hỏng, không đọc được khóa bí mật.');
  }
  // Thử mã hóa rồi giải mã để chắc chắn khóa bí mật khớp khóa công khai
  const mismatch = 'Tệp chìa khóa bị hỏng: khóa bí mật không khớp khóa công khai.';
  const probe = crypto.getRandomValues(new Uint8Array(16));
  let back: Uint8Array;
  try {
    const pub = await crypto.subtle.importKey('jwk', file.publicKeyJwk, RSA_IMPORT, false, ['encrypt']);
    back = new Uint8Array(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey,
      await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pub, probe)));
  } catch {
    throw new Error(mismatch);
  }
  if (back.length !== probe.length || back.some((b, i) => b !== probe[i])) {
    throw new Error(mismatch);
  }
  return { privateKey, fingerprint, publicKeyJwk: file.publicKeyJwk };
};

// Mã hóa một đối tượng bất kỳ bằng khóa công khai
export const encryptObject = async (obj: unknown, publicJwk: JsonWebKey): Promise<EncryptedPayload> => {
  const publicKey = await crypto.subtle.importKey('jwk', publicJwk, RSA_IMPORT, false, ['encrypt']);
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(obj));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plain));
  const rawAes = await crypto.subtle.exportKey('raw', aesKey);
  const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAes);
  return { v: ENC_VERSION, kid: await fingerprintOf(publicJwk), key: toB64(wrapped), iv: toB64(iv), data };
};

// Giải mã bằng khóa bí mật
export const decryptObject = async <T = unknown>(enc: EncryptedPayload, privateKey: CryptoKey): Promise<T> => {
  const rawAes = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromB64(enc.key));
  const aesKey = await crypto.subtle.importKey('raw', rawAes, { name: 'AES-GCM' }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(enc.iv) }, aesKey, enc.data);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
};
