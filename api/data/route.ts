import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// Define a consistent key for our data blob in Vercel KV
const DATA_KEY = 'zenith_app_data';

// GET /api/data
// Fetches the entire application data (tasks and notes) from Vercel KV.
export async function GET() {
  try {
    const data = await kv.get(DATA_KEY);
    // If no data is found (e.g., first time running), return a default empty state.
    if (!data) {
      return NextResponse.json({ tasks: [], notes: [] });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from KV store.' }, { status: 500 });
  }
}

// POST /api/data
// Receives the application data from the client and overwrites the existing data in Vercel KV.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Use kv.set to store the entire JSON object.
    // The 'ex' (expire) and 'nx' (not exist) options are not needed here
    // as we want to simply overwrite the data every time.
    await kv.set(DATA_KEY, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV SET Error:', error);
    return NextResponse.json({ error: 'Failed to save data to KV store.' }, { status: 500 });
  }
}
