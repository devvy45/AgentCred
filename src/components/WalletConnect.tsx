"use client";

import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  if (isConnected && address) {
    return (
      <Button variant="secondary" onClick={() => disconnect()}>
        <Wallet className="h-4 w-4" />
        {truncateAddress(address)}
      </Button>
    );
  }

  return (
    <Button onClick={() => connector && connect({ connector })} disabled={!connector || isPending}>
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
