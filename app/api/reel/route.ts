import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z
    .string({
      required_error: "कृपया वैध रील लिंक पेस्ट करें।"
    })
    .trim()
    .url("लिंक सही प्रारूप में नहीं है।")
});

const RAPID_API_HOST = "instagram-reels-downloader-api.p.rapidapi.com";
const API_ENDPOINT = `https://${RAPID_API_HOST}/download`;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "रिक्वेस्ट डेटा पढ़ने में समस्या हुई।" },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    const errorMessage =
      parsed.error.issues.at(0)?.message ?? "कृपया वैध रील लिंक पेस्ट करें।";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) {
    return NextResponse.json(
      {
        error:
          "सर्वर कॉन्फ़िगरेशन अधूरा है। कृपया RAPIDAPI_KEY एनवायरनमेंट वैरिएबल सेट करें।"
      },
      { status: 500 }
    );
  }

  const endpoint = new URL(API_ENDPOINT);
  endpoint.searchParams.set("url", parsed.data.url);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": RAPID_API_HOST,
        Accept: "application/json"
      },
      cache: "no-store"
    });
  } catch (error) {
    console.error("RapidAPI fetch error", error);
    return NextResponse.json(
      { error: "रील जानकारी प्राप्त नहीं हो सकी। कृपया दोबारा कोशिश करें।" },
      { status: 502 }
    );
  }

  if (!upstreamResponse.ok) {
    const text = await upstreamResponse.text();
    console.error("RapidAPI error", upstreamResponse.status, text);
    const status = upstreamResponse.status;
    const message =
      status === 404
        ? "रील नहीं मिली। लिंक जांच लें।"
        : "रील डाउनलोड लिंक लाने में समस्या हुई।";
    return NextResponse.json({ error: message }, { status: status === 404 ? 404 : 502 });
  }

  const json = (await upstreamResponse.json()) as Record<string, unknown>;
  const medias = Array.isArray(json.medias) ? (json.medias as Record<string, unknown>[]) : [];

  if (!medias.length) {
    return NextResponse.json(
      { error: "इस रील के लिए सीधा डाउनलोड लिंक उपलब्ध नहीं है।" },
      { status: 404 }
    );
  }

  const sanitizedMedias = medias
    .map((item) => {
      const url = typeof item.url === "string" ? item.url : null;
      const type = typeof item.type === "string" ? item.type : null;
      if (!url || !type) return null;
      return {
        url,
        type,
        quality: typeof item.quality === "string" ? item.quality : undefined,
        extension: typeof item.extension === "string" ? item.extension : undefined
      };
    })
    .filter(Boolean);

  if (!sanitizedMedias.length) {
    return NextResponse.json(
      { error: "डाउनलोड मीडिया सूची पढ़ने में समस्या हुई।" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    sourceUrl: typeof json.url === "string" ? json.url : parsed.data.url,
    author: typeof json.author === "string" ? json.author : undefined,
    title: typeof json.title === "string" ? json.title : undefined,
    duration: typeof json.duration === "number" ? json.duration : undefined,
    thumbnail: typeof json.thumbnail === "string" ? json.thumbnail : undefined,
    medias: sanitizedMedias
  });
}
