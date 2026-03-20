import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일을 업로드해 주세요." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/png";

    const ocrApiUrl = process.env.OCR_API_URL;
    const ocrApiKey = process.env.OCR_API_KEY;

    if (!ocrApiUrl || !ocrApiKey) {
      return NextResponse.json(
        { error: "OCR API가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    let rawText = "";

    if (ocrApiUrl.includes("vision.googleapis.com")) {
      rawText = await googleVisionOcr(base64, mimeType, ocrApiKey);
    } else {
      rawText = await genericOcr(base64, mimeType, ocrApiUrl, ocrApiKey);
    }

    const cleaned = cleanOcrText(rawText);
    const { coreText, keywords } = extractCoreAndKeywords(cleaned);

    return NextResponse.json({
      raw: cleaned,
      coreText: coreText || cleaned.slice(0, 200),
      keywords,
    });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: "OCR 처리 중 오류가 발생했습니다. 이미지를 다시 업로드해 주세요." },
      { status: 500 }
    );
  }
}

async function googleVisionOcr(
  base64: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Vision API error: ${err}`);
  }

  const data = (await res.json()) as {
    responses?: { fullTextAnnotation?: { text?: string } }[];
  };
  const text = data?.responses?.[0]?.fullTextAnnotation?.text ?? "";
  return text;
}

async function genericOcr(
  base64: string,
  mimeType: string,
  apiUrl: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      image: base64,
      mime_type: mimeType,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OCR API error: ${err}`);
  }

  const data = (await res.json()) as { text?: string; result?: string };
  return data.text ?? data.result ?? "";
}

function cleanOcrText(raw: string): string {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(답장|보내기|더보기|좋아요|공유|저장|복사)$/i.test(line))
    .filter((line) => !/^[\d\s:.-]+$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractCoreAndKeywords(
  text: string
): { coreText: string; keywords: string[] } {
  const lines = text.split("\n").filter((l) => l.length > 5);
  const coreText = lines[lines.length - 1] || lines[0] || text.slice(0, 200);
  const keywordCandidates = [
    ...(coreText.match(/[가-힣]{2,8}/g) || []),
    ...(coreText.match(/[a-zA-Z]{3,}/g) || []),
  ];
  const seen = new Set<string>();
  const keywords = keywordCandidates
    .filter((w) => !seen.has(w) && (seen.add(w), true))
    .slice(0, 6);
  return { coreText, keywords };
}
