import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Admin-only routes
    if (pathname.startsWith("/admin")) {
      if (!token?.isAdmin && !token?.isFriend) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Friends-Verwaltung nur für Admins
      if (pathname.startsWith("/admin/friends") || pathname.startsWith("/admin/users") || pathname.startsWith("/admin/invites")) {
        if (!token?.isAdmin) {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    }

    // ML Performance - check permission for friends
    if (pathname.startsWith("/ai-trading/ml-performance")) {
      if (token?.isFriend && token?.permissions) {
        const perms = token.permissions as any;
        if (!perms.canViewML) {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    }

    // Depot: Admin-only — Freunde und normale Nutzer sehen kein Depot
    if (pathname.startsWith("/depot") || pathname.startsWith("/api/depot")) {
      if (!token?.isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const path = req.nextUrl.pathname;
        
        // Öffentliche Routen - KEIN Login erforderlich
        if (
          path === "/" ||
          path === "/login" ||
          path === "/register" ||
          path.startsWith("/api/auth") ||
          path === "/api/signup" ||
          path === "/api/register"
        ) {
          return true;
        }

        // Öffentliche API-Routen (Daten für Homepage)
        if (
          path === "/api/stock" ||
          path === "/api/search" ||
          path === "/api/news" ||
          path === "/api/sector-peers" ||
          path === "/api/version"
        ) {
          return true;
        }

        // Alle anderen Routen: Login erforderlich
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    /*
     * Alle Routen außer statische Dateien und Next.js-interne Routen.
     * Dies schützt:
     * - Alle Seiten (außer /, /login, /register)
     * - Alle API-Routen (außer /api/auth/*, /api/stock, /api/search, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|ml_data|images|icons).*)",
  ]
};
