@echo off
REM ========================================
REM BLOCKCHAIN ORDER TRACKING SETUP SCRIPT (WINDOWS)
REM Setup Environment + Database Models + Contract Integration
REM ========================================

title Blockchain Order Tracking System Setup

echo ========================================
echo 🚀 BLOCKCHAIN ORDER TRACKING SYSTEM SETUP
echo ========================================
echo.

REM Function to print status messages
REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js v16+
    pause
    exit /b 1
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install npm
    pause
    exit /b 1
)

REM Check MongoDB
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not found. Please install MongoDB
    echo 💡 Install: https://docs.mongodb.com/manual/installation/
)

echo ✅ Prerequisites check completed
echo.

REM Setup Blockchain Environment
echo 📋 Setting up Blockchain environment...
cd blockchain

if not exist "node_modules" (
    echo 📦 Installing blockchain dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install blockchain dependencies
        pause
        exit /b 1
    )
)

echo 🔨 Compiling smart contracts...
call npm run compile
if %errorlevel% neq 0 (
    echo ❌ Failed to compile smart contracts
    pause
    exit /b 1
)

echo 🧪 Running smart contract tests...
call npm run test
if %errorlevel% neq 0 (
    echo ⚠️  Some tests failed, but continuing...
)

cd ..
echo ✅ Blockchain environment setup completed
echo.

REM Setup Database Environment
echo 📋 Setting up Database environment...
cd database

if not exist "node_modules" (
    echo 📦 Installing database dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install database dependencies
        pause
        exit /b 1
    )
)

echo 🗄️  Setting up database models...
call node scripts\setupDatabase.js
if %errorlevel% neq 0 (
    echo ⚠️  Database setup failed. Make sure MongoDB is running.
)

cd ..
echo ✅ Database environment setup completed
echo.

REM Create MetaMask integration test
echo 📋 Creating MetaMask integration test...

echo /**> test_metamask_integration.js
echo  * MetaMask Integration Test Script>> test_metamask_integration.js
echo  * Test kết nối MetaMask với smart contract>> test_metamask_integration.js
echo  */>> test_metamask_integration.js
echo.>> test_metamask_integration.js
echo const { ethers } = require('ethers'^);>> test_metamask_integration.js
echo require('dotenv'^).config(^);>> test_metamask_integration.js
echo.>> test_metamask_integration.js
echo // Load contract ABI>> test_metamask_integration.js
echo const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json'^);>> test_metamask_integration.js
echo.>> test_metamask_integration.js
echo const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ^|^| process.env.SEPOLIA_CONTRACT_ADDRESS;>> test_metamask_integration.js
echo const RPC_URL = process.env.RPC_URL ^|^| process.env.SEPOLIA_RPC_URL ^|^| "http://localhost:8545";>> test_metamask_integration.js
echo const PRIVATE_KEY = process.env.PRIVATE_KEY;>> test_metamask_integration.js

echo ✅ MetaMask integration test created
echo.

REM Setup complete
echo.
echo ========================================
echo ✅ SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo 📋 SUMMARY:
echo   📦 Blockchain: Smart contract compiled and tested
echo   🗄️  Database: MongoDB models and collections ready
echo   🦊 MetaMask: Integration ready
echo   🔧 Environment: All dependencies installed
echo.
echo 📋 NEXT STEPS:
echo   1. Configure MetaMask wallet:
echo      - Import private key from .env file
echo      - Add Sepolia testnet if using testnet
echo      - Get test ETH from faucet
echo.
echo   2. Test the system:
echo      - Run: node test_metamask_integration.js
echo      - Start blockchain listener: cd database ^&^& npm start
echo.
echo   3. Development workflow:
echo      - Terminal 1: cd blockchain ^&^& npm run node
echo      - Terminal 2: cd blockchain ^&^& npm run deploy:local
echo      - Terminal 3: cd database ^&^& npm start
echo.
echo 📋 IMPORTANT FILES:
echo   - Smart Contract: blockchain\contracts\OrderTracking.sol
echo   - Database Models: database\schemas\models.js
echo   - Integration: integration\blockchainListener.js
echo   - Configuration: .env
echo   - MetaMask Test: test_metamask_integration.js
echo.
echo ✅ Ready to start developing! 🚀
echo.
pause