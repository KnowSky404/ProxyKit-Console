import { PREVIEW_LIMIT } from '../config/sources';
export class ResourceError extends Error {
  constructor(
    public code:
      | 'resource_not_found'
      | 'upstream_unavailable'
      | 'preview_too_large'
      | 'unsupported_text',
    public status: number,
  ) {
    super(code);
  }
}
export async function readPreview(response: Response): Promise<string> {
  if (!response.ok)
    throw new ResourceError(
      response.status === 404 ? 'resource_not_found' : 'upstream_unavailable',
      response.status === 404 ? 404 : 502,
    );
  if (Number(response.headers.get('content-length')) > PREVIEW_LIMIT) {
    await response.body?.cancel();
    throw new ResourceError('preview_too_large', 413);
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > PREVIEW_LIMIT) {
        await reader.cancel();
        throw new ResourceError('preview_too_large', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (text.includes('\0')) throw new Error('Binary');
    return text;
  } catch {
    throw new ResourceError('unsupported_text', 415);
  }
}
