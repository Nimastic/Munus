#!/usr/bin/env node
/**
 * Verify REAL Ed25519 attestation from Calimero workflow
 * 
 * Usage:
 *   node verify-attestation.js <attestation.json> [outputs.json]
 */

import bs58 from 'bs58';
import { readFileSync } from 'fs';
import nacl from 'tweetnacl';

function loadJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`❌ Error loading ${path}:`, error.message);
    process.exit(1);
  }
}

function decodeKey(encoded) {
  // Try hex first
  if (encoded.startsWith('0x')) {
    return Buffer.from(encoded.slice(2), 'hex');
  }
  
  // Try base58 (Calimero default)
  try {
    return bs58.decode(encoded);
  } catch {
    // Fall back to base64
    return Buffer.from(encoded, 'base64');
  }
}

function verifyAttestation(attestation, outputs) {
  console.log('🔍 Verifying Calimero attestation with REAL Ed25519...\n');

  // 1. Check required fields
  const required = ['job_id', 'input_hash', 'output_hash', 'worker_public_key', 'signature', 'timestamp'];
  const missing = required.filter(field => !attestation[field]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required fields: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ All required fields present');
  console.log(`   Job ID: ${attestation.job_id}`);
  console.log(`   Worker: ${attestation.worker_address || 'N/A'}`);
  console.log(`   Timestamp: ${new Date(attestation.timestamp * 1000).toISOString()}`);
  console.log('');

  // 2. Verify output hash matches (if outputs provided)
  if (outputs) {
    const expectedHash = outputs.output_hash || outputs.outputHash;
    const actualHash = attestation.output_hash || attestation.outputHash;
    
    if (actualHash !== expectedHash) {
      console.error('❌ Output hash mismatch!');
      console.error(`   Expected: ${expectedHash}`);
      console.error(`   Got: ${actualHash}`);
      return false;
    }
    console.log('✅ Output hash matches');
  }

  // 3. Reconstruct canonical payload (MUST match Rust signing)
  const payload = JSON.stringify({
    jobId: attestation.job_id,
    inputHash: attestation.input_hash,
    outputHash: attestation.output_hash,
    workerPublicKey: attestation.worker_public_key,
    timestamp: attestation.timestamp,
  });

  console.log('📝 Canonical payload:');
  console.log(`   ${payload.slice(0, 100)}...`);
  console.log('');

  // 4. REAL Ed25519 signature verification
  try {
    console.log('🔐 Verifying Ed25519 signature...');
    
    const messageBytes = new TextEncoder().encode(payload);
    const signatureBytes = decodeKey(attestation.signature);
    const pubkeyBytes = decodeKey(attestation.worker_public_key);

    // Validate key sizes
    if (pubkeyBytes.length !== 32) {
      console.error(`❌ Invalid public key length: ${pubkeyBytes.length} (expected 32)`);
      return false;
    }

    if (signatureBytes.length !== 64) {
      console.error(`❌ Invalid signature length: ${signatureBytes.length} (expected 64)`);
      return false;
    }

    // Verify signature using tweetnacl (libsodium)
    const valid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      pubkeyBytes
    );

    if (!valid) {
      console.error('❌ Signature verification FAILED');
      console.error('   The signature does not match the payload');
      return false;
    }

    console.log('✅ Ed25519 signature VALID');
    console.log('   Cryptographic verification passed');
  } catch (error) {
    console.error('❌ Crypto error:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }

  console.log('');

  // 5. Additional checks
  const age = Math.floor(Date.now() / 1000) - attestation.timestamp;
  if (age > 7 * 24 * 60 * 60) {
    console.warn(`⚠️  Warning: Attestation is ${Math.floor(age / 86400)} days old`);
  }

  if (age < 0) {
    console.error('❌ Attestation timestamp is in the future!');
    return false;
  }

  console.log('✅ Timestamp valid');

  return true;
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node verify-attestation.js <attestation.json> [outputs.json]');
  console.error('');
  console.error('Example:');
  console.error('  node verify-attestation.js attestation.json outputs.json');
  process.exit(1);
}

const attestation = loadJSON(args[0]);
const outputs = args[1] ? loadJSON(args[1]) : null;

const valid = verifyAttestation(attestation, outputs);

console.log('═══════════════════════════════════════');
if (valid) {
  console.log('✅ ATTESTATION VALID');
  console.log('');
  console.log('This attestation is cryptographically verified:');
  console.log(`  • Worker: ${attestation.worker_address || attestation.worker_public_key.slice(0, 16) + '...'}`);
  console.log(`  • Processed job #${attestation.job_id}`);
  console.log(`  • Output hash: ${attestation.output_hash.slice(0, 16)}...`);
  console.log(`  • Timestamp: ${new Date(attestation.timestamp * 1000).toISOString()}`);
  console.log('');
  console.log('🎯 Submit to miniapp:');
  console.log(`   Artifact Hash: ${attestation.output_hash}`);
  console.log(`   Attestation CID: (pin ${args[0]} to IPFS first)`);
  console.log('');
  console.log('IPFS upload command:');
  console.log(`   npx web3.storage put ${args[0]}`);
  process.exit(0);
} else {
  console.log('❌ ATTESTATION INVALID');
  console.log('');
  console.log('⚠️  DO NOT TRUST THIS ATTESTATION');
  console.log('');
  console.log('Possible issues:');
  console.log('  • Signature does not match payload');
  console.log('  • Data has been tampered with');
  console.log('  • Invalid timestamp');
  console.log('  • Wrong public key');
  process.exit(1);
}
