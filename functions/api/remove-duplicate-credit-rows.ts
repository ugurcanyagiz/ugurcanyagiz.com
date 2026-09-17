interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const requiredEnvironment = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const missingEnvironment = requiredEnvironment.filter((name) => !env[name]);

  if (missingEnvironment.length > 0) {
    return jsonResponse(
      {
        error: `Missing environment variable(s): ${missingEnvironment.join(", ")}`,
      },
      500,
    );
  }

  const supabaseUrl = String(env.SUPABASE_URL).replace(/\/$/, "");
  const serviceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY);

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/remove_duplicate_credit_rows`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const payload = await safeJson(response);

  if (!response.ok) {
    return jsonResponse(
      {
        error: payload?.message || payload?.error || "Supabase Duplicate Remove işlemi başarısız oldu.",
      },
      response.status,
    );
  }

  return jsonResponse({ deletedCount: Number(payload ?? 0) });
};

export const onRequest: PagesFunction<Env> = async () =>
  jsonResponse({ error: "Method not allowed" }, 405);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      Allow: "POST",
    },
  });
}

async function safeJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
