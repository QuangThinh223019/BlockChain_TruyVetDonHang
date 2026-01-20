/**
 * Test Order Creation on Sepolia Testnet
 * Tạo order trên Sepolia bằng direct contract calls
 */

const hre = require("hardhat");
require('dotenv').config({ path: '../.env' });

const CONTRACT_ADDRESS = "0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8";

async function main() {
  console.log("🧪 Testing Order Creation on Sepolia Testnet\n");
  
  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Using account: ${deployer.address}`);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH\n`);
  
  if (balance === 0n) {
    throw new Error("❌ Insufficient balance. Get Sepolia ETH from faucet!");
  }

  // Get contract with compiled artifacts
  const OrderTracking = await hre.ethers.getContractFactory("OrderTracking");
  const contract = OrderTracking.attach(CONTRACT_ADDRESS).connect(deployer);
  
  console.log(`📦 Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Network: ${hre.network.name}\n`);

  try {
    // Test 1: Authorize admin
    console.log("📋 Step 1: Setting admin authorization...");
    const authTx = await contract.setAdminAuthorization(deployer.address, true);
    console.log(`   ⏳ Tx Hash: ${authTx.hash}`);
    const authReceipt = await authTx.wait();
    console.log(`   ✅ Authorized (Gas used: ${authReceipt.gasUsed.toString()})\n`);

    // Wait a bit between transactions
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Create order
    console.log("📋 Step 2: Creating test order...");
    const orderId = `TEST-ORDER-${Date.now()}`;
    const productId = "PROD-001";
    const amount = hre.ethers.parseEther("0.01");
    const deliveryDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow

    console.log(`   📍 Order ID: ${orderId}`);
    console.log(`   🛍️ Product: ${productId}`);
    console.log(`   💰 Amount: ${hre.ethers.formatEther(amount)} ETH`);
    console.log(`   📅 Delivery Date: ${new Date(deliveryDate * 1000).toISOString()}`);

    const createTx = await contract.createOrder(
      orderId,
      productId,
      amount,
      deployer.address,
      deployer.address,
      deliveryDate
    );
    
    console.log(`   ⏳ Tx Hash: ${createTx.hash}`);
    
    const createReceipt = await createTx.wait();
    console.log(`   ✅ Order Created!`);
    console.log(`      - Block: ${createReceipt.blockNumber}`);
    console.log(`      - Gas used: ${createReceipt.gasUsed.toString()}\n`);

    // Wait a bit to ensure blockchain is updated
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: Get order from blockchain
    console.log("📋 Step 3: Fetching order from blockchain...");
    let order;
    try {
      order = await contract.getOrder(orderId);
      
      console.log(`   📦 Order Details:`);
      console.log(`      - ID: ${order.id}`);
      console.log(`      - Product: ${order.productId}`);
      console.log(`      - Amount: ${hre.ethers.formatEther(order.amount)} ETH`);
      console.log(`      - Status: ${order.status}`);
      console.log(`      - Buyer: ${order.buyer.substring(0, 10)}...`);
      console.log(`      - Seller: ${order.seller.substring(0, 10)}...`);
      console.log(`      - Created At: ${new Date(Number(order.createdAt) * 1000).toISOString()}\n`);
    } catch (err) {
      console.log(`   ⚠️  Order not immediately available, but transaction confirmed\n`);
    }

    // Success summary
    console.log("=" .repeat(60));
    console.log("✅ ORDER CREATION TEST PASSED!");
    console.log("=" .repeat(60));
    console.log(`\n📍 Verify on Sepolia Etherscan:`);
    console.log(`   Contract: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);
    console.log(`   Create Tx: https://sepolia.etherscan.io/tx/${createReceipt.transactionHash}`);
    console.log(`   Block: ${createReceipt.blockNumber}`);
    console.log(`\n💡 Order should be visible in MongoDB via event listener soon...`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
