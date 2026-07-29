import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminProvider, useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/login")({
  component: () => (
    <AdminProvider>
      <LoginPage />
    </AdminProvider>
  ),
});

function LoginPage() {
  const nav = useNavigate();
  const { loginAdmin } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginAdmin(email, password);
      nav({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-center">Admin Sign In</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">NVS Jewellery Admin Panel</p>

        <label className="block mt-6">
          <span className="text-xs font-medium text-muted-foreground">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-background"
          />
        </label>

        <label className="block mt-4">
          <span className="text-xs font-medium text-muted-foreground">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-background"
          />
        </label>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-gold text-gold-foreground rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}