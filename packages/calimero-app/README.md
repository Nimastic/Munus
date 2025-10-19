# Munus Calimero Job Processor

**Real Calimero WASM application for private job processing with attestations**

This is a production Calimero application (not a simulation) that processes jobs locally and generates cryptographic attestations.

---

## 🏗️ **What This Does**

1. **Private Processing**: Runs on worker's machine in Docker (Merobox)
2. **Job Types**:
   - `parse_invoice` - Extract data from invoices (OCR/PDF parsing)
   - `generate_report` - Create reports from data
   - `process_data` - Generic data processing
3. **Attestations**: Ed25519 signatures proving work was done
4. **Privacy**: Sensitive data never leaves worker's machine

---

## 📋 **Prerequisites**

- **Rust** (for building WASM): https://rustup.rs/
- **wasm32 target**: `rustup target add wasm32-unknown-unknown`
- **Merobox**: `pipx install merobox` or `brew install merobox`
- **Docker**: For running Calimero nodes

---

## 🚀 **Build**

```bash
# From this directory
cargo build --target wasm32-unknown-unknown --release

# Copy to workflows
cp target/wasm32-unknown-unknown/release/munus_job_processor.wasm \
   ../../workflows/calimero/apps/job_processor.wasm
```

Or use the convenience script:

```bash
../../workflows/calimero/build-app.sh
```

---

## 🧪 **Run Locally with Merobox**

```bash
cd ../../workflows/calimero

# Run the full workflow
merobox bootstrap run workflow.yml \
  -v JOB_ID=0 \
  -v RESOURCE_CID=QmExampleInvoiceCID \
  -v TASK_TYPE=parse_invoice \
  -v WORKER_ADDRESS=0x742d35Cc6634C0532925a3b844a96e07d77443Be

# Check outputs
cat outputs.json       # Job results
cat attestation.json   # Signed attestation
```

---

## 📦 **Output Files**

### `outputs.json`
```json
{
  "jobId": "0",
  "inputHash": "0x1234...",
  "outputHash": "0x5678...",
  "outputCID": "QmOutput...",
  "timestamp": 1729123456,
  "success": true,
  "metadata": {
    "taskType": "parse_invoice",
    "duration_ms": 1250,
    "workerAddress": "0x742d35Cc..."
  }
}
```

### `attestation.json`
```json
{
  "jobId": "0",
  "inputHash": "0x1234...",
  "outputHash": "0x5678...",
  "workerPublicKey": "base58-ed25519-pubkey",
  "workerAddress": "0x742d35Cc...",
  "timestamp": 1729123456,
  "signature": "base58-ed25519-signature",
  "version": "1.0"
}
```

---

## 🔐 **Verification**

```bash
cd ../../workflows/verify

# Install real crypto libraries
pnpm install

# Verify attestation
node verify-attestation.js ../calimero/attestation.json ../calimero/outputs.json

# Expected output:
# ✅ ATTESTATION VALID
# Ed25519 signature verified
```

---

## 🔧 **Development**

### **Adding New Task Types**

Edit `src/lib.rs`:

```rust
fn process_ocr_document(&self, input_cid: &str) -> app::Result<String> {
    // 1. Fetch PDF from IPFS
    // 2. Run OCR
    // 3. Extract text
    // 4. Return processed data
    Ok(extracted_text)
}

// Add to process_job match statement
"ocr_document" => self.process_ocr_document(&input_cid)?,
```

### **Testing**

```bash
# Build
cargo build --target wasm32-unknown-unknown --release

# Run workflow
cd ../../workflows/calimero
merobox bootstrap run workflow.yml -v JOB_ID=test-1

# Check logs
docker logs calimero-node-1
```

---

## 📚 **Calimero SDK Reference**

| Function | Purpose |
|----------|---------|
| `env::time_now()` | Get current timestamp (ms) |
| `env::executor_id()` | Get current user's public key |
| `env::sign(bytes)` | Sign data with Ed25519 |
| `app::emit!()` | Emit event to subscribers |
| `app::bail!()` | Return error |

---

## 🎯 **Integration with Munus**

### **1. Worker runs workflow:**
```bash
merobox bootstrap run workflow.yml -v JOB_ID=0
```

### **2. Pin attestation to IPFS:**
```bash
# Using web3.storage
w3 put attestation.json
# Returns: bafybeiabc123...
```

### **3. Submit to miniapp:**
- Open job detail page
- Click "Deliver"
- Enter `outputHash` from `outputs.json`
- Enter attestation CID from IPFS
- Submit transaction

### **4. Contract stores:**
```solidity
jobs[0].artifactHash = 0x5678...;
jobs[0].attestationCID = "bafybeiabc123...";
```

### **5. Anyone can verify:**
```bash
# Fetch attestation from IPFS
ipfs cat bafybeiabc123... > attestation.json

# Verify signature
node verify-attestation.js attestation.json
```

---

## 🚀 **Production Deployment**

### **For Workers:**

1. **Install Merobox:**
   ```bash
   pipx install merobox
   ```

2. **Get workflow from job creator:**
   ```bash
   # Job creator shares workflow.yml
   wget https://munus.app/workflows/job-123.yml
   ```

3. **Run on your machine:**
   ```bash
   merobox bootstrap run job-123.yml
   ```

4. **Submit attestation:**
   - Upload `attestation.json` to IPFS
   - Paste CID in Munus miniapp
   - Submit delivery

### **Security:**
- ✅ Data never leaves your machine
- ✅ Only hash goes on-chain
- ✅ Attestation proves you did the work
- ✅ Calimero handles signing automatically

---

## 🐛 **Troubleshooting**

### **Build fails: "can't find crate calimero-sdk"**
```bash
# Calimero SDK might not be published yet
# Use git dependency in Cargo.toml:
[dependencies]
calimero-sdk = { git = "https://github.com/calimero-network/core", branch = "main" }
```

### **Merobox not found**
```bash
# macOS
brew install merobox

# Linux/macOS with pipx
pipx install merobox

# Check installation
which merobox
```

### **Docker not running**
```bash
# Start Docker
open -a Docker  # macOS

# Check
docker ps
```

### **WASM build fails**
```bash
# Install target
rustup target add wasm32-unknown-unknown

# Check Rust version (needs 1.70+)
rustc --version

# Update if needed
rustup update
```

---

## 📖 **Resources**

- [Calimero Docs](https://docs.calimero.network/)
- [Battleships Tutorial](https://gist.github.com/antonpaisov/10d3e698e41b24f74028ae8ebd44237a)
- [Merobox GitHub](https://github.com/calimero-network/merobox)
- [Calimero Discord](https://discord.gg/wZRC73DVpU)

---

**This is REAL Calimero, not simulation!** 🚀

The code runs actual WASM logic in Docker containers with real Ed25519 signatures.

