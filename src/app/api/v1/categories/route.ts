import { handle, json } from "@/lib/http";
import { listCategories } from "@/lib/content";

export const GET = handle(async () => json(await listCategories()));
