import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  { prefix: "/student", roles: ["student"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/admin", roles: ["admin", "owner"] },
];

const dashboardPathByRole: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  owner: "/admin",
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;
  const matchedRoute = protectedRoutes.find((route) => pathname.startsWith(route.prefix));

  if (matchedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && token && role && dashboardPathByRole[role]) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPathByRole[role];
    return NextResponse.redirect(url);
  }

  if (matchedRoute && token && role && !matchedRoute.roles.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPathByRole[role] || "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/"],
};
