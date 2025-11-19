import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(405).end('Method Not Allowed');
  }

  const { mode } = request.query;

  let apiKey: string | undefined;

  if (mode === 'guest') {
    apiKey = process.env.PUBLIC_GUEST_API_KEY;
  } else if (mode === 'premium') {
    apiKey = process.env.PREMIUM_API_KEY;
  } else {
    return response.status(400).json({ error: 'Invalid mode specified.' });
  }

  if (!apiKey) {
    console.warn(`API key for mode "${mode}" is not set in environment variables.`);
    return response.status(404).json({ error: `Default API key for ${mode} not found.` });
  }
  
  return response.status(200).json({ apiKey });
}