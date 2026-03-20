import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PRESETS } from "@/lib/presets";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name: string;
    examples?: string[];
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "프리셋 이름을 입력해 주세요." },
      { status: 400 }
    );
  }

  const { data: preset } = await supabase
    .from("tone_presets")
    .insert({
      user_id: user.id,
      name,
      preset_type: "custom",
      is_default: false,
    })
    .select()
    .single();

  if (!preset) {
    return NextResponse.json(
      { error: "프리셋 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  const examples = Array.isArray(body.examples)
    ? body.examples.filter((e) => typeof e === "string" && e.trim()).slice(0, 20)
    : [];

  for (let i = 0; i < examples.length; i++) {
    await supabase.from("tone_preset_examples").insert({
      preset_id: preset.id,
      content: examples[i].trim(),
      sort_order: i,
    });
  }

  const { data: exList } = await supabase
    .from("tone_preset_examples")
    .select("id, content, sort_order")
    .eq("preset_id", preset.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...preset, examples: exList ?? [] });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: presets } = await supabase
    .from("tone_presets")
    .select(
      `
      id,
      name,
      preset_type,
      is_default,
      created_at,
      updated_at
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!presets || presets.length === 0) {
    const inserted = await seedDefaultPresets(supabase, user.id);
    return NextResponse.json(inserted);
  }

  const withExamples = await Promise.all(
    (presets ?? []).map(async (p) => {
      const { data: examples } = await supabase
        .from("tone_preset_examples")
        .select("id, content, sort_order")
        .eq("preset_id", p.id)
        .order("sort_order", { ascending: true });
      return { ...p, examples: examples ?? [] };
    })
  );

  return NextResponse.json(withExamples);
}

async function seedDefaultPresets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const result: Array<{
    id: string;
    name: string;
    preset_type: string;
    is_default: boolean;
    examples: { id: string; content: string; sort_order: number }[];
  }> = [];

  for (let i = 0; i < DEFAULT_PRESETS.length; i++) {
    const dp = DEFAULT_PRESETS[i];
    const { data: preset } = await supabase
      .from("tone_presets")
      .insert({
        user_id: userId,
        name: dp.name,
        preset_type: dp.preset_type,
        is_default: i === 0,
      })
      .select()
      .single();

    if (!preset) continue;

    const examples: { id: string; content: string; sort_order: number }[] = [];
    for (let j = 0; j < dp.examples.length; j++) {
      const { data: ex } = await supabase
        .from("tone_preset_examples")
        .insert({
          preset_id: preset.id,
          content: dp.examples[j],
          sort_order: j,
        })
        .select()
        .single();
      if (ex) examples.push(ex);
    }

    result.push({
      ...preset,
      examples,
    });
  }

  return result;
}
