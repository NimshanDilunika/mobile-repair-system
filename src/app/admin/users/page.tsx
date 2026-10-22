import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserFormModal from "@/components/UserFormModal";
import ToggleStatusButton from "@/components/ToggleStatusButton";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [users, branches] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { branch: { select: { name: true, code: true } } },
    }),
    db.serviceCenter.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div>
            <h1 className="text-2xl font-bold">User Access Management</h1>
            <p className="text-slate-400 text-xs">Provision, modify, and activate/deactivate system accounts</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold transition"
            >
              ← Back to Admin
            </Link>
            <UserFormModal branches={branches} />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {users.map((u) => {
                const isInactive = u.role === "INACTIVE";
                return (
                  <tr key={u.id} className={isInactive ? "opacity-50 bg-slate-950/40" : ""}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-100">{u.name}</p>
                      <p className="text-slate-400 text-[11px]">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isInactive ? "bg-red-900/60 text-red-300" :
                        u.role === "SUPER_ADMIN" ? "bg-purple-900/60 text-purple-300" :
                        u.role === "BRANCH_MANAGER" ? "bg-blue-900/60 text-blue-300" :
                        "bg-emerald-900/60 text-emerald-300"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {u.branch ? `${u.branch.name} (${u.branch.code})` : "Global"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{u.phoneNumber || "—"}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <UserFormModal branches={branches} existingUser={u} />
                      {u.id !== session.user.id && (
                        <ToggleStatusButton userId={u.id} currentRole={u.role} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}