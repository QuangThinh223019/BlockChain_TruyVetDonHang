/**
 * Test Suite for OrderTracking Smart Contract
 * Chạy: npx hardhat test
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrderTracking Contract", function () {
  let orderTracking;
  let owner;
  let admin1;
  let admin2;
  let unauthorized;

  beforeEach(async function () {
    // Lấy các signer
    [owner, admin1, admin2, unauthorized] = await ethers.getSigners();

    // Deploy contract
    const OrderTracking = await ethers.getContractFactory("OrderTracking");
    orderTracking = await OrderTracking.deploy();
    await orderTracking.waitForDeployment();
  });

  describe("Admin Authorization", function () {
    it("Should authorize admin by owner", async function () {
      // Admin không được phép ban đầu
      expect(await orderTracking.isAdminAuthorized(admin1.address)).to.equal(false);

      // Owner cấp quyền
      await orderTracking.setAdminAuthorization(admin1.address, true);
      expect(await orderTracking.isAdminAuthorized(admin1.address)).to.equal(true);

      // Owner loại bỏ quyền
      await orderTracking.setAdminAuthorization(admin1.address, false);
      expect(await orderTracking.isAdminAuthorized(admin1.address)).to.equal(false);
    });

    it("Should emit AdminAuthorizationChanged event", async function () {
      await expect(orderTracking.setAdminAuthorization(admin1.address, true))
        .to.emit(orderTracking, "AdminAuthorizationChanged")
        .withArgs(admin1.address, true);
    });

    it("Should revert if non-owner tries to set admin", async function () {
      await expect(
        orderTracking.connect(admin1).setAdminAuthorization(admin2.address, true)
      ).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("Create Order", function () {
    beforeEach(async function () {
      // Cấp quyền cho admin1
      await orderTracking.setAdminAuthorization(admin1.address, true);
    });

    it("Should create order successfully", async function () {
      const orderId = "ORDER-001";
      const metadataHash = "QmXxxx...";

      const tx = await orderTracking.connect(admin1).createOrder(orderId, metadataHash);
      
      expect(tx).to.emit(orderTracking, "OrderCreated");
      expect(await orderTracking.totalOrders()).to.equal(1);

      const order = await orderTracking.getOrder(orderId);
      expect(order.orderId).to.equal(orderId);
      expect(order.currentStatus).to.equal("CREATED");
      expect(order.metadataHash).to.equal(metadataHash);
      expect(order.isActive).to.equal(true);
    });

    it("Should not allow duplicate order IDs", async function () {
      const orderId = "ORDER-001";
      const metadataHash = "QmXxxx...";

      // Tạo đơn hàng đầu tiên
      await orderTracking.connect(admin1).createOrder(orderId, metadataHash);

      // Thử tạo lại với ID giống
      await expect(
        orderTracking.connect(admin1).createOrder(orderId, metadataHash)
      ).to.be.revertedWith("Order already exists");
    });

    it("Should revert if not authorized admin", async function () {
      const orderId = "ORDER-001";
      const metadataHash = "QmXxxx...";

      await expect(
        orderTracking.connect(unauthorized).createOrder(orderId, metadataHash)
      ).to.be.revertedWith("Only authorized admin can call this");
    });

    it("Should revert with empty order ID", async function () {
      const metadataHash = "QmXxxx...";

      await expect(
        orderTracking.connect(admin1).createOrder("", metadataHash)
      ).to.be.revertedWith("Order ID cannot be empty");
    });
  });

  describe("Update Status", function () {
    beforeEach(async function () {
      await orderTracking.setAdminAuthorization(admin1.address, true);
      await orderTracking.connect(admin1).createOrder("ORDER-001", "QmXxxx...");
    });

    it("Should update order status", async function () {
      const orderId = "ORDER-001";
      const newStatus = "PROCESSING";
      const detailsHash = "QmYyyy...";

      await orderTracking.connect(admin1).updateStatus(orderId, newStatus, detailsHash);

      const order = await orderTracking.getOrder(orderId);
      expect(order.currentStatus).to.equal(newStatus);
      expect(order.metadataHash).to.equal(detailsHash);
    });

    it("Should emit OrderStatusUpdated event", async function () {
      const orderId = "ORDER-001";
      const newStatus = "SHIPPED";
      const detailsHash = "QmYyyy...";

      await expect(
        orderTracking.connect(admin1).updateStatus(orderId, newStatus, detailsHash)
      )
        .to.emit(orderTracking, "OrderStatusUpdated")
        .withArgs(orderId, newStatus, expect.anything(), detailsHash, admin1.address);
    });

    it("Should track order history", async function () {
      const orderId = "ORDER-001";

      // Status 1
      await orderTracking.connect(admin1).updateStatus(orderId, "PROCESSING", "hash1");
      // Status 2
      await orderTracking.connect(admin1).updateStatus(orderId, "SHIPPED", "hash2");

      const history = await orderTracking.getOrderHistory(orderId);
      expect(history.length).to.equal(3); // CREATED + 2 updates
      expect(history[0].status).to.equal("CREATED");
      expect(history[1].status).to.equal("PROCESSING");
      expect(history[2].status).to.equal("SHIPPED");
    });

    it("Should revert update on non-existent order", async function () {
      await expect(
        orderTracking.connect(admin1).updateStatus("ORDER-999", "SHIPPED", "hash")
      ).to.be.revertedWith("Order does not exist");
    });

    it("Should revert if not authorized admin", async function () {
      await expect(
        orderTracking.connect(unauthorized).updateStatus("ORDER-001", "SHIPPED", "hash")
      ).to.be.revertedWith("Only authorized admin can call this");
    });
  });

  describe("Cancel Order", function () {
    beforeEach(async function () {
      await orderTracking.setAdminAuthorization(admin1.address, true);
      await orderTracking.connect(admin1).createOrder("ORDER-001", "QmXxxx...");
    });

    it("Should cancel order", async function () {
      const orderId = "ORDER-001";

      await orderTracking.connect(admin1).cancelOrder(orderId);

      const order = await orderTracking.getOrder(orderId);
      expect(order.currentStatus).to.equal("CANCELLED");
      expect(order.isActive).to.equal(false);
    });

    it("Should emit OrderCancelled event", async function () {
      const orderId = "ORDER-001";

      await expect(orderTracking.connect(admin1).cancelOrder(orderId))
        .to.emit(orderTracking, "OrderCancelled")
        .withArgs(orderId, expect.anything());
    });

    it("Should revert cancel on already cancelled order", async function () {
      const orderId = "ORDER-001";

      await orderTracking.connect(admin1).cancelOrder(orderId);

      await expect(
        orderTracking.connect(admin1).cancelOrder(orderId)
      ).to.be.revertedWith("Order is already cancelled");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await orderTracking.setAdminAuthorization(admin1.address, true);
      await orderTracking.connect(admin1).createOrder("ORDER-001", "QmXxxx...");
    });

    it("Should get current status", async function () {
      const orderId = "ORDER-001";
      await orderTracking.connect(admin1).updateStatus(orderId, "SHIPPED", "hash");

      const [status, timestamp] = await orderTracking.getCurrentStatus(orderId);
      expect(status).to.equal("SHIPPED");
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should get order history count", async function () {
      const orderId = "ORDER-001";

      let count = await orderTracking.getOrderHistoryCount(orderId);
      expect(count).to.equal(1); // CREATED

      await orderTracking.connect(admin1).updateStatus(orderId, "PROCESSING", "hash1");
      await orderTracking.connect(admin1).updateStatus(orderId, "SHIPPED", "hash2");

      count = await orderTracking.getOrderHistoryCount(orderId);
      expect(count).to.equal(3);
    });
  });

  describe("Gas Efficiency", function () {
    it("Should be efficient in creating orders", async function () {
      await orderTracking.setAdminAuthorization(admin1.address, true);

      const tx = await orderTracking.connect(admin1).createOrder("ORDER-001", "QmXxxx...");
      const receipt = await tx.wait();

      console.log(`Gas used for creating order: ${receipt.gasUsed.toString()}`);
      // Thông thường nên < 200,000 gas
      expect(receipt.gasUsed).to.be.lessThan(200000);
    });
  });
});
