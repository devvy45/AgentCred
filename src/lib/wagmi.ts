"use client";

import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  : undefined;

export const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [metaMask(), injected()],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
});
