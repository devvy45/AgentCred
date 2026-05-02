import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: alchemyKey ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}` : "",
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
