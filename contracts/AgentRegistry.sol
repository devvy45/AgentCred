// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    struct Agent {
        address operator;
        string ensName;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => Agent) public agents;
    mapping(string => address) public ensToOperator;
    address[] public allAgents;
    address public owner;

    event AgentRegistered(address indexed operator, string ensName, uint256 timestamp);
    event AgentDeactivated(address indexed operator);
    event AgentReactivated(address indexed operator);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(string calldata ensName) external {
        require(bytes(ensName).length > 0, "empty ENS name");
        require(ensToOperator[ensName] == address(0), "ENS name already registered");
        require(agents[msg.sender].registeredAt == 0, "operator already registered");

        agents[msg.sender] = Agent({
            operator: msg.sender,
            ensName: ensName,
            registeredAt: block.timestamp,
            active: true
        });
        ensToOperator[ensName] = msg.sender;
        allAgents.push(msg.sender);

        emit AgentRegistered(msg.sender, ensName, block.timestamp);
    }

    function deactivate() external {
        require(agents[msg.sender].active, "not active");
        agents[msg.sender].active = false;
        emit AgentDeactivated(msg.sender);
    }

    function reactivate(address operator) external onlyOwner {
        require(agents[operator].registeredAt > 0, "not registered");
        agents[operator].active = true;
        emit AgentReactivated(operator);
    }

    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }

    function getAgent(address operator) external view returns (Agent memory) {
        return agents[operator];
    }

    function isRegistered(address operator) external view returns (bool) {
        return agents[operator].registeredAt > 0;
    }
}
