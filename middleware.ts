import { NextResponse, type NextRequest } from "next/server";
import { nanoid } from "nanoid";

const COOKIE_NAME = "ai_spotlight_pid";

export function middleware(req: NextRequest) {
  if (req.cookies.has(COOKIE_NAME)) return NextResponse.next();

  const id = nanoid(16);

  // Forward the cookie to the downstream handler so it sees the ID on this
  // same request — without this, the route handler reads "no cookie" and
  // generates a second ID before the browser persists the one we set below.
  const requestHeaders = new Headers(req.headers);
  const existingCookie = requestHeaders.get("cookie");
  requestHeaders.set(
    "cookie",
    existingCookie ? `${existingCookie}; ${COOKIE_NAME}=${id}` : `${COOKIE_NAME}=${id}`
  );

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export const config = {
  matcher: ["/", "/present", "/api/:path*"],
};
