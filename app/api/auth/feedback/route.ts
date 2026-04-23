import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. We ONLY call .send()
    // 2. We do NOT call .get() or fetch details by ID here
    const data = await resend.emails.send({
      from: 'Planfolio <onboarding@resend.dev>',
      to: 'your-real-email@gmail.com', // <--- Use your signup email
      subject: 'New Planfolio Feedback',
      text: message,
    });

    // This returns the REAL ID created by Resend
    return NextResponse.json({ success: true, id: data.data?.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}