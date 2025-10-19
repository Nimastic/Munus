// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Escrow.sol";

/**
 * @title SessionManager
 * @notice Allows users to grant limited permissions to an agent for autonomous job acceptance
 * @dev Implements session-based authorization for AI agents
 */
contract SessionManager {
    struct Session {
        address user;           // User who created session
        address agent;          // AI agent address
        uint256 expiresAt;      // Session expiry timestamp
        uint256 maxJobs;        // Max jobs agent can accept
        uint256 maxValuePerJob; // Max value per job (in wei)
        uint256 jobsAccepted;   // Counter
        bool active;
    }

    Escrow public escrow;
    
    mapping(bytes32 => Session) public sessions;
    mapping(address => bytes32[]) public userSessions;
    
    event SessionCreated(bytes32 indexed sessionId, address indexed user, address indexed agent, uint256 expiresAt);
    event SessionUsed(bytes32 indexed sessionId, uint256 jobId);
    event SessionRevoked(bytes32 indexed sessionId);

    error SessionExpired();
    error SessionInactive();
    error MaxJobsReached();
    error ValueTooHigh();
    error Unauthorized();

    constructor(address _escrow) {
        escrow = Escrow(_escrow);
    }

    /**
     * @notice Create a session for an AI agent
     * @param agent Address of the AI agent
     * @param duration Session duration in seconds
     * @param maxJobs Maximum number of jobs agent can accept
     * @param maxValuePerJob Maximum value per job in wei
     */
    function createSession(
        address agent,
        uint256 duration,
        uint256 maxJobs,
        uint256 maxValuePerJob
    ) external returns (bytes32 sessionId) {
        require(duration > 0 && duration <= 7 days, "Invalid duration");
        require(maxJobs > 0 && maxJobs <= 100, "Invalid max jobs");
        
        sessionId = keccak256(abi.encodePacked(msg.sender, agent, block.timestamp));
        
        sessions[sessionId] = Session({
            user: msg.sender,
            agent: agent,
            expiresAt: block.timestamp + duration,
            maxJobs: maxJobs,
            maxValuePerJob: maxValuePerJob,
            jobsAccepted: 0,
            active: true
        });
        
        userSessions[msg.sender].push(sessionId);
        
        emit SessionCreated(sessionId, msg.sender, agent, block.timestamp + duration);
    }

    /**
     * @notice Agent accepts a job on behalf of user
     * @param sessionId Session ID
     * @param jobId Job ID to accept
     */
    function acceptJobWithSession(bytes32 sessionId, uint256 jobId) external {
        Session storage session = sessions[sessionId];
        
        if (!session.active) revert SessionInactive();
        if (block.timestamp > session.expiresAt) revert SessionExpired();
        if (msg.sender != session.agent) revert Unauthorized();
        if (session.jobsAccepted >= session.maxJobs) revert MaxJobsReached();
        
        // Get job details
        Escrow.Job memory job = escrow.getJob(jobId);
        
        // Validate job value
        if (job.amount > session.maxValuePerJob) revert ValueTooHigh();
        
        // Accept job on behalf of user
        // NOTE: This requires Escrow contract to accept calls from SessionManager
        // OR user must first approve SessionManager as their representative
        
        session.jobsAccepted++;
        
        emit SessionUsed(sessionId, jobId);
    }

    /**
     * @notice Revoke a session
     * @param sessionId Session ID to revoke
     */
    function revokeSession(bytes32 sessionId) external {
        Session storage session = sessions[sessionId];
        require(msg.sender == session.user, "Not session owner");
        
        session.active = false;
        
        emit SessionRevoked(sessionId);
    }

    /**
     * @notice Check if session is valid
     */
    function isSessionValid(bytes32 sessionId) external view returns (bool) {
        Session memory session = sessions[sessionId];
        return session.active && 
               block.timestamp <= session.expiresAt &&
               session.jobsAccepted < session.maxJobs;
    }

    /**
     * @notice Get user's sessions
     */
    function getUserSessions(address user) external view returns (bytes32[] memory) {
        return userSessions[user];
    }
}

