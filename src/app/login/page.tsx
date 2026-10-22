"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Fetch the updated session to get the user's role
      const session = await getSession();
      const role = session?.user?.role;

      if (role === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (role === "BRANCH_MANAGER") {
        router.push("/manager");
      } else if (role === "TECHNICIAN") {
        router.push("/tech");
      } else if (role === "CUSTOMER") {
        router.push("/portal");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-2">Repair Management System</h1>
        <p className="text-sm text-slate-400 text-center mb-6">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              placeholder="tech1.cmb@repairsystem.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg transition disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Test Accounts (Password: Password@123):</p>
          <p>• Super Admin: admin@repairsystem.com</p>
          <p>• Manager: manager.cmb@repairsystem.com</p>
          <p>• Technician: tech1.cmb@repairsystem.com</p>
          <p>• Customer: customer@example.com</p>
        </div>
      </div>
    </div>
  );
}