/**
 * Simple Test Order Creation on Sepolia
 */

const hre = require("hardhat");
require('dotenv').config({ path: '../.env' });

const CONTRACT_ADDRESS = "0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8";

async function main() {
  console.log("🧪 Testing Order Creation on Sepolia Testnet\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Import the ABI directly
  const OrderTracking = require('../artifacts/contracts/OrderTracking.sol/OrderTracking.json');
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, OrderTracking.abi, deployer);
  
  console.log(`📦 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Network: ${hre.network.name}\n`);

  try {
    // Authorize
    console.log("Step 1: Authorizing admin...");
    const authTx = await contract.setAdminAuthorization(deployer.address, true);
    console.log(`✅ Tx: ${authTx.hash}`);
    await authTx.wait();
    console.log("✅ Authorized\n");

    // Create order
    console.log("Step 2: Creating order...");
    const orderId = `TEST-ORDER-${Date.now()}`;
    const metadataHash = "QmXxx..."; // Mock IPFS hash

    const createTx = await contract.createOrder(
      orderId,
      metadataHash
    );
    
    console.log(`Order ID: ${orderId}`);
    console.log(`Metadata Hash: ${metadataHash}`);
    console.log(`Tx Hash: ${createTx.hash}`);
    
    const receipt = await createTx.wait();
    console.log(`✅ Created (Block: ${receipt.blockNumber})\n`);

    // Get order
    console.log("Step 3: Fetching order...");
    const order = await contract.getOrder(orderId);
    console.log(`✅ Order Status: ${order.currentStatus}`);
    console.log(`   Metadata Hash: ${order.metadataHash}\n`);

    console.log("=" .repeat(50));
    console.log("✅ TEST PASSED!");
    console.log("=" .repeat(50));
    console.log(`\nEtherscan: https://sepolia.etherscan.io/tx/${receipt.transactionHash}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
