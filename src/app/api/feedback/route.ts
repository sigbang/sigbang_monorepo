import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { category, subject, description, name, email, userAgent, path } = body || {};

    if (!subject || !description) {
      return NextResponse.json({ error: "Missing subject or description" }, { status: 400 });
    }

    const webhook = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhook) {
      // Forward to webhook (e.g., Slack, Discord, or internal endpoint)
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "feedback",
            category,
            subject,
            description,
            name,
            email,
            userAgent,
            path,
            ts: new Date().toISOString(),
          }),
        });
      } catch (e) {
        // Ignore webhook errors; client will fallback to mailto if needed
      }
      return NextResponse.json({ ok: true });
    }

    // If no webhook configured, accept but indicate noop
    return NextResponse.json({ ok: true, forwarded: false });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


