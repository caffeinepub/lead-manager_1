import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Eye,
  EyeOff,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: Users, text: "Role-based access: Admin, HOD, and FSE" },
  { icon: BarChart2, text: "Track leads through every stage" },
  { icon: Shield, text: "Secure local login with session persistence" },
];

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Simulate brief loading
    setTimeout(() => {
      const ok = login(username.trim(), password);
      if (!ok) {
        setError("Invalid username or password. Please try again.");
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.19 195), transparent)",
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.2 300), transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.93 0.01 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.93 0.01 260) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-glow">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            LeadFlow
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Lead Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-5">
            <div>
              <Label
                htmlFor="username"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="bg-secondary border-border"
                data-ocid="login.username_input"
              />
            </div>
            <div>
              <Label
                htmlFor="password"
                className="text-sm text-muted-foreground mb-1.5 block"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="bg-secondary border-border pr-10"
                  data-ocid="login.password_input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
                data-ocid="login.error_state"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              data-ocid="login.submit_button"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="space-y-2.5 pt-4 border-t border-border">
            {FEATURES.map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-3 text-xs text-muted-foreground"
              >
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                {text}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
