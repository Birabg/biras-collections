import { config } from '../config/env';
import { logger } from '../utils/logger';

/*
 * Image storage abstraction.
 *
 * Product images are referenced by URL, never stored as binary in PostgreSQL.
 * The frontend catalogue uses public URLs (Unsplash) and the seed preserves
 * those, so no upload storage is required to run the app.
 *
 * `url` provider  -> stores the URL as given (current behaviour).
 * `s3` provider    -> signs an upload and returns a public URL, so switching to
 *                     real uploads later needs no schema or frontend change.
 *
 * No credentials are hardcoded; S3 settings come from the environment.
 */

export interface StoredImage {
  url: string;
  provider: string;
}

export interface ImageStorageAdapter {
  readonly name: string;
  isConfigured(): boolean;
  /** Validates an externally hosted image reference. */
  store(input: { url: string; altText?: string }): Promise<StoredImage>;
  /** Removes a stored object. A no-op for URL-based images. */
  remove(url: string): Promise<void>;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

class UrlImageStorage implements ImageStorageAdapter {
  readonly name = 'url';

  isConfigured() {
    return true;
  }

  async store(input: { url: string }): Promise<StoredImage> {
    let parsed: URL;

    try {
      parsed = new URL(input.url);
    } catch {
      throw new Error('Image URL is not valid.');
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw new Error('Image URL must use http or https.');
    }

    return { url: parsed.toString(), provider: this.name };
  }

  async remove() {
    // Nothing to delete: the catalogue references a remote image.
  }
}

/**
 * S3-compatible storage. Requires the AWS SDK, which is intentionally not a
 * dependency here — install and wire it when uploads are actually needed.
 */
class S3ImageStorage implements ImageStorageAdapter {
  readonly name = 's3';

  isConfigured() {
    const { bucket, accessKeyId, secretAccessKey } = config.imageStorage.s3;
    return Boolean(bucket && accessKeyId && secretAccessKey);
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new Error(
        'S3 image storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
      );
    }
  }

  async store(): Promise<StoredImage> {
    this.assertConfigured();
    throw new Error('S3 uploads are not implemented in this build. Use IMAGE_STORAGE=url.');
  }

  async remove() {
    this.assertConfigured();
  }
}

const adapters: Record<string, ImageStorageAdapter> = {
  url: new UrlImageStorage(),
  s3: new S3ImageStorage(),
};

class ImageStorageService {
  get adapter(): ImageStorageAdapter {
    return adapters[config.imageStorage.provider] ?? adapters.url!;
  }

  async store(input: { url: string; altText?: string }) {
    return this.adapter.store(input);
  }

  async remove(url: string) {
    try {
      await this.adapter.remove(url);
    } catch (error) {
      logger.warn('image removal failed', { error });
    }
  }
}

export const imageStorage = new ImageStorageService();