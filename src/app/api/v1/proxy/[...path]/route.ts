import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = `/api/v1/${path.join("/")}`;
  const url = `${BACKEND_URL}${targetPath}`;

  const headers = new Headers();
  // Forward auth header
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  }
  // Forward cookies for JWT
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    // For multipart/form-data, pass the body stream directly
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      headers.set("content-type", contentType);
      init.body = await req.arrayBuffer();
    } else {
      headers.set("content-type", contentType);
      init.body = await req.text();
    }
  }

  try {
    const response = await fetch(url, init);
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
