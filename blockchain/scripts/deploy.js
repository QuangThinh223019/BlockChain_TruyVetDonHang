/**
 * Deployment Script for OrderTracking Smart Contract
 * Sử dụng: npx hardhat run scripts/deploy.js --network <network-name>
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying OrderTracking contract...");

  // Lấy deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deploying with account: ${deployer.address}`);

  // Lấy balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy contract
  const OrderTracking = await hre.ethers.getContractFactory("OrderTracking");
  const contract = await OrderTracking.deploy();

  await contract.waitForDeployment();

  console.log("✅ OrderTracking deployed to:", await contract.getAddress());

  // Lưu địa chỉ contract
  const deploymentInfo = {
    network: hre.network.name,
    contract: "OrderTracking",
    address: await contract.getAddress(),
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Lưu vào file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const fileName = `deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentPath, fileName),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n✅ Deployment info saved to: deployments/${fileName}`);

  // Verify on Etherscan (nếu không phải localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    const deployTx = await contract.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(6);
    }

    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: await contract.getAddress(),
        constructorArguments: []
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("⚠️  Contract already verified on Etherscan");
      } else {
        console.error("❌ Verification failed:", error.message);
      }
    }
  }

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
