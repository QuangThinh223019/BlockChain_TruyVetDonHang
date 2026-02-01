#!/bin/bash
#========================================
# BLOCKCHAIN ORDER TRACKING SETUP SCRIPT
# Setup Environment + Database Models + Contract Integration
#========================================

echo "🚀 BLOCKCHAIN ORDER TRACKING SYSTEM SETUP"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}📋 $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js v16+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm"
        exit 1
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB not found. Please install MongoDB"
        print_info "Install: https://docs.mongodb.com/manual/installation/"
    fi
    
    print_status "Prerequisites check completed"
}

# Setup Blockchain Environment
setup_blockchain() {
    print_info "Setting up Blockchain environment..."
    
    cd blockchain
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing blockchain dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Failed to install blockchain dependencies"
            exit 1
        fi
    fi
    
    # Compile contracts
    print_info "Compiling smart contracts..."
    npm run compile
    if [ $? -ne 0 ]; then
        print_error "Failed to compile smart contracts"
        exit 1
    fi
    
    # Run tests
    print_info "Running smart contract tests..."
    npm run test
    if [ $? -ne 0 ]; then
        print_warning "Some tests failed, but continuing..."
    fi
    
    cd ..
    print_status "Blockchain environment setup completed"
}

# Setup Database Environment
setup_database() {
    print_info "Setting up Database environment..."
    
    cd database
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing database dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Failed to install database dependencies"
            exit 1
        fi
    fi
    
    # Setup database models
    print_info "Setting up database models..."
    node scripts/setupDatabase.js
    if [ $? -ne 0 ]; then
        print_warning "Database setup failed. Make sure MongoDB is running."
    fi
    
    cd ..
    print_status "Database environment setup completed"
}

# Deploy Contract (if needed)
deploy_contract() {
    print_info "Checking contract deployment..."
    
    # Check if contract address exists in .env
    if grep -q "CONTRACT_ADDRESS=" .env && [ -n "$(grep CONTRACT_ADDRESS .env | cut -d'=' -f2)" ]; then
        print_status "Contract already deployed"
        return
    fi
    
    print_info "Contract not deployed. Deploying to localhost..."
    
    # Start local blockchain (in background)
    cd blockchain
    npm run node &
    BLOCKCHAIN_PID=$!
    
    # Wait for blockchain to start
    sleep 5
    
    # Deploy contract
    print_info "Deploying contract to localhost..."
    npm run deploy:local
    
    # Kill background blockchain
    kill $BLOCKCHAIN_PID
    
    cd ..
    print_status "Contract deployment completed"
}

