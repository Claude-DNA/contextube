import { handle, json } from "@/lib/http";
import { listFlows } from "@/lib/content";

export const GET = handle(async () => json({ flows: await listFlows() }));
