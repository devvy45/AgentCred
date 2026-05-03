import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Register — AgentCred",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-black/40 backdrop-blur">
        <div className="container-shell flex items-center justify-between py-6">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            AgentCred
          </Link>
          <Link href="/" className="text-sm text-muted transition hover:text-foreground">
            ← Back
          </Link>
        </div>
      </header>
      <div className="container-shell py-10">
        <RegisterForm />
      </div>
    </div>
  );
}
