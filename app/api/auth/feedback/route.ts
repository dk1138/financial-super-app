import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { message } = await request.json();

  try {
    await resend.emails.send({
      from: 'Planfolio <onboarding@resend.dev>', // You can change this once you verify your domain
      to: 'don@pixealexea.resend.app',
      subject: 'New Planfolio Feedback',
      text: message,
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error });
  }
}