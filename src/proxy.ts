import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/signin", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|signin|auth-error|legal|_next/static|_next/image|favicon.ico).*)"],
};
