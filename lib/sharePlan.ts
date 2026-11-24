export interface SharePlanOptions {
  anonymize?: boolean;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const padLen = (4 - (b64url.length % 4)) % 4;
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function preparePlanForSharing(data: any, options: SharePlanOptions = { anonymize: true }) {
  const cloned = JSON.parse(JSON.stringify(data || {}));
  delete cloned.constants;
  delete cloned.history;

  if (options.anonymize !== false) {
    if (Array.isArray(cloned.properties)) {
      cloned.properties = cloned.properties.map((p: any, idx: number) => ({
        ...p,
        name: idx === 0 ? 'Primary Residence' : `Property ${idx + 1}`,
      }));
    }
    if (Array.isArray(cloned.dependents)) {
      cloned.dependents = cloned.dependents.map((d: any, idx: number) => ({
        ...d,
        name: `Dependent ${idx + 1}`,
      }));
    }
    if (Array.isArray(cloned.windfalls)) {
      cloned.windfalls = cloned.windfalls.map((w: any, idx: number) => ({
        ...w,
        name: `Windfall ${idx + 1}`,
      }));
    }
    if (Array.isArray(cloned.additionalIncome)) {
      cloned.additionalIncome = cloned.additionalIncome.map((a: any, idx: number) => ({
        ...a,
        name: `Additional Income ${idx + 1}`,
      }));
    }
    if (Array.isArray(cloned.customAssets)) {
      cloned.customAssets = cloned.customAssets.map((c: any, idx: number) => ({
        ...c,
        name: `Custom Asset ${idx + 1}`,
      }));
    }
    if (Array.isArray(cloned.debt)) {
      cloned.debt = cloned.debt.map((d: any, idx: number) => ({
        ...d,
        name: `Expense / Debt ${idx + 1}`,
      }));
    }
  }

  return cloned;
}

export async function encodePlanToHash(
  data: any,
  options: SharePlanOptions = { anonymize: true }
): Promise<string> {
  const payload = preparePlanForSharing(data, options);
  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));

  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(jsonBytes);
    writer.close();
    const compressedBuffer = await new Response(cs.readable).arrayBuffer();
    return `gz:${bytesToBase64Url(new Uint8Array(compressedBuffer))}`;
  }

  return `raw:${bytesToBase64Url(jsonBytes)}`;
}

export async function decodePlanFromHash(hashOrValue: string): Promise<any | null> {
  if (!hashOrValue || typeof hashOrValue !== 'string') return null;

  let encoded = hashOrValue.trim();
  if (encoded.startsWith('#')) encoded = encoded.slice(1);
  if (encoded.startsWith('plan=')) encoded = encoded.slice(5);
  if (!encoded) return null;

  try {
    let jsonStr = '';
    if (encoded.startsWith('gz:')) {
      if (typeof DecompressionStream === 'undefined') return null;
      const bytes = base64UrlToBytes(encoded.slice(3));
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(new Uint8Array(bytes));
      writer.close();
      const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
      jsonStr = new TextDecoder().decode(decompressedBuffer);
    } else if (encoded.startsWith('raw:')) {
      const bytes = base64UrlToBytes(encoded.slice(4));
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object' || !parsed.inputs) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
