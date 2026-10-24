import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');

    if (!image || typeof image === 'string') {
      return NextResponse.json(
        { success: false, error: 'No image file found in the upload request.' },
        { status: 400 }
      );
    }

    const imageBlob = image as Blob;
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const imgurClientId = (
      process.env.IMGUR_CLIENT_ID ||
      process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID ||
      req.headers.get('x-imgur-client-id') ||
      '546c25a59c58ad7'
    ).trim();

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