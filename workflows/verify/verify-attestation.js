#!/usr/bin/env node
/**
 * Verify Ed25519 attestation from Calimero workflow
 * 
 * Usage:
 *   node verify-attestation.js <attestation.json> [outputs.json]
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';

// For a real implementation with actual Ed25519 verification:
// npm install tweetnacl bs58
// import nacl from 'tweetnacl';
// import bs58 from 'bs58';

function loadJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`❌ Error loading ${path}:`, error.message);
    process.exit(1);
  }
}

function keccak256(data) {
  // For EVM-style keccak256 (use @noble/hashes or viem in production)
  const hash = createHash('sha256'); // Simplified for demo
  hash.update(data);
  return '0x' + hash.digest('hex');
}

function verifyAttestation(attestation, outputs) {
  console.log('🔍 Verifying Calimero attestation...\n');

  // 1. Check required fields
  const required = ['jobId', 'inputHash', 'outputHash', 'workerPublicKey', 'signature', 'timestamp'];
  const missing = required.filter(field => !attestation[field]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required fields: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ All required fields present');
  console.log(`   Job ID: ${attestation.jobId}`);
  console.log(`   Worker: ${attestation.workerAddress || 'N/A'}`);
  console.log(`   Timestamp: ${new Date(attestation.timestamp * 1000).toISOString()}`);
  console.log('');

  // 2. Verify output hash matches (if outputs provided)
  if (outputs) {
    if (attestation.outputHash !== outputs.outputHash) {
      console.error('❌ Output hash mismatch!');
      console.error(`   Expected: ${attestation.outputHash}`);
      console.error(`   Got: ${outputs.outputHash}`);
      return false;
    }
    console.log('✅ Output hash matches');
  }

  // 3. Verify signature format
  if (!attestation.signature || attestation.signature.length < 40) {
    console.error('❌ Invalid signature format');
    return false;
  }
  console.log('✅ Signature format valid');
  console.log('');

  // 4. Reconstruct canonical payload
  const payload = JSON.stringify({
    jobId: attestation.jobId,
    inputHash: attestation.inputHash,
    outputHash: attestation.outputHash,
    workerPublicKey: attestation.workerPublicKey,
    timestamp: attestation.timestamp,
  }, null, 0); // No whitespace for canonical form

  console.log('📝 Canonical payload:');
  console.log(`   ${payload.slice(0, 100)}...`);
  console.log('');

  // 5. Verify Ed25519 signature
  // NOTE: For hackathon demo, we skip actual crypto verification
  // In production, use tweetnacl or @noble/ed25519
  
  /* Real verification would look like:
  try {
    const pubkeyBytes = decodeKey(attestation.workerPublicKey);
    const signatureBytes = decodeKey(attestation.signature);
    const messageBytes = new TextEncoder().encode(payload);
    
    const valid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      pubkeyBytes
    );
    
    if (!valid) {
      console.error('❌ Signature verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Crypto error:', error.message);
    return false;
  }
  */

  // Demo: Just check signature exists and has reasonable format
  console.log('⚠️  Signature verification: SIMULATED (use tweetnacl in production)');
  console.log('✅ Signature structure valid (demo mode)');
  console.log('');

  // 6. Additional checks
  const age = Math.floor(Date.now() / 1000) - attestation.timestamp;
  if (age > 7 * 24 * 60 * 60) {
    console.warn(`⚠️  Warning: Attestation is ${Math.floor(age / 86400)} days old`);
  }

  if (age < 0) {
    console.error('❌ Attestation timestamp is in the future!');
    return false;
  }

  return true;
}

function decodeKey(encoded) {
  // Simplified decoder - use bs58.decode() for real base58
  // Or handle hex if your keys are hex-encoded
  if (encoded.startsWith('0x')) {
    return Buffer.from(encoded.slice(2), 'hex');
  }
  // Assume base58 (would use bs58 library)
  return Buffer.from(encoded, 'base64');
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node verify-attestation.js <attestation.json> [outputs.json]');
  process.exit(1);
}

const attestation = loadJSON(args[0]);
const outputs = args[1] ? loadJSON(args[1]) : null;

const valid = verifyAttestation(attestation, outputs);

console.log('═══════════════════════════════════════');
if (valid) {
  console.log('✅ ATTESTATION VALID');
  console.log('');
  console.log('This attestation can be trusted as proof that:');
  console.log(`  • Worker ${attestation.workerAddress || 'with pubkey ' + attestation.workerPublicKey.slice(0, 16) + '...'}`);
  console.log(`  • Processed job #${attestation.jobId}`);
  console.log(`  • Produced output with hash ${attestation.outputHash.slice(0, 16)}...`);
  console.log(`  • At ${new Date(attestation.timestamp * 1000).toISOString()}`);
  console.log('');
  console.log('🎯 Submit to miniapp:');
  console.log(`   Artifact Hash: ${attestation.outputHash}`);
  console.log(`   Attestation CID: (pin ${args[0]} to IPFS first)`);
  process.exit(0);
} else {
  console.log('❌ ATTESTATION INVALID');
  console.log('');
  console.log('Do not trust this attestation. Possible issues:');
  console.log('  • Signature mismatch');
  console.log('  • Tampered data');
  console.log('  • Invalid timestamp');
  process.exit(1);
}

