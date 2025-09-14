import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Let the client-side handle the routing
  return NextResponse.next();
}

export const config = {
  matcher: [],
}; 