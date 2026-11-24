import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`upload-image:${ip}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many image upload requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
      );
    }

    const imgurClientId = process.env.IMGUR_CLIENT_ID?.trim();
    if (!imgurClientId) {
      return NextResponse.json(
        { success: false, error: 'Image upload service is not configured.' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const image = formData.get('image');

    if (!image || typeof image === 'string') {
      return NextResponse.json(
        { success: false, error: 'No image file found in the upload request.' },
        { status: 400 }
      );
    }

    const imageBlob = image as Blob;
    if (!ALLOWED_MIME_TYPES.has(imageBlob.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported image format. Please upload PNG, JPEG, or WebP.' },
        { status: 415 }
      );
    }

    if (imageBlob.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Image exceeds the 5 MB upload limit.' },
        { status: 413 }
      );
    }

    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const imgurForm = new FormData();
    imgurForm.append('image', base64Image);
    imgurForm.append('type', 'base64');
    imgurForm.append('title', 'Planfolio.ca Summary');

    const imgurRes = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${imgurClientId}`,
      },
      body: imgurForm,
    });

    const contentType = imgurRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: `Imgur returned unexpected status (${imgurRes.status}).` },
        { status: imgurRes.status || 500 }
      );
    }

    const imgurData = await imgurRes.json();

    if (!imgurRes.ok || !imgurData?.success || !imgurData?.data?.link) {
      const errorDetail =
        typeof imgurData?.data?.error === 'string'
          ? imgurData.data.error
          : imgurData?.data?.error?.message || 'Imgur upload failed.';
      return NextResponse.json(
        { success: false, error: errorDetail },
        { status: imgurRes.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'Imgur',
      data: {
        url: imgurData.data.link,
        delete_hash: imgurData.data.deletehash,
      },
    });
  } catch (error: any) {
    console.error('Error uploading to Imgur:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred during Imgur upload.',
      },
      { status: 500 }
    );
  }
}