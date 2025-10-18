#!/bin/bash
# Demo script to simulate Calimero workflow outputs
# Use this for hackathon demo if you don't have time to build full WASM app

set -e

echo "🔧 Simulating Calimero private job execution..."
echo ""

# Generate mock job result
cat > outputs.json << EOF
{
  "jobId": "0",
  "inputHash": "0x$(openssl rand -hex 32)",
  "outputHash": "0x$(openssl rand -hex 32)",
  "outputCID": "QmSimulated$(openssl rand -hex 4)",
  "timestamp": $(date +%s),
  "success": true,
  "metadata": {
    "taskType": "parse_invoice",
    "duration_ms": 1250,
    "note": "Simulated output for demo"
  }
}
EOF

# Generate mock Ed25519 keypair and signature
# In production, Calimero SDK would handle this
MOCK_PUBKEY="Ed25519_$(openssl rand -base64 32 | tr -d '\n' | tr '/' '_')"
MOCK_SIGNATURE="Sig_$(openssl rand -base64 64 | tr -d '\n' | tr '/' '_')"

OUTPUT_HASH=$(jq -r '.outputHash' outputs.json)

cat > attestation.json << EOF
{
  "jobId": "0",
  "inputHash": "$(jq -r '.inputHash' outputs.json)",
  "outputHash": "$OUTPUT_HASH",
  "workerPublicKey": "$MOCK_PUBKEY",
  "workerAddress": "0x742d35Cc6634C0532925a3b844a96e07d77443Be",
  "timestamp": $(date +%s),
  "signature": "$MOCK_SIGNATURE",
  "version": "1.0",
  "_note": "Simulated attestation for demo purposes"
}
EOF

echo "✅ outputs.json created"
echo "✅ attestation.json created"
echo ""
echo "📝 Output Hash: $OUTPUT_HASH"
echo "🔑 Signature: $MOCK_SIGNATURE"
echo ""
echo "🎯 Next steps:"
echo "   1. Pin attestation.json to IPFS"
echo "   2. Use outputHash + CID in miniapp 'Deliver' form"
echo "   3. Submit transaction to Base chain"
echo ""
echo "Note: This is a mock for demo. Real Calimero would run in Docker with WASM."

