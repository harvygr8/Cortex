import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  // Allow the client to specify the URL, or default to localhost
  const baseUrl = searchParams.get('url') || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch models: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying Ollama request:', error);
    return NextResponse.json(
      { error: `Failed to connect to Ollama at ${baseUrl}. Make sure it is running.` },
      { status: 500 }
    );
  }
}

