import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";

const registryPath = join(process.cwd(), ".eve/nuxt-dev-server.json");
const lockPath = join(process.cwd(), ".eve/nuxt-dev-server.lock");
const eveCachePath = join(process.cwd(), "node_modules/.cache/eve");

async function clearEveDevArtifacts() {
  await rm(registryPath, { force: true });
  await rm(lockPath, { force: true });
  await rm(eveCachePath, { recursive: true, force: true });
}

async function ensureMicrosandboxRuntime() {
  let microsandbox;
  try {
    microsandbox = await import("microsandbox");
  }
  catch {
    return;
  }

  if (microsandbox.isInstalled()) {
    return;
  }

  console.info("[dev] Installing microsandbox VM runtime (first run only, may take a few minutes)...");
  try {
    await microsandbox.setup().skipVerify().install();
  }
  catch (error) {
    console.warn(
      "[dev] microsandbox runtime install failed — eve dev may time out.",
      error instanceof Error ? error.message : error,
    );
  }
}

try {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const origin = typeof registry.origin === "string" ? registry.origin : null;

  if (!origin) {
    await clearEveDevArtifacts();
  }
  else {
    const response = await fetch(`${origin}/eve/v1/health`, {
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      await clearEveDevArtifacts();
    }
  }
}
catch {
  await clearEveDevArtifacts();
}

await ensureMicrosandboxRuntime();
