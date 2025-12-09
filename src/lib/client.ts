import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

export const client = treaty<App>(
  "https://realtime-chat-nine-black.vercel.app"
).api;
