import { auth, signOut } from "@/auth";
import { db } from "@/app/lib/prisma";
import Link from "next/link";

export default async function TopRibbon() {
  const session = await auth();

  if (!session?.user) return null;

  // Fetch branch details if user is assigned to a branch
  let branchName = "Global Operations";
  if (session.user.branchId) {
    const branch = await db.serviceCenter.findUnique({
      where: { id: session.user.branchId },
      select: { name: true, code: true },
    });
    if (branch) {
      branchName = `${branch.name} (${branch.code})`;
    }
  }

  // Format role label and badge style
  const roleStyles: Record<string, { label: string; badge: string }> = {
    SUPER_ADMIN: {
      label: "Super Admin",
      badge: "bg-purple-900/50 text-purple-300 border-purple-700/60",
    },
    BRANCH_MANAGER: {
      label: "Branch Manager",
      badge: "bg-blue-900/50 text-blue-300 border-blue-700/60",
    },
    TECHNICIAN: {
      label: "Technician",
      badge: "bg-emerald-900/50 text-emerald-300 border-emerald-700/60",
    },
  };

  const currentRole = roleStyles[session.user.role] || {
    label: session.user.role || "Staff",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Top Left: Shop Details */}
        <div className="flex items-center gap-3">
          <Link href={session.user.role === "SUPER_ADMIN" ? "/admin" : session.user.role === "BRANCH_MANAGER" ? "/manager" : "/tech"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition">
              🔧
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition">
                FixTech Repair
              </span>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                Service Management Hub
              </p>
            </div>
          </Link>

          <span className="hidden sm:inline-block h-5 w-px bg-slate-800 mx-1" />

          {/* Active Branch Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-200">{branchName}</span>
          </div>
        </div>

        {/* Top Right: User Name, Role, & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-200 leading-tight">
                {session.user.name || "User"}
              </p>
              <p className="text-[11px] text-slate-400">{session.user.email}</p>
            </div>
            <span
              className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${currentRole.badge}`}
            >
              {currentRole.label}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Logout Action */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </form>
        </div>

      </div>
    </header>
  );
}