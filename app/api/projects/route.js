import { get, list, put } from "@vercel/blob";
import starter from "../../../starter.json";

const PATH = "project-hub/projects.json";

async function readProjects() {
  const { blobs } = await list({ prefix: PATH, limit: 1 });
  if (!blobs.length) return starter;
  const result = await get(blobs[0].url, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return starter;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

export async function GET() {
  try {
    return Response.json({ projects: await readProjects() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ projects: starter, warning: "Cloud data unavailable; starter list shown." }, { status: 200 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body.projects)) {
      return Response.json({ error: "projects must be an array" }, { status: 400 });
    }
    await put(PATH, JSON.stringify(body.projects, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      addRandomSuffix: false
    });
    return Response.json({ ok: true, count: body.projects.length, savedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: "Unable to save project data." }, { status: 500 });
  }
}
