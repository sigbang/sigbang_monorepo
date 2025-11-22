export const runtime = 'edge';
import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";
import { getAccessToken } from "@/lib/auth/cookies";

export async function POST(req: Request) {
  try {
    // Expect multipart/form-data from client
    const form = await req.formData();

    // Device headers passthrough (optional but recommended)
    const deviceId = req.headers.get("x-device-id") ?? "";
    const deviceName = req.headers.get("x-device-name") ?? "";

    // Optional auth
    const at = await getAccessToken();
    const headers: Record<string, string> = {
      "x-device-id": deviceId,
      "x-device-name": deviceName,
      Accept: "application/json",
    };
    if (at) headers.Authorization = `Bearer ${at}`;

    // Forward to backend
    const upstream = await fetch(`${ENV.API_BASE_URL}/feedback`, {
      method: "POST",
      headers,
      body: form,
      // Let fetch set the multipart boundary automatically
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await upstream.json().catch(() => ({})) : await upstream.text();

    return new NextResponse(isJson ? JSON.stringify(body) : body, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

