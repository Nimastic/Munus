// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Escrow
 * @notice Pay-on-delivery escrow for chat-native jobs (Munus)
 * @dev Supports both native ETH and ERC-20 tokens
 */
contract Escrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { Open, Accepted, Delivered, Released, Refunded }

    struct Job {
        address creator;
        address assignee;       // set on accept
        address token;          // address(0) = native ETH
        uint256 amount;
        uint64  deadline;       // unix seconds
        State   state;
        string  metadataCID;    // job brief / resources CID
        bytes32 artifactHash;   // artifact hash provided on deliver
        string  attestationCID; // CID for signed attestation (Calimero)
    }

    uint256 public nextId;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed id, address indexed creator, address token, uint256 amount, uint64 deadline, string metadataCID);
    event JobAccepted(uint256 indexed id, address indexed assignee);
    event JobDelivered(uint256 indexed id, bytes32 artifactHash, string attestationCID);
    event Released(uint256 indexed id, address indexed to, uint256 amount);
    event Refunded(uint256 indexed id, address indexed to, uint256 amount);

    error InvalidState();
    error NotCreator();
    error NotAssignee();
    error PastDeadline();
    error ZeroAmount();
    error AlreadyAssigned();
    error NotExpired();

    modifier inState(uint256 id, State s) {
        if (jobs[id].state != s) revert InvalidState();
        _;
    }

    /**
     * @notice Create a new job with escrowed funds
     * @param token Token address (address(0) for native ETH)
     * @param amount Amount to escrow
     * @param deadline Unix timestamp deadline
     * @param metadataCID IPFS CID with job details
     */
    function createJob(
        address token,
        uint256 amount,
        uint64  deadline,
        string calldata metadataCID
    ) external payable nonReentrant returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (deadline <= block.timestamp) revert PastDeadline();

        id = nextId++;
        Job storage j = jobs[id];
        j.creator = msg.sender;
        j.token = token;
        j.amount = amount;
        j.deadline = deadline;
        j.state = State.Open;
        j.metadataCID = metadataCID;

        if (token == address(0)) {
            // native coin
            require(msg.value == amount, "Native amount mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit JobCreated(id, msg.sender, token, amount, deadline, metadataCID);
    }

    /**
     * @notice Accept an open job
     * @param id Job ID
     */
    function accept(uint256 id) external inState(id, State.Open) {
        Job storage j = jobs[id];
        if (j.assignee != address(0)) revert AlreadyAssigned();
        j.assignee = msg.sender;
        j.state = State.Accepted;
        emit JobAccepted(id, msg.sender);
    }

    /**
     * @notice Deliver completed work with proof
     * @param id Job ID
     * @param artifactHash Hash of the deliverable
     * @param attestationCID IPFS CID of signed attestation
     */
    function deliver(uint256 id, bytes32 artifactHash, string calldata attestationCID)
        external
        inState(id, State.Accepted)
    {
        Job storage j = jobs[id];
        if (msg.sender != j.assignee) revert NotAssignee();
        j.artifactHash = artifactHash;
        j.attestationCID = attestationCID;
        j.state = State.Delivered;
        emit JobDelivered(id, artifactHash, attestationCID);
    }

    /**
     * @notice Release payment to worker
     * @param id Job ID
     * @param to Recipient address
     */
    function release(uint256 id, address to)
        external
        nonReentrant
    {
        Job storage j = jobs[id];
        require(j.state == State.Delivered, "Not delivered");
        
        // Allow creator to release anytime, or auto-release after deadline
        bool canAuto = block.timestamp >= j.deadline;
        if (!(msg.sender == j.creator || canAuto)) revert NotCreator();

        _payout(id, to);
        j.state = State.Released;
        emit Released(id, to, j.amount);
    }

    /**
     * @notice Refund creator if job not completed by deadline
     * @param id Job ID
     * @param to Refund recipient
     */
    function refund(uint256 id, address to)
        external
        nonReentrant
    {
        Job storage j = jobs[id];
        if (msg.sender != j.creator) revert NotCreator();
        if (block.timestamp < j.deadline) revert NotExpired();
        require(j.state == State.Open || j.state == State.Accepted, "Cannot refund");

        _payoutInternal(j, to);
        j.state = State.Refunded;
        emit Refunded(id, to, j.amount);
    }

    function _payout(uint256 id, address to) internal {
        Job storage j = jobs[id];
        _payoutInternal(j, to);
    }

    function _payoutInternal(Job storage j, address to) internal {
        uint256 amt = j.amount;
        j.amount = 0; // effects first
        if (j.token == address(0)) {
            (bool ok, ) = to.call{value: amt}("");
            require(ok, "Native transfer failed");
        } else {
            IERC20(j.token).safeTransfer(to, amt);
        }
    }

    /**
     * @notice Get job details
     * @param id Job ID
     */
    function getJob(uint256 id) external view returns (Job memory) {
        return jobs[id];
    }
}


