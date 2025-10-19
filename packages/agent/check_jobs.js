const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');

const ESCROW_ADDRESS = '0x265B042A62f92E073cf086017fBF53238CF4DcCe';

const abi = [
  {
    inputs: [],
    name: "nextId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});

async function checkJobs() {
  try {
    const count = await client.readContract({
      address: ESCROW_ADDRESS,
      abi: abi,
      functionName: 'nextId'
    });
    console.log(`✅ Total jobs on contract: ${count}`);
    if (count === 0n) {
      console.log('⚠️  No jobs have been created on-chain yet!');
      console.log('💡 Use the miniapp to CREATE a job on the blockchain first.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkJobs();
