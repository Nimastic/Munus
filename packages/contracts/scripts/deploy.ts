import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Escrow contract...");

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ Escrow deployed to:", address);
  console.log("\nAdd this to your .env:");
  console.log(`NEXT_PUBLIC_ESCROW_ADDRESS=${address}`);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


