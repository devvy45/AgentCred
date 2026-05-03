"use client";

import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { isAddress, type Hex } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WalletConnect } from "@/components/WalletConnect";
import { ENS_KEYS, resolveENS } from "@/lib/ens";
import { CHAIN_OPTIONS, CAPABILITY_OPTIONS } from "@/lib/options";
import { agentRegistryAbi } from "@/lib/registry";
import { cn, truncateAddress } from "@/lib/utils";

export function RegisterForm() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState(1);
  const [ensName, setEnsName] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [ensChecked, setEnsChecked] = useState(false);
  const [checkingEns, setCheckingEns] = useState(false);
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [chains, setChains] = useState<string[]>(["sepolia"]);
  const [keeperhubId, setKeeperhubId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registryTxHash, setRegistryTxHash] = useState<Hex | null>(null);
  const [ensWriteTxHash, setEnsWriteTxHash] = useState<string | null>(null);
  const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;

  const owned = Boolean(
    address && resolvedAddress && resolvedAddress.toLowerCase() === address.toLowerCase(),
  );

  const records = useMemo(
    () => ({
      [ENS_KEYS.CAPABILITIES]: capabilities.join(","),
      [ENS_KEYS.CHAINS]: chains.join(","),
      [ENS_KEYS.REGISTERED]: new Date().toISOString(),
      [ENS_KEYS.SCORE]: "0",
      [ENS_KEYS.EXECUTIONS]: "0",
      [ENS_KEYS.SUCCESS_RATE]: "0%",
      [ENS_KEYS.KEEPERHUB_ID]: keeperhubId,
      [ENS_KEYS.STATUS]: "active",
      [ENS_KEYS.DESCRIPTION]: description,
    }),
    [capabilities, chains, description, keeperhubId],
  );

  async function checkEns() {
    setCheckingEns(true);
    setEnsChecked(false);
    setError(null);
    try {
      setResolvedAddress(await resolveENS(ensName));
      setEnsChecked(true);
    } catch (err) {
      setResolvedAddress(null);
      setError(err instanceof Error ? err.message : "ENS lookup failed. Check your RPC configuration.");
    } finally {
      setCheckingEns(false);
    }
  }

  function toggle(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function readErrorMessage(value: unknown): string {
    if (value instanceof Error && value.message) return value.message;
    if (typeof value === "object" && value && "shortMessage" in value) {
      const shortMessage = (value as { shortMessage?: unknown }).shortMessage;
      if (typeof shortMessage === "string" && shortMessage) return shortMessage;
    }
    return "Registration failed";
  }

  async function parseApiError(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error) return body.error;
    } catch {
      // Fall through to status text.
    }
    return response.statusText || `Request failed with status ${response.status}`;
  }

  async function submit() {
    if (!address || !registryAddress || !isAddress(registryAddress)) return;
    setSubmitting(true);
    setError(null);
    setRegistryTxHash(null);
    setEnsWriteTxHash(null);
    try {
      const registryTx = await writeContractAsync({
        address: registryAddress,
        abi: agentRegistryAbi,
        functionName: "register",
        args: [ensName],
      });
      setRegistryTxHash(registryTx);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ensName,
          operatorAddress: address,
          capabilities,
          chains,
          description,
          keeperhubId,
        }),
      });
      if (!response.ok) {
        const message = await parseApiError(response);
        throw new Error(`Registry transaction succeeded, but AgentCred indexing failed: ${message}`);
      }

      const body = (await response.json()) as { ensWriteTxHash?: string };
      setEnsWriteTxHash(body.ensWriteTxHash ?? null);

      setProfileUrl(`/agent/${encodeURIComponent(ensName)}`);
      setStep(5);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 5 && profileUrl) {
    const tweet = encodeURIComponent(
      `just registered ${ensName} on AgentCred - the onchain reputation layer for AI agents. agentcred.xyz`,
    );
    return (
      <div className="surface mx-auto max-w-2xl rounded-lg p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-md bg-accent/10 text-accent">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold">Agent registered</h1>
        <p className="mt-2 text-muted">{ensName} is now indexed by AgentCred.</p>
        <div className="mt-6 space-y-2 rounded-lg border border-border bg-black/30 p-4 text-left text-sm">
          {registryTxHash ? (
            <p className="break-all">
              <span className="text-muted">Registry tx:</span>{" "}
              <span className="mono">{registryTxHash}</span>
            </p>
          ) : null}
          {ensWriteTxHash ? (
            <p className="break-all">
              <span className="text-muted">ENS write tx:</span>{" "}
              <span className="mono">{ensWriteTxHash}</span>
            </p>
          ) : null}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild><a href={profileUrl}>View profile</a></Button>
          <Button asChild variant="secondary"><a href={`https://twitter.com/intent/tweet?text=${tweet}`}>Share</a></Button>
          <Button asChild variant="secondary"><a href="https://app.keeperhub.com" target="_blank" rel="noreferrer">KeeperHub setup</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface mx-auto max-w-3xl rounded-lg p-6 sm:p-8">
      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={cn("h-1 flex-1 rounded bg-border", item <= step && "bg-accent")} />
        ))}
      </div>

      {step === 1 && (
        <section className="text-center">
          <h1 className="text-3xl font-bold">Connect operator wallet</h1>
          <p className="mt-2 text-muted">This wallet signs the registry transaction for your agent.</p>
          <div className="mt-8"><WalletConnect /></div>
          {address && <p className="mono mt-4 text-sm text-muted">Connected: {truncateAddress(address)}</p>}
          <Button className="mt-8" disabled={!isConnected} onClick={() => setStep(2)}>Next</Button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="text-3xl font-bold">ENS identity</h1>
          <p className="mt-2 text-muted">Use a Sepolia .eth name controlled by the connected operator.</p>
          <div className="mt-6 flex gap-3">
            <Input
              value={ensName}
              onChange={(event) => {
                setEnsName(event.target.value);
                setResolvedAddress(null);
                setEnsChecked(false);
                setError(null);
              }}
              placeholder="myagent.agentcred.eth"
            />
            <Button variant="secondary" onClick={checkEns} disabled={!ensName || checkingEns}>
              {checkingEns ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
            </Button>
          </div>
          {resolvedAddress && (
            <p className={cn("mt-3 text-sm", owned ? "text-accent" : "text-danger")}>
              {owned ? "Resolved and owned by connected wallet." : `Resolves to ${truncateAddress(resolvedAddress)}.`}
            </p>
          )}
          {!checkingEns && ensChecked && resolvedAddress === null ? (
            <p className="mt-3 text-sm text-danger">No address record found for this ENS name on Sepolia.</p>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <a className="mt-4 inline-flex items-center gap-1 text-sm text-muted" href="https://app.ens.domains" target="_blank" rel="noreferrer">
            Get an ENS name on Sepolia <ExternalLink className="h-3 w-3" />
          </a>
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={!owned} onClick={() => setStep(3)}>Next</Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="text-3xl font-bold">Agent details</h1>
          <div className="mt-6 space-y-6">
            <Textarea maxLength={280} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this agent do?" />
            <ChipGroup title="Capabilities" options={CAPABILITY_OPTIONS} selected={capabilities} onToggle={(value) => toggle(value, capabilities, setCapabilities)} />
            <ChipGroup title="Chains" options={CHAIN_OPTIONS} selected={chains} onToggle={(value) => toggle(value, chains, setChains)} />
            <Input value={keeperhubId} onChange={(event) => setKeeperhubId(event.target.value)} placeholder="KeeperHub Project ID" />
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button disabled={capabilities.length === 0 || chains.length === 0} onClick={() => setStep(4)}>Next</Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 className="text-3xl font-bold">Confirm records</h1>
          <div className="mt-6 rounded-lg border border-border bg-black/30">
            {Object.entries(records).map(([key, value]) => (
              <div key={key} className="grid gap-2 border-b border-border p-3 last:border-0 sm:grid-cols-[220px_1fr]">
                <span className="mono text-xs text-muted">{key}</span>
                <span className="break-words text-sm">{value || "-"}</span>
              </div>
            ))}
          </div>
          {!registryAddress || !isAddress(registryAddress) ? (
            <p className="mt-4 text-sm text-danger">Set NEXT_PUBLIC_REGISTRY_ADDRESS after deploying AgentRegistry.</p>
          ) : null}
          <p className="mt-4 text-sm text-muted">
            The registry transaction is signed by your wallet. AgentCred text records are written by the configured server wallet, which must control this ENS name or namespace on Sepolia.
          </p>
          {error && step === 4 ? (
            <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
            <Button disabled={submitting || !registryAddress || !isAddress(registryAddress)} onClick={submit}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Register agent
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function ChipGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              "rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:border-accent/50",
              selected.includes(option) && "border-accent/50 bg-accent/10 text-accent",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
