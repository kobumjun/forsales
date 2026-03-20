import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  ocrText: string;
  coreText: string;
  keywords: string[];
  presetId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    const { ocrText, coreText, keywords, presetId } = body;

    if (!ocrText && !coreText) {
      return NextResponse.json(
        { error: "텍스트가 없습니다." },
        { status: 400 }
      );
    }

    let examples: string[] = [];
    if (presetId) {
      const { data: examplesData } = await supabase
        .from("tone_preset_examples")
        .select("content")
        .eq("preset_id", presetId)
        .order("sort_order", { ascending: true });
      examples = (examplesData ?? []).map((e) => e.content);
    }

    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL_NAME ?? "gpt-4o-mini";

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: "AI API가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(examples);
    const userPrompt = buildUserPrompt(ocrText, coreText, keywords);

    const aiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI API error: ${err}`);
    }

    const aiData = (await aiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content =
      aiData?.choices?.[0]?.message?.content ?? "답변 생성에 실패했습니다.";

    const parsed = parseAiResponse(content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI error:", err);
    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(examples: string[]): string {
  const exampleBlock =
    examples.length > 0
      ? `\n다음 예시 문장들의 말투와 톤을 참고해서 작성해 주세요:\n${examples.map((e) => `- ${e}`).join("\n")}\n`
      : "";

  return `당신은 외주 개발자·프리랜서·세일즈맨이 고객에게 답변할 때 참고할 답변을 추천하는 전문가입니다.
고객 문의 스크린샷에서 추출한 내용을 바탕으로, 바로 복사해서 쓸 수 있는 실전 답변 3가지를 생성해 주세요.

규칙:
- 한국어 존댓말 사용
- 짧고 자연스럽게
- AI 티 나지 않게
- 외주 고객응대에 적합하게
- 각 답변은 1~3문장으로
- 이모지 사용하지 마세요${exampleBlock}

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만 출력하세요.
{"summary":"핵심 요약 1~2줄","keywords":["키워드1","키워드2"],"replies":{"short":"짧은 답변","explanatory":"설명형 답변","kind":"친절한 답변"}}`;
}

function buildUserPrompt(
  ocrText: string,
  coreText: string,
  keywords: string[]
): string {
  return `[OCR 전체 텍스트]
${ocrText}

[핵심 문장]
${coreText}

[추출 키워드]
${keywords.join(", ")}

위 내용을 바탕으로 summary, keywords, replies(short, explanatory, kind)를 JSON으로 생성해 주세요.`;
}

function parseAiResponse(content: string): {
  summary: string;
  keywords: string[];
  replies: { short: string; explanatory: string; kind: string };
} {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      summary: "요약을 생성할 수 없습니다.",
      keywords: [],
      replies: {
        short: content.trim().slice(0, 100),
        explanatory: content.trim(),
        kind: content.trim(),
      },
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      keywords?: string[];
      replies?: { short?: string; explanatory?: string; kind?: string };
    };
    return {
      summary: parsed.summary ?? "요약 없음",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      replies: {
        short: parsed.replies?.short ?? "",
        explanatory: parsed.replies?.explanatory ?? "",
        kind: parsed.replies?.kind ?? "",
      },
    };
  } catch {
    return {
      summary: "요약을 생성할 수 없습니다.",
      keywords: [],
      replies: {
        short: content.trim().slice(0, 100),
        explanatory: content.trim(),
        kind: content.trim(),
      },
    };
  }
}
