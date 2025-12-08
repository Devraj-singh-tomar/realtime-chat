import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  // Check If User Is Allowed To Join Room
  // If They Are Let Them Pass
  //  If They Are Not Send Them Back To Lobby

  const pathName = req.nextUrl.pathname;
  const roomMatch = pathName.match(/^\/room\/([^/]+)$/);

  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));

  const roomId = roomMatch[1];

  const meta = await redis.hgetall<{ connected: string[]; createdAt: number }>(
    `meta:${roomId}`
  );

  if (!meta) {
    return NextResponse.redirect(new URL("/?error=rooom-not-found", req.url));
  }

  const existingToken = req.cookies.get("x-auth-token")?.value;

  // User Is Allowed To Join Room
  if (existingToken && meta.connected.includes(existingToken)) {
    return NextResponse.next();
  }

  //   User Is Not Allowed To Join Room
  if (meta.connected.length >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full", req.url));
  }

  const response = NextResponse.next();

  const token = nanoid();

  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  await redis.hset(`meta:${roomId}`, {
    connected: [...meta.connected, token],
  });

  return response;
};

export const config = {
  matcher: "/room/:path*",
};
