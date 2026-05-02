import { ethers } from "hardhat";

async function main() {
  const Registry = await ethers.getContractFactory("AgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  console.log(`AgentRegistry deployed to ${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
