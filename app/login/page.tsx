"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Car, Workflow, Wrench, Boxes, ShieldCheck } from "lucide-react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleArt } from "@/components/vehicle-art";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const HIGHLIGHTS = [
  { icon: Car, label: "Vehicle lifecycle", sub: "stock → allocated → delivered" },
  { icon: Workflow, label: "FIFO allocation", sub: "demand matched to oldest stock" },
  { icon: Wrench, label: "Service & workshop", sub: "estimates, job cards, QC" },
  { icon: Boxes, label: "Live inventory", sub: "batches, serials, expiry" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api.post("/auth/login", { email, password });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand hero — matches the fleet dashboard's blue→indigo language */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white lg:flex">
        {/* soft glow + grid texture */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10.5px] font-bold tracking-[0.16em] uppercase backdrop-blur">
            <ShieldCheck className="size-3.5" />
            Dealer Management System
          </span>
          <h1 className="mt-6 max-w-md text-4xl leading-tight font-semibold tracking-tight">
            Run your entire EV dealership from one place.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            Vehicles, allocation, service and inventory — one connected platform
            for the Seeka Motor network.
          </p>

          <ul className="mt-8 grid max-w-md gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h.label}
                className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <h.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{h.label}</p>
                  <p className="text-xs text-white/60">{h.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* decorative vehicle */}
        <div className="relative mt-10 flex items-end justify-between">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Seeka Motor
          </p>
          <VehicleArt
            model="scooter"
            className="h-24 w-auto opacity-90 drop-shadow-[0_12px_24px_rgb(0_0_0/0.25)]"
          />
        </div>
      </aside>

      {/* Sign-in form */}
      <main className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <Image
              src="/brand/seeka-logo.png"
              alt="Seeka Motor"
              width={600}
              height={307}
              priority
              className="h-16 w-auto"
            />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your dealer network
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_-8px_rgb(37_99_235/0.8)]"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground lg:text-left">
            Seeka Motor · Dealer Management System
          </p>
        </div>
      </main>
    </div>
  );
}
