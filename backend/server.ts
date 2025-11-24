import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"; 
import {
  createZypherContext,
  OpenAIModelProvider,
  ZypherAgent
} from "@corespeed/zypher";
import { eachValueFrom } from "npm:rxjs-for-await";

const PORT = 8000;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
if (!FIRECRAWL_API_KEY) throw new Error("Missing FIRECRAWL_API_KEY");

async function scrapeUrl(url: string, apiKey: string) {
  console.log(`Scraping: ${url}`);

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!res.ok) {
    throw new Error(`Firecrawl Error: ${res.status} — ${res.statusText}`);
  }

  const json = await res.json();
  return json.data?.markdown || "";
}

const app = new Application();
const router = new Router();

app.use(oakCors());

router.post("/api/scrape", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { url } = body;

    if (!url) {
      ctx.response.status = 400;
      ctx.response.body = { error: "URL is required" };
      return;
    }

    console.log("Scraping URL:", url);

    // 1) Scrape webpage
    const scraped = await scrapeUrl(url, FIRECRAWL_API_KEY);

    console.log("Scrape complete — summarizing...");

    // 2) Init Zypher agent
    const context = await createZypherContext(Deno.cwd());
    const agent = new ZypherAgent(
      context,
      new OpenAIModelProvider({ apiKey: OPENAI_API_KEY })
    );

    // 3) Build summarization prompt
    const prompt = `
      Here is scraped content from the webpage:

      ${scraped.substring(0,15000)}

      Please summarize the key points in clear Markdown format.
    `;

    const event$ = agent.runTask(prompt, "gpt-4o-2024-08-06");
    let result = "";

    for await (const event of eachValueFrom(event$)) {
      if (event.type === "message" && event.message.role === "assistant") {
        const content = event.message.content;
        if (Array.isArray(content)) {
          content.forEach(part => {
            if (part.type === "text") result += part.text;
          });
        }
      }
    }

    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = {
      success: true,
      url,
      summary: result
    };

  } catch (err) {
    console.error("ERROR:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: err.message };
  }
});

router.get("/", (ctx) => {
  ctx.response.body = "Zypher API Active!  Send POST /api/scrape";
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`API running at http://localhost:${PORT}`);
await app.listen({ port: PORT });
