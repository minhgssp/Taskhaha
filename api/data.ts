import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Define a consistent key for our data blob in Vercel KV
const DATA_KEY = 'zenith_app_data';

// This is a standard Vercel Serverless Function, not a Next.js API Route.
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Handle GET request to fetch data
  if (request.method === 'GET') {
    try {
      const data = await kv.get(DATA_KEY);
      // If no data is found (e.g., first time running), return a default empty state.
      if (!data) {
        return response.status(200).json({ tasks: [], notes: [] });
      }
      return response.status(200).json(data);
    } catch (error) {
      console.error('KV GET Error:', error);
      return response.status(500).json({ error: 'Failed to fetch data from KV store.' });
    }
  }

  // Handle POST request to save data
  if (request.method === 'POST') {
    try {
      // The body is already parsed by Vercel for serverless functions
      const body = request.body;
      if (!body) {
         return response.status(400).json({ error: 'Request body is missing.' });
      }
      // Use kv.set to store the entire JSON object.
      await kv.set(DATA_KEY, body);
      return response.status(200).json({ success: true });
    } catch (error) {
      console.error('KV SET Error:', error);
      return response.status(500).json({ error: 'Failed to save data to KV store.' });
    }
  }

  // Handle other methods
  response.setHeader('Allow', ['GET', 'POST']);
  return response.status(405).end(`Method ${request.method} Not Allowed`);
}
