#!/usr/bin/env node

/**
 * EMAIL NOTIFICATION TEST SCRIPT
 * Tests email service configuration and sends test emails
 */

const emailService = require('./email-service');
require('dotenv').config();

const args = process.argv.slice(2);
const testEmail = args[0];

if (!testEmail) {
  console.log('\n📧 Email Notification Test Script\n');
  console.log('Usage: node test-email.js <recipient-email>\n');
  console.log('Examples:');
  console.log('  node test-email.js user@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(testEmail)) {
  console.error('❌ Invalid email address format');
  process.exit(1);
}

async function runTests() {
  console.log('\n📧 Email Notification Test Script\n');
  console.log('Configuration:');
  console.log(`  EMAIL_USER: ${process.env.EMAIL_USER || '(not set)'}`);
  console.log(`  EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '(configured)' : '(not set)'}`);
  console.log(`  Test Email: ${testEmail}\n`);

  // Initialize email service
  console.log('Initializing email service...');
  const initialized = emailService.initializeEmailService();

  if (!initialized) {
    console.error('❌ Email service initialization failed');
    console.error('   Please configure EMAIL_USER and EMAIL_PASSWORD in .env file\n');
    process.exit(1);
  }

  console.log('✅ Email service initialized\n');

  // Test 1: Order Created
  console.log('Test 1️⃣: Order Creation Notification');
  console.log('─'.repeat(50));
  const orderCreatedData = {
    orderId: 'ORD-TEST-001',
    productName: 'Test Product',
    quantity: 1,
    price: '100,000',
    recipientName: 'John Doe',
    recipientPhone: '0123456789',
    recipientAddress: '123 Test Street, City, Country',
    metadataHash: '0x' + 'a'.repeat(64),
    createdAt: new Date().toISOString()
  };

  const result1 = await emailService.notifyOrderCreated(testEmail, orderCreatedData);
  if (result1) {
    console.log('✅ Order creation email sent successfully');
  } else {
    console.log('❌ Failed to send order creation email');
  }

  // Test 2: Order Status Updated
  console.log('\nTest 2️⃣: Order Status Update Notification');
  console.log('─'.repeat(50));
  const statusUpdateData = {
    orderId: 'ORD-TEST-001',
    status: '2', // Shipped
    productName: 'Test Product',
    quantity: 1,
    price: '100,000',
    recipientName: 'John Doe',
    updatedAt: new Date().toISOString(),
    notes: 'Order has been shipped via DHL'
  };

  const result2 = await emailService.notifyOrderStatusUpdated(testEmail, statusUpdateData);
  if (result2) {
    console.log('✅ Status update email sent successfully');
  } else {
    console.log('❌ Failed to send status update email');
  }

  // Test 3: Order Delivered
  console.log('\nTest 3️⃣: Order Delivered Notification');
  console.log('─'.repeat(50));
  const deliveredData = {
    orderId: 'ORD-TEST-001',
    productName: 'Test Product',
    quantity: 1,
    price: '100,000',
    recipientName: 'John Doe',
    deliveredAt: new Date().toISOString()
  };

  const result3 = await emailService.notifyOrderDelivered(testEmail, deliveredData);
  if (result3) {
    console.log('✅ Delivery confirmation email sent successfully');
  } else {
    console.log('❌ Failed to send delivery confirmation email');
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  const allPassed = result1 && result2 && result3;
  if (allPassed) {
    console.log('✅ All email tests passed!');
    console.log('\n📧 Check your inbox for 3 test emails');
  } else {
    console.log('❌ Some email tests failed');
    console.log('   Check your email configuration and try again');
  }
  console.log('═'.repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test error:', error.message);
  process.exit(1);
});
