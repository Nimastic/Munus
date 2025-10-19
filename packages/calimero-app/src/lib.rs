use calimero_sdk::app;
use calimero_sdk::borsh::{BorshDeserialize, BorshSerialize};
use calimero_sdk::env;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Main application state for Munus job processing
#[app::state]
#[derive(Default, BorshSerialize, BorshDeserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct MunusJobProcessor {
    /// Counter for tracking processed jobs
    processed_count: u64,
}

/// Result of processing a job
#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct JobResult {
    pub job_id: String,
    pub input_hash: String,
    pub output_hash: String,
    pub output_cid: String,
    pub timestamp: u64,
    pub success: bool,
    pub metadata: ResultMetadata,
}

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct ResultMetadata {
    pub task_type: String,
    pub duration_ms: u64,
    pub worker_address: String,
}

/// Attestation structure
#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct Attestation {
    pub job_id: String,
    pub input_hash: String,
    pub output_hash: String,
    pub worker_public_key: String,
    pub worker_address: String,
    pub timestamp: u64,
    pub signature: String,
    pub version: String,
}

/// Event emitted when job is processed
#[app::event]
pub enum Event<'a> {
    JobProcessed { job_id: &'a str, success: bool },
    AttestationGenerated { job_id: &'a str, signature: &'a str },
}

#[app::logic]
impl MunusJobProcessor {
    /// Process a job with given inputs
    /// This is where you'd implement your actual job logic
    /// Examples: parse invoice, OCR document, generate report, etc.
    #[app::method]
    pub fn process_job(
        &mut self,
        job_id: String,
        input_cid: String,
        task_type: String,
        worker_address: String,
    ) -> app::Result<JobResult> {
        let start_time = env::time_now();

        // Generate input hash from CID
        let input_hash = Self::hash_string(&input_cid);

        // Simulate job processing
        // In production, you'd:
        // 1. Fetch data from IPFS using input_cid
        // 2. Process the data (OCR, parsing, computation, etc.)
        // 3. Generate output
        // 4. Pin output to IPFS
        // 5. Return output CID

        let output_data = match task_type.as_str() {
            "parse_invoice" => self.parse_invoice(&input_cid)?,
            "generate_report" => self.generate_report(&input_cid)?,
            "process_data" => self.process_data(&input_cid)?,
            _ => {
                app::bail!("Unknown task type: {}", task_type);
            }
        };

        // Generate output hash
        let output_hash = Self::hash_string(&output_data);

        // In production, pin to IPFS and get real CID
        let output_cid = format!("Qm{}", Self::generate_mock_cid(&output_hash));

        let end_time = env::time_now();
        let duration_ms = end_time - start_time;

        let result = JobResult {
            job_id: job_id.clone(),
            input_hash,
            output_hash: output_hash.clone(),
            output_cid,
            timestamp: end_time,
            success: true,
            metadata: ResultMetadata {
                task_type,
                duration_ms,
                worker_address,
            },
        };

        // Increment counter
        self.processed_count += 1;

        // Emit event
        app::emit!(Event::JobProcessed {
            job_id: &job_id,
            success: true
        });

        Ok(result)
    }

    /// Generate signed attestation for job result
    #[app::method]
    pub fn sign_attestation(
        &self,
        job_id: String,
        input_hash: String,
        output_hash: String,
        timestamp: u64,
        worker_address: String,
    ) -> app::Result<Attestation> {
        // Get executor's public key from Calimero context
        let worker_public_key = env::executor_id().to_string();

        // Create canonical payload for signing
        let payload = serde_json::json!({
            "jobId": job_id,
            "inputHash": input_hash,
            "outputHash": output_hash,
            "workerPublicKey": worker_public_key,
            "timestamp": timestamp,
        });

        let payload_str = serde_json::to_string(&payload)
            .map_err(|e| app::Error::msg(format!("Serialization error: {}", e)))?;

        // Sign the payload using Calimero's built-in signing
        // The Calimero SDK handles Ed25519 signing internally
        let signature = self.sign_payload(&payload_str)?;

        let attestation = Attestation {
            job_id: job_id.clone(),
            input_hash,
            output_hash,
            worker_public_key: worker_public_key.clone(),
            worker_address,
            timestamp,
            signature: signature.clone(),
            version: "1.0".to_string(),
        };

        // Emit event
        app::emit!(Event::AttestationGenerated {
            job_id: &job_id,
            signature: &signature
        });

        Ok(attestation)
    }

    /// Get processing statistics
    #[app::method]
    pub fn get_stats(&self) -> app::Result<u64> {
        Ok(self.processed_count)
    }

    // ========================================================================
    // Private helper methods
    // ========================================================================

    /// Parse invoice (example task)
    fn parse_invoice(&self, _input_cid: &str) -> app::Result<String> {
        // In production: fetch invoice from IPFS, parse with OCR/PDF parser
        Ok(serde_json::json!({
            "invoice_number": "INV-2025-001",
            "total": "1500.00",
            "currency": "USD",
            "line_items": [
                {"description": "Design work", "amount": "1000.00"},
                {"description": "Revisions", "amount": "500.00"}
            ]
        })
        .to_string())
    }

    /// Generate report (example task)
    fn generate_report(&self, _input_cid: &str) -> app::Result<String> {
        // In production: fetch data, run analytics, generate report
        Ok(serde_json::json!({
            "report_type": "weekly_summary",
            "total_jobs": 42,
            "total_value": "12.5 ETH",
            "completion_rate": "95%"
        })
        .to_string())
    }

    /// Process data (generic task)
    fn process_data(&self, _input_cid: &str) -> app::Result<String> {
        // In production: custom data processing logic
        Ok(serde_json::json!({
            "status": "processed",
            "timestamp": env::time_now(),
            "result": "success"
        })
        .to_string())
    }

    /// Hash a string using SHA-256
    fn hash_string(data: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Generate mock CID from hash (for demo)
    /// In production, use real IPFS pinning
    fn generate_mock_cid(hash: &str) -> String {
        // Take last 46 chars of hash to create CID-like string
        let clean_hash = hash.trim_start_matches("0x");
        format!("{:0<46}", &clean_hash[0..clean_hash.len().min(46)])
    }

    /// Sign payload using Calimero's signing infrastructure
    fn sign_payload(&self, payload: &str) -> app::Result<String> {
        // Calimero SDK provides signing through the context
        // This uses Ed25519 under the hood
        let signature_bytes = env::sign(payload.as_bytes());
        Ok(hex::encode(signature_bytes))
    }
}

