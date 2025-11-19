import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  const { password } = request.body;
  const premiumPassword = process.env.PREMIUM_PASSWORD;

  if (!premiumPassword) {
    console.error("Server configuration error: PREMIUM_PASSWORD is not set.");
    return response.status(500).json({ error: 'Server configuration error.' });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return response.status(400).json({ error: 'Password is required.' });
  }

  if (password === premiumPassword) {
    return response.status(200).json({ success: true });
  } else {
    return response.status(401).json({ success: false, error: 'Invalid password.' });
  }
}