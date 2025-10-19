import { NextRequest, NextResponse } from 'next/server';

// Webhook for Base App interactions
// This endpoint receives notifications when users interact with your miniapp

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('Base App webhook received:', body);

    // Handle different event types
    const { event, data } = body;

    switch (event) {
      case 'miniapp.opened':
        // User opened the miniapp
        console.log('Miniapp opened by:', data?.userId);
        break;
      
      case 'miniapp.closed':
        // User closed the miniapp
        console.log('Miniapp closed by:', data?.userId);
        break;
      
      default:
        console.log('Unknown event:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET for verification
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Munus webhook endpoint' 
  });
}

