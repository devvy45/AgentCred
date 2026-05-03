import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config({ path: ".env.local" });
dotenv.config();

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  paths: {
    sources: ".",
    artifacts: "artifacts",
    cache: "cache",
  },
  networks: {
    sepolia: {
      url: alchemyKey ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}` : "",
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
