import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');
    const requestedService = (formData.get('service') as string) || 'auto'; // 'auto' | 'imgbb' | 'litterbox'

    if (!image || typeof image === 'string') {
      return NextResponse.json(
        { success: false, error: 'No image file found in the upload request.' },
        { status: 400 }
      );
    }

    const imageBlob = image as Blob;

    // 1. Check for ImgBB API key from server environment or request headers
    const apiKey = (
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
      req.headers.get('x-imgbb-key') ||
      ''
    ).trim();

    // 2. If user specifically requested Litterbox or no ImgBB key is configured, use Litterbox directly
    if (requestedService === 'litterbox' || (!apiKey && requestedService === 'auto')) {
      return await uploadToLitterbox(imageBlob);
    }

    // 3. Try ImgBB first if key is present
    if (apiKey) {
      try {
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const imgbbParams = new URLSearchParams();
        imgbbParams.append('image', base64Image);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
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
                delete_url: data.data.delete_url,
                title: data.data.title,
              },
            });
          }
          console.warn('ImgBB returned error status:', data?.error?.message);
        } else {
          console.warn('ImgBB returned non-JSON response status:', imgbbRes.status);
        }
      } catch (err: any) {
        console.warn('ImgBB network request failed, attempting fallback:', err?.message);
      }
    }

    // 4. Automatic Fallback: Upload to Litterbox (free, no API key needed, direct 72h link)
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
    // Pass imageBlob directly to FormData.append to avoid Buffer <-> BlobPart type incompatibility in Next 16 / TS 5.5+
    uploadForm.append('fileToUpload', imageBlob, 'Retirement_Summary.png');

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
          note: 'Direct link valid for 72 hours (no API key required).',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to upload to both ImgBB and Litterbox.' },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Upload host error: ${err?.message}` },
      { status: 500 }
    );
  }
}