import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage) {
    if (token) {
      if (token.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
      if (token.role === "BRANCH_MANAGER") return NextResponse.redirect(new URL("/manager", req.url));
      if (token.role === "TECHNICIAN") return NextResponse.redirect(new URL("/tech", req.url));
      return NextResponse.redirect(new URL("/portal", req.url));
    }
    return NextResponse.next();
  }

  // Protect Admin routes
  if (pathname.startsWith("/admin") && token?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect Manager routes
  if (pathname.startsWith("/manager") && !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(token?.role as string)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect Technician routes
  if (pathname.startsWith("/tech") && !["SUPER_ADMIN", "BRANCH_MANAGER", "TECHNICIAN"].includes(token?.role as string)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect Customer Portal
  if (pathname.startsWith("/portal") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/tech/:path*", "/portal/:path*", "/login", "/register"],
};