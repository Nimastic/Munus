/**
 * IPFS Utilities
 * Fetch job metadata from IPFS
 */

// Use public IPFS gateways
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

export interface JobMetadata {
  title?: string;
  description: string;
  requirements?: string[];
  category?: string;
  skills?: string[];
}

/**
 * Fetch metadata from IPFS CID
 */
export async function fetchJobMetadata(cid: string): Promise<JobMetadata | null> {
  if (!cid || cid === '' || cid === '0x0') {
    return null;
  }

  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cid}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        return data as JobMetadata;
      }
    } catch (error) {
      // Try next gateway
      continue;
    }
  }

  // All gateways failed, return null
  console.warn(`Failed to fetch IPFS content for CID: ${cid}`);
  return null;
}

/**
 * Format job metadata for display
 */
export function formatJobMetadata(metadata: JobMetadata | null): string {
  if (!metadata) {
    return 'No description available';
  }

  let formatted = '';
  
  if (metadata.title) {
    formatted += `**${metadata.title}**\n\n`;
  }
  
  formatted += metadata.description;
  
  if (metadata.requirements && metadata.requirements.length > 0) {
    formatted += '\n\n**Requirements:**\n';
    metadata.requirements.forEach(req => {
      formatted += `• ${req}\n`;
    });
  }
  
  if (metadata.skills && metadata.skills.length > 0) {
    formatted += '\n**Skills:** ' + metadata.skills.join(', ');
  }
  
  return formatted;
}

/**
 * Extract short description (first 100 chars)
 */
export function getShortDescription(metadata: JobMetadata | null): string {
  if (!metadata || !metadata.description) {
    return 'No description';
  }
  
  const desc = metadata.description;
  return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
}

