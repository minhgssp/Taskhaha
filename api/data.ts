import { createClient } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is a diagnostic step to confirm if environment variables are available at runtime.
const API_URL = process.env.TASKMANAGER_KV_REST_API_URL || process.env.KV_REST_API_URL;
const API_TOKEN = process.env.TASKMANAGER_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;

// This is a standard Vercel Serverless Function, not a Next.js API Route.
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // --- Start of Diagnostic Checks ---
  if (!API_URL) {
    console.error("Server configuration error: KV_REST_API_URL is not defined in the environment.");
    return response.status(500).json({ error: 'Server configuration error: KV_REST_API_URL is not defined.' });
  }
  if (!API_TOKEN) {
    console.error("Server configuration error: KV_REST_API_TOKEN is not defined in the environment.");
    return response.status(500).json({ error: 'Server configuration error: KV_REST_API_TOKEN is not defined.' });
  }
  // --- End of Diagnostic Checks ---

  const kv = createClient({
    url: API_URL,
    token: API_TOKEN,
  });

  const DATA_KEY = 'taskhaha_app_data';

  // Handle GET request to fetch data
  if (request.method === 'GET') {
    try {
      const data = await kv.get(DATA_KEY);
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
      const body = request.body;
      if (!body) {
         return response.status(400).json({ error: 'Request body is missing.' });
      }
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