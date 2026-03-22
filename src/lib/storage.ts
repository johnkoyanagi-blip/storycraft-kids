/**
 * Storage abstraction layer
 * For MVP: images stored as data URLs in DB
 * This abstraction allows easy swap to S3/R2 later
 */

export interface StorageProvider {
  /**
   * Upload a file and return its URL/key
   * @param key Unique identifier for the file
   * @param data File data as Buffer or base64 string
   * @param contentType MIME type of the file
   * @returns URL to access the file
   */
  upload(key: string, data: Buffer | string, contentType: string): Promise<string>;

  /**
   * Get the URL for an existing file
   * @param key The file's key or URL
   * @returns URL to access the file
   */
  getUrl(key: string): Promise<string>;

  /**
   * Delete a file
   * @param key The file's key or URL
   */
  delete(key: string): Promise<void>;
}

/**
 * MVP: Data URL storage (stored in DB, returned as-is)
 * Images are base64-encoded and embedded as data URLs
 */
export class DataUrlStorage implements StorageProvider {
  async upload(
    key: string,
    data: Buffer | string,
    contentType: string
  ): Promise<string> {
    // If already a data URL, return as-is
    if (typeof data === 'string' && data.startsWith('data:')) {
      return data;
    }

    // Convert Buffer or string to base64
    const base64 =
      typeof data === 'string'
        ? data
        : Buffer.from(data).toString('base64');

    return `data:${contentType};base64,${base64}`;
  }

  async getUrl(key: string): Promise<string> {
    // Data URLs are self-contained, just return as-is
    return key;
  }

  async delete(_key: string): Promise<void> {
    // No-op for data URLs (cleanup happens when DB record is deleted)
  }
}

/**
 * S3-compatible storage provider (for future use)
 * Swap to this when scaling beyond MVP
 */
export class S3Storage implements StorageProvider {
  private region: string;
  private bucket: string;
  private endpoint: string;

  constructor(region: string, bucket: string, endpoint?: string) {
    this.region = region;
    this.bucket = bucket;
    this.endpoint =
      endpoint || `https://s3.${region}.amazonaws.com`;
  }

  async upload(
    _key: string,
    _data: Buffer | string,
    _contentType: string
  ): Promise<string> {
    // Implementation would go here
    // For now, not implemented in MVP
    throw new Error('S3Storage not implemented in MVP');
  }

  async getUrl(key: string): Promise<string> {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async delete(_key: string): Promise<void> {
    // Implementation would go here
    throw new Error('S3Storage not implemented in MVP');
  }
}

/**
 * Cloudflare R2 storage provider (for future use)
 * Similar to S3 but uses Cloudflare's object storage
 */
export class R2Storage implements StorageProvider {
  private accountId: string;
  private bucket: string;
  private endpoint: string;

  constructor(accountId: string, bucket: string) {
    this.accountId = accountId;
    this.bucket = bucket;
    this.endpoint = `https://${bucket}.${accountId}.r2.cloudflarestorage.com`;
  }

  async upload(
    _key: string,
    _data: Buffer | string,
    _contentType: string
  ): Promise<string> {
    // Implementation would go here
    throw new Error('R2Storage not implemented in MVP');
  }

  async getUrl(key: string): Promise<string> {
    return `${this.endpoint}/${key}`;
  }

  async delete(_key: string): Promise<void> {
    // Implementation would go here
    throw new Error('R2Storage not implemented in MVP');
  }
}

/**
 * Global storage instance
 * Change this to use different providers as needed
 */
export const storage = new DataUrlStorage();

/**
 * Helper to create storage key for illustrations
 */
export function createIllustrationKey(storyId: string, pageNumber: number): string {
  return `stories/${storyId}/illustrations/${pageNumber}.png`;
}

/**
 * Helper to create storage key for child drawings
 */
export function createDrawingKey(storyId: string, pageNumber: number): string {
  return `stories/${storyId}/drawings/${pageNumber}.png`;
}

/**
 * Helper to create storage key for composite images
 */
export function createCompositeKey(storyId: string, pageNumber: number): string {
  return `stories/${storyId}/composites/${pageNumber}.png`;
}
