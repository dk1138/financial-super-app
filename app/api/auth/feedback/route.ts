import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit';

const MAX_MESSAGE_LENGTH = 5000;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CATEGORIES = new Set(['GENERAL', 'BUG', 'IDEA', 'CALCULATION']);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`feedback:${ip}`, 5, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many feedback requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const toEmail = process.env.FEEDBACK_TO_EMAIL?.trim();
    if (!apiKey || !toEmail) {
      return NextResponse.json(
        { error: 'Feedback email service is not configured.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const rawMessage = body?.message ?? body?.feedback;
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const rawEmail = typeof body?.email === 'string' ? body.email.replace(/[\r\n]/g, '').trim() : '';
    if (rawEmail && (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254)) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    const rawCategory = typeof body?.category === 'string' ? body.category.replace(/[\r\n]/g, '').trim().toUpperCase() : 'GENERAL';
    const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : 'GENERAL';
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};
    const screenshot = body?.screenshot;

    let attachments: { filename: string; content: Buffer }[] | undefined;
    if (screenshot && typeof screenshot.content === 'string' && screenshot.content.length > 0) {
      const buffer = Buffer.from(screenshot.content, 'base64');
      if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { error: 'Screenshot attachment exceeds the 5 MB limit.' },
          { status: 413 }
        );
      }
      const safeFilename =
        typeof screenshot.filename === 'string'
          ? screenshot.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'screenshot.png'
          : 'screenshot.png';
      attachments = [{ filename: safeFilename, content: buffer }];
    }

    const formattedEmail = `
PLANFOLIO USER FEEDBACK [${category}]
============================================================
From: ${rawEmail || 'Anonymous (No email provided)'}
Category: ${category}
Date: ${metadata.timestamp || new Date().toISOString()}

MESSAGE:
------------------------------------------------------------
${message}

TECHNICAL DIAGNOSTICS:
------------------------------------------------------------
- Page URL: ${metadata.url || 'Not recorded'}
- Viewport / Resolution: ${metadata.viewport || 'Not recorded'}
- User Agent: ${metadata.userAgent || 'Not recorded'}
- Language: ${metadata.language || 'Not recorded'}
- Screenshot: ${attachments ? 'Attached below' : 'None provided'}
============================================================
`;

    const subjectCategory =
      category === 'BUG' ? '[BUG REPORT]' :
      category === 'IDEA' ? '[FEATURE IDEA]' :
      category === 'CALCULATION' ? '[CALCULATION / TAX]' : '[FEEDBACK]';

    const resend = new Resend(apiKey);
    const data = await resend.emails.send({
      from: 'Planfolio <onboarding@resend.dev>',
      to: toEmail,
      replyTo: rawEmail || undefined,
      subject: `${subjectCategory} Planfolio Feedback ${rawEmail ? `from ${rawEmail}` : '(Anonymous)'}`,
      text: formattedEmail.trim(),
      attachments,
    });

    return NextResponse.json({ success: true, id: data.data?.id });
  } catch (error: any) {
    console.error('Failed to send email via Resend:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send' }, { status: 500 });
  }
}