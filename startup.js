/**
 * COMPREHENSIVE SYSTEM STARTUP SCRIPT
 * Blockchain Order Tracking với MetaMask Integration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ==================== CONFIGURATION ====================

const CONFIG = {
    BLOCKCHAIN_DIR: './blockchain',
    DATABASE_DIR: './database',
    INTEGRATION_DIR: './integration',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/order-tracking',
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || process.env.SEPOLIA_CONTRACT_ADDRESS,
    RPC_URL: process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || 'http://localhost:8545',
    PRIVATE_KEY: process.env.PRIVATE_KEY
};

// ==================== UTILITY FUNCTIONS ====================

const log = {
    info: (msg) => console.log(`📋 [INFO] ${msg}`),
    success: (msg) => console.log(`✅ [SUCCESS] ${msg}`),
    error: (msg) => console.log(`❌ [ERROR] ${msg}`),
    warning: (msg) => console.log(`⚠️  [WARNING] ${msg}`),
    process: (msg) => console.log(`🔄 [PROCESS] ${msg}`)
};

function runCommand(command, cwd = '.', options = {}) {
    try {
        log.process(`Running: ${command}`);
        const result = execSync(command, { 
            cwd, 
            stdio: options.silent ? 'pipe' : 'inherit',
            encoding: 'utf8'
        });
        return { success: true, output: result };
    } catch (error) {
        log.error(`Command failed: ${command}`);
        return { success: false, error: error.message };
    }
}

// ==================== SETUP FUNCTIONS ====================

function checkPrerequisites() {
    log.info('Checking prerequisites...');
    
    const checks = [
        { command: 'node --version', name: 'Node.js' },
        { command: 'npm --version', name: 'NPM' },
        { command: 'mongod --version', name: 'MongoDB' }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
        const result = runCommand(check.command, '.', { silent: true });
        if (result.success) {
            log.success(`${check.name}: ${result.output.trim()}`);
        } else {
            log.error(`${check.name}: Not installed`);
            if (check.name === 'MongoDB') {
                log.warning('MongoDB is required for database operations');
            } else {
                allPassed = false;
            }
        }
    }
    
    return allPassed;
}

function setupBlockchain() {
    log.info('Setting up Blockchain environment...');
    
    // Install dependencies
    if (!fs.existsSync(path.join(CONFIG.BLOCKCHAIN_DIR, 'node_modules'))) {
        const result = runCommand('npm install', CONFIG.BLOCKCHAIN_DIR);
        if (!result.success) return false;
    }
    
    // Compile contracts
    const compileResult = runCommand('npm run compile', CONFIG.BLOCKCHAIN_DIR);
    if (!compileResult.success) return false;
    
    // Run tests
    const testResult = runCommand('npm run test', CONFIG.BLOCKCHAIN_DIR);
    if (!testResult.success) {
        log.warning('Some tests failed, but continuing...');
    }
    
    log.success('Blockchain environment setup completed');
    return true;
}

function setupDatabase() {
    log.info('Setting up Database environment...');
    
    // Install dependencies
    if (!fs.existsSync(path.join(CONFIG.DATABASE_DIR, 'node_modules'))) {
        const result = runCommand('npm install', CONFIG.DATABASE_DIR);
        if (!result.success) return false;
    }
    
    // Setup database
    const setupResult = runCommand('node scripts/setupDatabase.js', CONFIG.DATABASE_DIR);
    if (!setupResult.success) {
        log.warning('Database setup failed. Make sure MongoDB is running.');
    }
    
    log.success('Database environment setup completed');
    return true;
}

function printSummary() {
    console.log('\n✅ ==========================================');
    console.log('✅ BLOCKCHAIN ORDER TRACKING SETUP COMPLETE!');
    console.log('✅ ==========================================\n');
    
    console.log('📋 SYSTEM INFORMATION:');
    console.log(`   📍 Contract: ${CONFIG.CONTRACT_ADDRESS || 'Will be deployed'}`);
    console.log(`   🗄️  Database: ${CONFIG.MONGODB_URI}`);
    console.log(`   🌐 Network: ${CONFIG.RPC_URL}`);
    console.log(`   🦊 MetaMask: Ready`);
    
    console.log('\n🔧 AVAILABLE COMMANDS:');
    console.log('   📦 Test MetaMask: node integration/metamaskSetup.js');
    console.log('   🧪 Test contracts: cd blockchain && npm test');
    console.log('   🚀 Deploy testnet: cd blockchain && npm run deploy:sepolia');
    console.log('   🔄 Start listener: cd database && npm start');
    
    console.log('\n📋 METAMASK SETUP:');
    console.log(`   🔑 Import private key: ${CONFIG.PRIVATE_KEY?.substring(0, 10)}...`);
    console.log('   🌐 Add Sepolia network: Chain ID 11155111');
    console.log('   💰 Get test ETH: https://sepoliafaucet.com/');
    
    console.log('\n📂 IMPORTANT FILES:');
    console.log('   📋 Smart Contract: blockchain/contracts/OrderTracking.sol');
    console.log('   🗄️  Database Models: database/schemas/models.js');
    console.log('   🔄 Integration: integration/blockchainListener.js');
    console.log('   🦊 MetaMask Utils: integration/metamaskSetup.js');
    console.log('   ⚙️  Configuration: .env');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Test MetaMask integration: node integration/metamaskSetup.js');
    console.log('   2. Start development servers');
    console.log('   3. Build your frontend with MetaMask connection');
    console.log('   4. Deploy to testnet when ready');
    
    console.log('\n🎉 Ready to build amazing order tracking system! 🚀');
}

async function startup() {
    console.log('🚀 =====================================================');
    console.log('🚀 BLOCKCHAIN ORDER TRACKING SYSTEM STARTUP');
    console.log('🚀 =====================================================\n');
    
    try {
        // Check prerequisites
        if (!checkPrerequisites()) {
            log.error('Prerequisites check failed');
            process.exit(1);
        }
        
        // Setup blockchain
        if (!setupBlockchain()) {
            log.error('Blockchain setup failed');
            process.exit(1);
        }
        
        // Setup database
        if (!setupDatabase()) {
            log.error('Database setup failed');
            process.exit(1);
        }
        
        // Print summary
        printSummary();
        
    } catch (error) {
        log.error(`Startup failed: ${error.message}`);
        process.exit(1);
    }
}

// Export functions and run if executed directly
module.exports = {
    startup,
    setupBlockchain,
    setupDatabase
};

if (require.main === module) {
    startup();
}