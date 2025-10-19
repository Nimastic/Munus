import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Munus - Chat-native Job Marketplace';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// OpenGraph image generator
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 120,
            height: 120,
            background: 'white',
            borderRadius: 24,
            marginBottom: 40,
            display: 'flex',
          }}
        />
        
        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 20,
          }}
        >
          Munus
        </div>
        
        {/* Subtitle */}
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 40,
          }}
        >
          Chat-native Jobs with AI
        </div>
        
        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {['XMTP', 'Base', 'Civic', 'ENS', 'AI'].map((tag) => (
            <div
              key={tag}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px 24px',
                borderRadius: 8,
                color: 'white',
                fontSize: 24,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

