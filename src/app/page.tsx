import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin");
  } else if (session.user.role === "BRANCH_MANAGER") {
    redirect("/manager");
  } else if (session.user.role === "TECHNICIAN") {
    redirect("/tech");
  }

  redirect("/login");
}