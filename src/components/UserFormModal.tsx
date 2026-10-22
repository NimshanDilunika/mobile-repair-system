"use client";

import { useState, useActionState } from "react";
import { createSystemUser, updateSystemUser } from "@/app/actions/admin";

export default function UserFormModal({
  branches,
  existingUser,
}: {
  branches: { id: string; name: string; code: string }[];
  existingUser?: any;
}) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(existingUser);
  const [state, formAction, isPending] = useActionState(
    isEditing ? updateSystemUser : createSystemUser,
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
          isEditing
            ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
      >
        {isEditing ? "Edit" : "+ Add New User"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit User: ${existingUser.name}` : "Provision New User"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {state?.error && (
              <div className="p-2.5 bg-red-900/40 border border-red-500 rounded text-red-200 text-xs">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="p-2.5 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-200 text-xs">
                {state.message}
              </div>
            )}

            <form action={formAction} className="space-y-3 text-xs">
              {isEditing && <input type="hidden" name="userId" value={existingUser.id} />}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={existingUser?.name || ""}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isEditing}
                  defaultValue={existingUser?.email || ""}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {isEditing ? "Reset Password (leave empty to keep current)" : "Password *"}
                </label>
                <input
                  name={isEditing ? "newPassword" : "password"}
                  type="password"
                  required={!isEditing}
                  placeholder={isEditing ? "••••••••" : "Min 6 characters"}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role *</label>
                  <select
                    name="role"
                    defaultValue={existingUser?.role || "TECHNICIAN"}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Branch</label>
                  <select
                    name="branchId"
                    defaultValue={existingUser?.branchId || ""}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="">No Branch (Global)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                <input
                  name="phoneNumber"
                  defaultValue={existingUser?.phoneNumber || ""}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}