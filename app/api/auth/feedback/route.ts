import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.feedback;
    const email = body.email;
    const category = (body.category || 'general').toUpperCase();
    const metadata = body.metadata || {};
    const screenshot = body.screenshot; // { filename, content: base64 }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const formattedEmail = `
PLANFOLIO USER FEEDBACK [${category}]
============================================================
From: ${email ? email.trim() : 'Anonymous (No email provided)'}
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
- Screenshot: ${screenshot ? 'Attached below' : 'None provided'}
============================================================
`;

    const attachments = screenshot && screenshot.content ? [
      {
        filename: screenshot.filename || 'screenshot.png',
        content: Buffer.from(screenshot.content, 'base64'),
      }
    ] : undefined;

    const subjectCategory = 
      category === 'BUG' ? '[BUG REPORT]' :
      category === 'IDEA' ? '[FEATURE IDEA]' :
      category === 'CALCULATION' ? '[CALCULATION / TAX]' : '[FEEDBACK]';

    const data = await resend.emails.send({
      from: 'Planfolio <onboarding@resend.dev>',
      to: 'donaldkwok88@gmail.com',
      replyTo: email && email.trim() ? email.trim() : undefined,
      subject: `${subjectCategory} Planfolio Feedback ${email ? `from ${email}` : '(Anonymous)'}`,
      text: formattedEmail.trim(),
      attachments,
    });

    return NextResponse.json({ success: true, id: data.data?.id });
  } catch (error: any) {
    console.error('Failed to send email via Resend:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send' }, { status: 500 });
  }
}