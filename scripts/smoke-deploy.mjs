const apiUrl = process.env.DEPLOYED_API_URL;
const clientUrl = process.env.DEPLOYED_CLIENT_URL;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function assertApiHealth() {
  if (!apiUrl) {
    console.log("Skipping deployed API smoke test: DEPLOYED_API_URL is not set.");
    return;
  }

  const healthUrl = new URL("/health", apiUrl);
  const response = await fetchWithTimeout(healthUrl);

  if (!response.ok) {
    throw new Error(`API health failed with status ${response.status}`);
  }

  const body = await response.json();

  if (body.status !== "ok" || body.service !== "memorabilia-api") {
    throw new Error(`Unexpected API health payload: ${JSON.stringify(body)}`);
  }

  console.log(`API smoke passed: ${healthUrl}`);
}

async function assertClientLoads() {
  if (!clientUrl) {
    console.log(
      "Skipping deployed client smoke test: DEPLOYED_CLIENT_URL is not set.",
    );
    return;
  }

  const response = await fetchWithTimeout(clientUrl);
  const html = await response.text();

  if (!response.ok) {
    throw new Error(`Client smoke failed with status ${response.status}`);
  }

  if (!html.includes('<div id="root"></div>')) {
    throw new Error("Client smoke failed: Vite root element was not found.");
  }

  console.log(`Client smoke passed: ${clientUrl}`);
}

await assertApiHealth();
await assertClientLoads();