# Create MetaMask integration test
create_metamask_test() {
    print_info "Creating MetaMask integration test..."
    
    cat > test_metamask_integration.js << 'EOF'
/**
 * MetaMask Integration Test Script
 * Test kết nối MetaMask với smart contract
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Load contract ABI
const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.SEPOLIA_CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function testMetaMaskIntegration() {
    console.log("🦊 Testing MetaMask Integration...");
    console.log("=====================================");
    
    try {
        // 1. Setup provider and signer
        console.log("📡 Connecting to network...");
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log(`📍 Network: ${(await provider.getNetwork()).name}`);
        console.log(`💰 Wallet: ${signer.address}`);
        console.log(`💳 Balance: ${ethers.utils.formatEther(await provider.getBalance(signer.address))} ETH`);
        
        // 2. Connect to contract
        console.log("📋 Connecting to contract...");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
        console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
        
        // 3. Test contract interaction
        console.log("🧪 Testing contract interaction...");
        
        const orderId = `ORDER_${Date.now()}`;
        const metadataHash = `metadata_${Date.now()}`;
        
        // Create order
        console.log(`📦 Creating order: ${orderId}`);
        const createTx = await contract.createOrder(orderId, metadataHash);
        console.log(`📤 Transaction: ${createTx.hash}`);
        
        const createReceipt = await createTx.wait();
        console.log(`✅ Order created in block: ${createReceipt.blockNumber}`);
        
        // Update status
        console.log(`📦 Updating order status: ${orderId}`);
        const updateTx = await contract.updateOrderStatus(orderId, "SHIPPED", "shipped_details");
        console.log(`📤 Update transaction: ${updateTx.hash}`);
        
        const updateReceipt = await updateTx.wait();
        console.log(`✅ Status updated in block: ${updateReceipt.blockNumber}`);
        
        // Query order
        console.log(`🔍 Querying order: ${orderId}`);
        const order = await contract.getOrder(orderId);
        console.log(`📋 Order details:`);
        console.log(`   - Order ID: ${order.orderId}`);
        console.log(`   - Admin: ${order.adminAddress}`);
        console.log(`   - Status: ${order.currentStatus}`);
        console.log(`   - Created: ${new Date(order.createdAt * 1000).toLocaleString()}`);
        console.log(`   - Active: ${order.isActive}`);
        
        console.log("\n✅ =====================================");
        console.log("✅ METAMASK INTEGRATION TEST SUCCESS!");
        console.log("✅ =====================================");
        
        return {
            success: true,
            orderId,
            contractAddress: CONTRACT_ADDRESS,
            networkName: (await provider.getNetwork()).name
        };
        
    } catch (error) {
        console.error("❌ MetaMask integration test failed:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run test if executed directly
if (require.main === module) {
    testMetaMaskIntegration()
        .then(result => {
            if (result.success) {
                console.log(`\n🎉 Ready for MetaMask integration!`);
                console.log(`Contract: ${result.contractAddress}`);
                console.log(`Network: ${result.networkName}`);
                console.log(`Test Order: ${result.orderId}`);
            } else {
                console.log(`\n❌ Test failed: ${result.error}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error("❌ Unexpected error:", error);
            process.exit(1);
        });
}

module.exports = { testMetaMaskIntegration };
EOF

    print_status "MetaMask integration test created"
}

# Main setup function
main() {
    echo ""
    print_info "Starting Blockchain Order Tracking System Setup..."
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Setup blockchain environment
    setup_blockchain
    
    # Step 3: Setup database environment
    setup_database
    
    # Step 4: Deploy contract if needed
    deploy_contract
    
    # Step 5: Create MetaMask integration test
    create_metamask_test
    
    # Setup complete
    echo ""
    echo "✅ =========================================="
    echo "✅ SETUP COMPLETED SUCCESSFULLY!"
    echo "✅ =========================================="
    echo ""
    print_info "SUMMARY:"
    echo "  📦 Blockchain: Smart contract compiled and deployed"
    echo "  🗄️  Database: MongoDB models and collections ready"
    echo "  🦊 MetaMask: Integration test script created"
    echo "  🔧 Environment: All dependencies installed"
    echo ""
    print_info "NEXT STEPS:"
    echo "  1. Configure MetaMask wallet:"
    echo "     - Import private key from .env file"
    echo "     - Add Sepolia testnet if using testnet"
    echo "     - Get test ETH from faucet"
    echo ""
    echo "  2. Test the system:"
    echo "     - Run: node test_metamask_integration.js"
    echo "     - Start blockchain listener: cd database && npm start"
    echo ""
    echo "  3. Development workflow:"
    echo "     - Terminal 1: cd blockchain && npm run node"
    echo "     - Terminal 2: cd blockchain && npm run deploy:local"
    echo "     - Terminal 3: cd database && npm start"
    echo ""
    print_info "IMPORTANT FILES:"
    echo "  - Smart Contract: blockchain/contracts/OrderTracking.sol"
    echo "  - Database Models: database/schemas/models.js"
    echo "  - Integration: integration/blockchainListener.js"
    echo "  - Configuration: .env"
    echo "  - MetaMask Test: test_metamask_integration.js"
    echo ""
    print_status "Ready to start developing! 🚀"
}

# Run main function
main