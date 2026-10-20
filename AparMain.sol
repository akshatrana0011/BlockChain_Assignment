// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CampusFix - Campus maintenance request tracking
/// @notice Students can submit maintenance requests; the owner manages request status.
contract CampusFix {
    enum Status { Open, InProgress, Resolved }

    struct Request {
        uint256 id;
        address requester;
        string title;
        string description;
        Status status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    address public immutable owner;
    uint256 public requestCount;
    mapping(uint256 => Request) private requests;

    event RequestCreated(
        uint256 indexed id,
        address indexed requester,
        string title,
        uint256 createdAt
    );
    event StatusChanged(
        uint256 indexed id,
        Status oldStatus,
        Status newStatus,
        address indexed updatedBy,
        uint256 updatedAt
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can update status");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createRequest(
        string calldata title,
        string calldata description
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title is required");
        require(bytes(title).length <= 80, "Title exceeds 80 bytes");
        require(bytes(description).length > 0, "Description is required");
        require(bytes(description).length <= 500, "Description exceeds 500 bytes");

        uint256 id = ++requestCount;
        uint256 nowTime = block.timestamp;
        requests[id] = Request({
            id: id,
            requester: msg.sender,
            title: title,
            description: description,
            status: Status.Open,
            createdAt: nowTime,
            updatedAt: nowTime
        });

        emit RequestCreated(id, msg.sender, title, nowTime);
        return id;
    }

    function getRequest(uint256 id) external view returns (Request memory) {
        require(id > 0 && id <= requestCount, "Invalid request ID");
        return requests[id];
    }

    function getRequests(uint256 offset, uint256 limit)
        external
        view
        returns (Request[] memory result)
    {
        if (offset >= requestCount || limit == 0) {
            return new Request[](0);
        }

        uint256 available = requestCount - offset;
        uint256 count = limit < available ? limit : available;
        result = new Request[](count);

        // Offset 0 returns the newest request.
        for (uint256 i = 0; i < count; i++) {
            uint256 id = requestCount - offset - i;
            result[i] = requests[id];
        }
    }

    function updateStatus(uint256 id, Status newStatus) external onlyOwner {
        require(id > 0 && id <= requestCount, "Invalid request ID");
        Request storage item = requests[id];
        require(item.status != newStatus, "Status is already set");
        require(uint8(newStatus) <= uint8(Status.Resolved), "Invalid status");

        Status oldStatus = item.status;
        item.status = newStatus;
        item.updatedAt = block.timestamp;
        emit StatusChanged(id, oldStatus, newStatus, msg.sender, block.timestamp);
    }
}