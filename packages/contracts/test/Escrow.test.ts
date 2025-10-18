import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow } from "../typechain-types";

describe("Escrow", function () {
  let escrow: Escrow;
  let creator: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async function () {
    [creator, worker, other] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
  });

  describe("ETH Job Flow", function () {
    it("should create, accept, deliver, and release ETH job", async function () {
      const amount = ethers.parseEther("0.1");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Create job
      const tx = await escrow.connect(creator).createJob(
        ethers.ZeroAddress,
        amount,
        deadline,
        "ipfs://job-brief-cid",
        { value: amount }
      );
      await tx.wait();

      const jobId = 0n;
      let job = await escrow.getJob(jobId);
      expect(job.creator).to.equal(creator.address);
      expect(job.amount).to.equal(amount);
      expect(job.state).to.equal(0); // Open

      // Accept
      await escrow.connect(worker).accept(jobId);
      job = await escrow.getJob(jobId);
      expect(job.assignee).to.equal(worker.address);
      expect(job.state).to.equal(1); // Accepted

      // Deliver
      const artifactHash = ethers.keccak256(ethers.toUtf8Bytes("artifact"));
      await escrow.connect(worker).deliver(jobId, artifactHash, "ipfs://attestation-cid");
      job = await escrow.getJob(jobId);
      expect(job.artifactHash).to.equal(artifactHash);
      expect(job.state).to.equal(2); // Delivered

      // Release
      const workerBalBefore = await ethers.provider.getBalance(worker.address);
      await escrow.connect(creator).release(jobId, worker.address);
      const workerBalAfter = await ethers.provider.getBalance(worker.address);
      
      job = await escrow.getJob(jobId);
      expect(job.state).to.equal(3); // Released
      expect(workerBalAfter - workerBalBefore).to.equal(amount);
    });

    it("should allow refund if not delivered by deadline", async function () {
      const amount = ethers.parseEther("0.1");
      
      // Get current block timestamp and set deadline in the past
      const latestBlock = await ethers.provider.getBlock("latest");
      const currentTime = latestBlock!.timestamp;
      const deadline = currentTime + 2; // 2 seconds from now

      await escrow.connect(creator).createJob(
        ethers.ZeroAddress,
        amount,
        deadline,
        "ipfs://job-brief-cid",
        { value: amount }
      );

      const jobId = 0n;
      
      // Increase time past deadline and mine a block
      await ethers.provider.send("evm_increaseTime", [5]); // 5 seconds to be safe
      await ethers.provider.send("evm_mine", []);

      // Refund
      const creatorBalBefore = await ethers.provider.getBalance(creator.address);
      const tx = await escrow.connect(creator).refund(jobId, creator.address);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * tx.gasPrice!;
      const creatorBalAfter = await ethers.provider.getBalance(creator.address);

      const job = await escrow.getJob(jobId);
      expect(job.state).to.equal(4); // Refunded
      expect(creatorBalAfter - creatorBalBefore + gasUsed).to.equal(amount);
    });

    it("should reject accept from non-creator before deadline", async function () {
      const amount = ethers.parseEther("0.1");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await escrow.connect(creator).createJob(
        ethers.ZeroAddress,
        amount,
        deadline,
        "ipfs://job-brief-cid",
        { value: amount }
      );

      await expect(
        escrow.connect(worker).refund(0, worker.address)
      ).to.be.revertedWithCustomError(escrow, "NotCreator");
    });
  });

  describe("Edge Cases", function () {
    it("should reject zero amount", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      await expect(
        escrow.connect(creator).createJob(
          ethers.ZeroAddress,
          0,
          deadline,
          "ipfs://cid"
        )
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
    });

    it("should reject past deadline", async function () {
      const amount = ethers.parseEther("0.1");
      const pastDeadline = Math.floor(Date.now() / 1000) - 100;
      
      await expect(
        escrow.connect(creator).createJob(
          ethers.ZeroAddress,
          amount,
          pastDeadline,
          "ipfs://cid",
          { value: amount }
        )
      ).to.be.revertedWithCustomError(escrow, "PastDeadline");
    });

    it("should reject double accept", async function () {
      const amount = ethers.parseEther("0.1");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await escrow.connect(creator).createJob(
        ethers.ZeroAddress,
        amount,
        deadline,
        "ipfs://cid",
        { value: amount }
      );

      await escrow.connect(worker).accept(0);
      
      await expect(
        escrow.connect(other).accept(0)
      ).to.be.revertedWithCustomError(escrow, "InvalidState");
    });

    it("should reject delivery from non-assignee", async function () {
      const amount = ethers.parseEther("0.1");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await escrow.connect(creator).createJob(
        ethers.ZeroAddress,
        amount,
        deadline,
        "ipfs://cid",
        { value: amount }
      );

      await escrow.connect(worker).accept(0);

      const artifactHash = ethers.keccak256(ethers.toUtf8Bytes("artifact"));
      await expect(
        escrow.connect(other).deliver(0, artifactHash, "ipfs://att")
      ).to.be.revertedWithCustomError(escrow, "NotAssignee");
    });
  });
});


