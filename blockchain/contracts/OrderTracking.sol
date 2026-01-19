// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title OrderTracking
 * @dev Hệ thống truy vết đơn hàng trên Blockchain
 * Lưu dữ liệu bất biến quan trọng: OrderID, Status, History, Metadata Hash
 */

contract OrderTracking {
    
    // ==================== DATA STRUCTURES ====================
    
    struct Order {
        string orderId;                    // ID đơn hàng
        address adminAddress;              // Địa chỉ admin tạo đơn
        uint256 createdAt;                 // Timestamp tạo đơn
        string currentStatus;              // Trạng thái hiện tại
        string metadataHash;               // Hash dữ liệu từ MongoDB/IPFS
        uint256 lastUpdated;               // Lần cập nhật cuối cùng
        bool isActive;                     // Đơn hàng có hoạt động hay không
    }
    
    struct StatusUpdate {
        string status;                     // Trạng thái mới
        uint256 timestamp;                 // Thời điểm cập nhật
        string details;                    // Chi tiết cập nhật (IPFS hash)
        address updatedBy;                 // Người cập nhật
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(string => Order) public orders;                    // Mapping từ OrderID -> Order
    mapping(string => StatusUpdate[]) public orderHistory;    // Lịch sử cập nhật của mỗi đơn
    mapping(address => bool) public authorizedAdmins;         // Danh sách admin được phép
    
    address public contractOwner;
    uint256 public totalOrders;
    
    // ==================== EVENTS ====================
    
    event OrderCreated(
        string indexed orderId,
        address indexed admin,
        uint256 timestamp,
        string metadataHash
    );
    
    event OrderStatusUpdated(
        string indexed orderId,
        string newStatus,
        uint256 timestamp,
        string detailsHash,
        address indexed updatedBy
    );
    
    event OrderCancelled(
        string indexed orderId,
        uint256 timestamp
    );
    
    event AdminAuthorizationChanged(
        address indexed admin,
        bool isAuthorized
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only owner can call this");
        _;
    }
    
    modifier onlyAuthorizedAdmin() {
        require(authorizedAdmins[msg.sender], "Only authorized admin can call this");
        _;
    }
    
    modifier orderExists(string memory _orderId) {
        require(orders[_orderId].createdAt != 0, "Order does not exist");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        contractOwner = msg.sender;
        authorizedAdmins[msg.sender] = true;
        totalOrders = 0;
    }
    
    // ==================== ADMIN MANAGEMENT ====================
    
    /**
     * @dev Thêm hoặc xóa quyền cho admin
     */
    function setAdminAuthorization(address _admin, bool _isAuthorized) 
        external 
        onlyOwner 
    {
        authorizedAdmins[_admin] = _isAuthorized;
        emit AdminAuthorizationChanged(_admin, _isAuthorized);
    }
    
    // ==================== MAIN FUNCTIONS ====================
    
    /**
     * @dev Tạo đơn hàng mới
     * @param _orderId ID đơn hàng (từ backend)
     * @param _metadataHash Hash dữ liệu từ MongoDB/IPFS
     */
    function createOrder(
        string memory _orderId,
        string memory _metadataHash
    ) 
        external 
        onlyAuthorizedAdmin 
        returns (bool)
    {
        require(orders[_orderId].createdAt == 0, "Order already exists");
        require(bytes(_orderId).length > 0, "Order ID cannot be empty");
        require(bytes(_metadataHash).length > 0, "Metadata hash cannot be empty");
        
        orders[_orderId] = Order({
            orderId: _orderId,
            adminAddress: msg.sender,
            createdAt: block.timestamp,
            currentStatus: "CREATED",
            metadataHash: _metadataHash,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Thêm status update đầu tiên
        orderHistory[_orderId].push(StatusUpdate({
            status: "CREATED",
            timestamp: block.timestamp,
            details: _metadataHash,
            updatedBy: msg.sender
        }));
        
        totalOrders++;
        
        emit OrderCreated(_orderId, msg.sender, block.timestamp, _metadataHash);
        
        return true;
    }
    
    /**
     * @dev Cập nhật trạng thái đơn hàng
     * @param _orderId ID đơn hàng
     * @param _newStatus Trạng thái mới
     * @param _detailsHash Hash chi tiết cập nhật từ IPFS/MongoDB
     */
    function updateStatus(
        string memory _orderId,
        string memory _newStatus,
        string memory _detailsHash
    ) 
        external 
        onlyAuthorizedAdmin 
        orderExists(_orderId)
        returns (bool)
    {
        require(orders[_orderId].isActive, "Order is not active");
        require(bytes(_newStatus).length > 0, "Status cannot be empty");
        
        Order storage order = orders[_orderId];
        order.currentStatus = _newStatus;
        order.lastUpdated = block.timestamp;
        order.metadataHash = _detailsHash;
        
        // Thêm vào lịch sử
        orderHistory[_orderId].push(StatusUpdate({
            status: _newStatus,
            timestamp: block.timestamp,
            details: _detailsHash,
            updatedBy: msg.sender
        }));
        
        emit OrderStatusUpdated(_orderId, _newStatus, block.timestamp, _detailsHash, msg.sender);
        
        return true;
    }
    
    /**
     * @dev Hủy đơn hàng
     */
    function cancelOrder(string memory _orderId) 
        external 
        onlyAuthorizedAdmin 
        orderExists(_orderId)
        returns (bool)
    {
        require(orders[_orderId].isActive, "Order is already cancelled");
        
        orders[_orderId].isActive = false;
        orders[_orderId].currentStatus = "CANCELLED";
        orders[_orderId].lastUpdated = block.timestamp;
        
        orderHistory[_orderId].push(StatusUpdate({
            status: "CANCELLED",
            timestamp: block.timestamp,
            details: "",
            updatedBy: msg.sender
        }));
        
        emit OrderCancelled(_orderId, block.timestamp);
        
        return true;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Lấy thông tin đơn hàng
     */
    function getOrder(string memory _orderId) 
        external 
        view 
        orderExists(_orderId)
        returns (Order memory)
    {
        return orders[_orderId];
    }
    
    /**
     * @dev Lấy lịch sử cập nhật của đơn hàng
     */
    function getOrderHistory(string memory _orderId) 
        external 
        view 
        orderExists(_orderId)
        returns (StatusUpdate[] memory)
    {
        return orderHistory[_orderId];
    }
    
    /**
     * @dev Lấy số lần cập nhật của đơn hàng
     */
    function getOrderHistoryCount(string memory _orderId) 
        external 
        view 
        returns (uint256)
    {
        return orderHistory[_orderId].length;
    }
    
    /**
     * @dev Lấy trạng thái hiện tại của đơn hàng
     */
    function getCurrentStatus(string memory _orderId) 
        external 
        view 
        orderExists(_orderId)
        returns (string memory status, uint256 timestamp)
    {
        Order memory order = orders[_orderId];
        return (order.currentStatus, order.lastUpdated);
    }
    
    /**
     * @dev Kiểm tra admin có quyền không
     */
    function isAdminAuthorized(address _admin) 
        external 
        view 
        returns (bool)
    {
        return authorizedAdmins[_admin];
    }
}
