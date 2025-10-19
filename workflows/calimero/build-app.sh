#!/bin/bash
# Build Calimero WASM app and copy to workflows

set -e

echo "🔨 Building Calimero WASM application..."
echo ""

# Navigate to app directory
cd "$(dirname "$0")/../../packages/calimero-app"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust not found. Install from https://rustup.rs/"
    exit 1
fi

# Check if wasm32 target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Build release
echo "📦 Building WASM (release mode)..."
cargo build --target wasm32-unknown-unknown --release

# Copy to workflows
echo "📋 Copying WASM to workflows..."
mkdir -p ../../workflows/calimero/apps
cp target/wasm32-unknown-unknown/release/munus_job_processor.wasm \
   ../../workflows/calimero/apps/job_processor.wasm

# Get file size
SIZE=$(du -h ../../workflows/calimero/apps/job_processor.wasm | cut -f1)

echo ""
echo "✅ Build complete!"
echo "📦 WASM size: $SIZE"
echo "📍 Location: workflows/calimero/apps/job_processor.wasm"
echo ""
echo "Next steps:"
echo "  cd workflows/calimero"
echo "  merobox bootstrap run workflow.yml"

