import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminProvider, useAdmin } from "@/lib/admin-store";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

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

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-card/70 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-10 shadow-2xl">
        
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4 shadow-inner">
            <Sparkles className="w-6 h-6 text-gold" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Admin Sign In
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">
            NVS Jewellery Management Panel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="mt-8 space-y-4">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Email Address
            </label>

            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />

              <input
                type="email"
                required
                placeholder="admin@nvsjewellery.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
              Password
            </label>

            <div className="relative flex items-center">
              {/* Lock Icon */}
              <Lock className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />

              {/* Password Input */}
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-input bg-background/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-200"
              />

              {/* Show / Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full mt-2 bg-gold hover:opacity-90 active:scale-[0.99] text-gold-foreground rounded-xl py-3 text-sm font-semibold transition-all duration-200 shadow-lg shadow-gold/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-muted-foreground/70 mt-8">
          Protected route • Authorized personnel only
        </p>
      </div>
    </div>
  );
}