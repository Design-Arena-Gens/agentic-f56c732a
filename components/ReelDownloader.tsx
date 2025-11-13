"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

type ReelMedia = {
  url: string;
  quality?: string;
  type: string;
  extension?: string;
};

type ReelResponse = {
  author?: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  sourceUrl: string;
  medias: ReelMedia[];
};

type FetchState = "idle" | "loading" | "error" | "success";

const EXAMPLE_LINK = "https://www.instagram.com/reel/DCxTlFwSJ_Y/";

function formatDuration(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return null;
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs} सेकेंड`;
  return `${mins} मिनट ${secs.toString().padStart(2, "0")} सेकेंड`;
}

function getBestMedia(medias: ReelMedia[]) {
  const sorted = [...medias].sort((a, b) => {
    const getScore = (quality?: string) => {
      if (!quality) return 0;
      const match = quality.match(/(\d+)[pP]/);
      return match ? parseInt(match[1], 10) : 0;
    };
    return getScore(b.quality) - getScore(a.quality);
  });
  return sorted.find((media) => media.type === "video") ?? sorted[0];
}

export default function ReelDownloader() {
  const [reelUrl, setReelUrl] = useState("");
  const [state, setState] = useState<FetchState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<ReelResponse | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setState("loading");
      setMessage(null);
      setData(null);

      try {
        const response = await fetch("/api/reel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: reelUrl.trim() })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const reason =
            typeof payload?.error === "string"
              ? payload.error
              : "डाउनलोड लिंक प्राप्त करने में समस्या हुई।";
          throw new Error(reason);
        }

        const payload: ReelResponse = await response.json();
        setData(payload);
        setState("success");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "अज्ञात त्रुटि हुई।");
      }
    },
    [reelUrl]
  );

  const recommendedMedia = useMemo(() => {
    if (!data?.medias?.length) return null;
    return getBestMedia(data.medias);
  }, [data]);

  return (
    <div className="downloader">
      <form className="downloader__form" onSubmit={handleSubmit}>
        <label htmlFor="reel-url" className="downloader__label">
          रील लिंक पेस्ट करें
        </label>
        <div className="downloader__inputShell">
          <input
            id="reel-url"
            name="reel-url"
            placeholder={EXAMPLE_LINK}
            value={reelUrl}
            onChange={(event) => setReelUrl(event.target.value)}
            className="downloader__input"
            required
            minLength={10}
          />
          <button
            type="submit"
            className="downloader__submit"
            disabled={state === "loading"}
            aria-label="डाउनलोड लिंक प्राप्त करें"
          >
            {state === "loading" ? "प्रोसेस हो रहा है..." : "डाउनलोड लिंक लाएँ"}
          </button>
        </div>
        <p className="downloader__hint">
          टिप: किसी भी रील के शेयर लिंक को कॉपी करें और यहां पेस्ट करें। उदाहरण:{" "}
          <button
            type="button"
            className="downloader__example"
            onClick={() => setReelUrl(EXAMPLE_LINK)}
          >
            {EXAMPLE_LINK}
          </button>
        </p>
      </form>

      {state === "error" && message ? (
        <div className="downloader__status downloader__status--error">{message}</div>
      ) : null}

      {state === "success" && data ? (
        <article className="result">
          <div className="result__media">
            {recommendedMedia?.type === "video" ? (
              <video
                className="result__video"
                controls
                preload="metadata"
                poster={data.thumbnail}
                src={recommendedMedia.url}
              >
                आपका ब्राउज़र वीडियो टैग सपोर्ट नहीं करता।
              </video>
            ) : data.thumbnail ? (
              <Image
                src={data.thumbnail}
                alt={data.title ?? "Reel"}
                width={540}
                height={960}
                className="result__thumbnail"
              />
            ) : null}
          </div>

          <div className="result__meta">
            <h2>{data.title ?? "Instagram Reel"}</h2>
            <dl>
              {data.author ? (
                <>
                  <dt>क्रिएटर</dt>
                  <dd>{data.author}</dd>
                </>
              ) : null}
              {data.duration ? (
                <>
                  <dt>वीडियो लंबाई</dt>
                  <dd>{formatDuration(data.duration)}</dd>
                </>
              ) : null}
              {recommendedMedia?.quality ? (
                <>
                  <dt>गुणवत्ता</dt>
                  <dd>{recommendedMedia.quality}</dd>
                </>
              ) : null}
            </dl>

            <div className="result__actions">
              <a
                className="result__download"
                href={recommendedMedia?.url ?? data.sourceUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
                अब डाउनलोड करें
              </a>
              <a
                className="result__source"
                href={data.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                मूल रील खोलें
              </a>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
