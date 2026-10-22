import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AddPartModal from "@/components/AddPartModal";
import EditStockModal from "@/components/EditStockModal";

export default async function BranchInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const session = await auth();

  if (
    !session?.user ||
    !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)
  ) {
    redirect("/login");
  }

  const { branch: queryBranch } = await searchParams;

// 1. Fetch branches for the selector
  const branches = await db.serviceCenter.findMany({
    select: { id: true, name: true, address: true },
    orderBy: { name: "asc" },
  });

  // 2. Resolve Active Branch Scope
  let activeBranchId: string | undefined = undefined;

  if (session.user.role === "BRANCH_MANAGER") {
    // Managers are strictly locked to their assigned branch
    activeBranchId = session.user.branchId || branches[0]?.id;
  } else {
    // Super Admins can select any branch or view all
    activeBranchId = queryBranch || undefined;
  }

  // 3. Query Parts for the selected branch (or all branches for Admin)
  const rawParts = await db.inventoryItem.findMany({
    where: activeBranchId ? { branchId: activeBranchId } : {},
    include: {
      branch: true,
    },
    orderBy: { partName: "asc" },
  });

  // Clean serialization to eliminate Decimal pass-through errors
// In src/app/manager/inventory/page.tsx

  // 1. Map raw parts using reorderLevel
  const parts = rawParts.map((p) => ({
    id: p.id,
    partName: p.partName,
    partSku: p.partSku,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    stockQuantity: p.stockQuantity,
    reorderLevel: p.reorderLevel, // Matches schema
    branchId: p.branchId,
    branchName: p.branch?.name || "Unknown Branch",
  }));

  const dashboardHref = session.user.role === "SUPER_ADMIN" ? "/admin" : "/manager";

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Replacement Parts Inventory</h1>
            <p className="text-slate-400 text-sm">
              Manage spare parts stock, unit pricing, and branch allocation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={dashboardHref}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition"
            >
              ← Dashboard
            </Link>
            <AddPartModal
              branches={branches}
              userRole={session.user.role}
              userBranchId={session.user.branchId}
            />
          </div>
        </div>

        {/* Branch Filter Tabs (Admin Filter or Manager Fixed Info) */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Branch:
            </span>
            {session.user.role === "SUPER_ADMIN" ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/manager/inventory"
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    !activeBranchId
                      ? "bg-blue-600 text-white"
                      : "bg-slate-950 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  All Branches
                </Link>
                {branches.map((b) => (
                  <Link
                    key={b.id}
                    href={`/manager/inventory?branch=${b.id}`}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeBranchId === b.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-950 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            ) : (
              <span className="px-3 py-1 bg-slate-950 text-blue-400 font-semibold rounded-lg text-xs border border-slate-700">
                {branches.find((b) => b.id === activeBranchId)?.name || "Assigned Branch"}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400">
            Total Parts Listed: <strong className="text-white">{parts.length}</strong>
          </div>
        </div>

        {/* Parts Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Part / SKU</th>
                  {session.user.role === "SUPER_ADMIN" && <th className="py-3 px-4">Branch</th>}
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">In Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-slate-200">
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                      No replacement parts found for this branch. Click "+ Add New Part" above.
                    </td>
                  </tr>
                ) : (
                  parts.map((p) => {
    const isOutOfStock = p.stockQuantity === 0;
    const isLowStock = p.stockQuantity <= p.reorderLevel;

    return (
      <tr key={p.id} className="hover:bg-slate-750 transition-colors">
        <td className="py-3 px-4">
          <div className="font-medium text-slate-100">{p.partName}</div>
          <div className="text-xs font-mono text-slate-400">{p.partSku}</div>
        </td>
        {session.user.role === "SUPER_ADMIN" && (
          <td className="py-3 px-4 text-xs text-slate-300">{p.branchName}</td>
        )}
        <td className="py-3 px-4 font-mono text-slate-300">
          ${p.costPrice.toFixed(2)}
        </td>
        <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
          ${p.sellingPrice.toFixed(2)}
        </td>
        <td className="py-3 px-4 font-mono font-bold">{p.stockQuantity}</td>
        <td className="py-3 px-4">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-900/60 text-red-300">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-900/60 text-amber-300">
              Low Stock (&le; {p.reorderLevel})
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/40 text-emerald-300">
              Available
            </span>
          )}
        </td>
        <td className="py-3 px-4 text-center">
          <EditStockModal part={p} />
        </td>
      </tr>
    );
  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}