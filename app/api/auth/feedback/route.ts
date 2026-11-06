import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.feedback;
    const email = body.email;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const emailBody = email 
      ? `User Email: ${email}\n\nFeedback:\n${message}`
      : `User Email: Anonymous (No email provided)\n\nFeedback:\n${message}`;

    const data = await resend.emails.send({
      from: 'Planfolio <onboarding@resend.dev>',
      to: 'donaldkwok88@gmail.com',
      replyTo: email && email.trim() ? email.trim() : undefined,
      subject: email ? `New Planfolio Feedback from ${email}` : 'New Planfolio Feedback (Anonymous)',
      text: emailBody,
    });

    return NextResponse.json({ success: true, id: data.data?.id });
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}