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

    // 1. Primary Service: Imgur (via IMGUR_CLIENT_ID or anonymous client ID)
    const imgurClientId = (
      process.env.IMGUR_CLIENT_ID ||
      process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID ||
      req.headers.get('x-imgur-client-id') ||
      '546c25a59c58ad7' // Standard anonymous client ID for Imgur API
    ).trim();

    if (imgurClientId) {
      try {
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
        if (contentType.includes('application/json')) {
          const imgurData = await imgurRes.json();
          if (imgurRes.ok && imgurData?.success && imgurData?.data?.link) {
            return NextResponse.json({
              success: true,
              provider: 'Imgur',
              data: {
                url: imgurData.data.link,
                display_url: imgurData.data.link,
                url_viewer: imgurData.data.link,
                delete_hash: imgurData.data.deletehash,
                title: 'Planfolio.ca Summary',
              },
            });
          }
          console.warn('Imgur returned non-success response:', imgurData?.data?.error);
        } else {
          console.warn('Imgur returned non-JSON status:', imgurRes.status);
        }
      } catch (imgurErr: any) {
        console.warn('Imgur fetch error, proceeding to fallback:', imgurErr?.message);
      }
    }

    // 2. Secondary Service: ImgBB (if IMGBB_API_KEY is configured)
    const imgbbKey = (
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
      req.headers.get('x-imgbb-key') ||
      ''
    ).trim();

    if (imgbbKey) {
      try {
        const imgbbParams = new URLSearchParams();
        imgbbParams.append('image', base64Image);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: imgbbParams.toString(),
        });

        const contentType = imgbbRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await imgbbRes.json();
          if (imgbbRes.ok && data?.success && data?.data?.url) {
            return NextResponse.json({
              success: true,
              provider: 'ImgBB',
              data: {
                url: data.data.url,
                display_url: data.data.display_url,
                url_viewer: data.data.url_viewer || data.data.display_url || data.data.url,
                title: 'Planfolio.ca Summary',
              },
            });
          }
        }
      } catch (err: any) {
        console.warn('ImgBB upload error, proceeding to fallback:', err?.message);
      }
    }

    // 3. Fallback Service: Litterbox (Zero-credentials required, direct 72h link)
    return await uploadToLitterbox(imageBlob);
  } catch (error: any) {
    console.error('API proxy error in upload-image route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred during image upload.',
      },
      { status: 500 }
    );
  }
}

async function uploadToLitterbox(imageBlob: Blob) {
  try {
    const uploadForm = new FormData();
    uploadForm.append('reqtype', 'fileupload');
    uploadForm.append('time', '72h'); // 72-hour direct link
    // Pass imageBlob directly to avoid Buffer vs BlobPart type issues in Next.js 16
    uploadForm.append('fileToUpload', imageBlob, 'Planfolio_Summary.png');

    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: uploadForm,
    });

    const url = (await res.text()).trim();
    if (res.ok && url.startsWith('http')) {
      return NextResponse.json({
        success: true,
        provider: 'Litterbox',
        data: {
          url: url,
          display_url: url,
          url_viewer: url,
          note: 'Direct link valid for 72 hours (free anonymous host).',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload to image hosts.' },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Upload host error: ${err?.message}` },
      { status: 500 }
    );
  }
}