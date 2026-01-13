import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// GCS Configuration
const GCS_BUCKET = process.env.GCS_BUCKET || 'audiotextdata';
const GCS_PREFIX = process.env.GCS_PREFIX || 'sadakopa/semantic-vad/benchmark_collections';
const GCS_CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize GCS client
let storageClient: Storage | null = null;

function getStorageClient(): Storage | null {
  if (!storageClient) {
    try {
      if (GCS_CREDENTIALS_PATH) {
        storageClient = new Storage({
          keyFilename: GCS_CREDENTIALS_PATH,
        });
      } else if (process.env.GOOGLE_CREDENTIALS_JSON) {
        // For Vercel deployment - credentials as JSON string
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        storageClient = new Storage({
          credentials,
        });
      } else {
        console.warn('No GCS credentials found');
        return null;
      }
    } catch (error) {
      console.error('Failed to initialize GCS client:', error);
      return null;
    }
  }
  return storageClient;
}

/**
 * Convert WebM audio to WAV format (16kHz, mono, 16-bit PCM)
 * This is a simple conversion - for production, consider using ffmpeg
 */
async function convertToWav(webmBuffer: Buffer): Promise<Buffer> {
  // For now, we'll store as WebM since browser MediaRecorder outputs WebM
  // The audio is already 16kHz from the recorder settings
  // WAV conversion would require ffmpeg or a native module
  
  // Return as-is for now - the audio is already in a good format
  // TODO: Add ffmpeg-based conversion if WAV is strictly required
  return webmBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename with date prefix for organization
    const date = new Date();
    const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    const fileId = uuidv4();
    // Store as .webm (browser native format) - can be converted to wav later if needed
    const filename = `${GCS_PREFIX}/${datePrefix}/${fileId}.webm`;

    const storage = getStorageClient();

    if (storage) {
      // Upload to Google Cloud Storage
      const bucket = storage.bucket(GCS_BUCKET);
      const file = bucket.file(filename);

      // Convert Blob to Buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload with metadata (no makePublic - bucket already has appropriate permissions)
      await file.save(buffer, {
        metadata: {
          contentType: 'audio/webm',
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalFormat: 'webm',
          },
        },
      });

      // GCS path for internal reference
      const gcsPath = `gs://${GCS_BUCKET}/${filename}`;
      // Public URL (if bucket is public) or use signed URLs
      const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        gcsPath: gcsPath,
        filename,
        storage: 'gcs',
        size: buffer.length,
        format: 'webm',
      });
    } else {
      // Fallback: Save as base64 data URL (for local dev without GCS)
      console.warn('GCS not available, using base64 fallback (not recommended for production)');
      
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:audio/webm;base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        gcsPath: null,
        filename: `local/${uuidv4()}.webm`,
        storage: 'base64',
        size: arrayBuffer.byteLength,
        format: 'webm',
        warning: 'Using base64 fallback - configure GCS for production',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload audio: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Storage capacity info endpoint
export async function GET() {
  const storage = getStorageClient();
  
  if (!storage) {
    return NextResponse.json({
      success: true,
      storage: 'none',
      message: 'No GCS configured - using base64 fallback',
    });
  }

  try {
    const bucket = storage.bucket(GCS_BUCKET);
    const [files] = await bucket.getFiles({ prefix: GCS_PREFIX, maxResults: 1000 });
    
    let totalSize = 0;
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      totalSize += parseInt(metadata.size as string) || 0;
    }

    return NextResponse.json({
      success: true,
      storage: 'gcs',
      bucket: GCS_BUCKET,
      prefix: GCS_PREFIX,
      totalFiles: files.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get storage info: ' + (error as Error).message,
    });
  }
}
