import { NextResponse } from "next/server";

const COOKIE_NAME = "auth";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function POST(request) {
  try {
    const body = await request.json();
    const username = body?.username ?? "";
    const password = body?.password ?? "";

    const expectedUser = process.env.LOGIN_USERNAME ?? "";
    const expectedPass = process.env.LOGIN_PASSWORD ?? "";
    const sessionSecret = process.env.SESSION_SECRET ?? "";

    if (!expectedUser || !expectedPass || !sessionSecret) {
      return NextResponse.json(
        { error: "Server login not configured" },
        { status: 500 }
      );
    }

    if (username !== expectedUser || password !== expectedPass) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, sessionSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
