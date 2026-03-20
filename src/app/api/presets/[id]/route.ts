import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: preset } = await supabase
    .from("tone_presets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!preset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: examples } = await supabase
    .from("tone_preset_examples")
    .select("id, content, sort_order")
    .eq("preset_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...preset, examples: examples ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    is_default?: boolean;
    examples?: string[];
  };

  const { data: preset } = await supabase
    .from("tone_presets")
    .select("id, preset_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!preset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined && preset.preset_type === "custom")
    updates.name = body.name;
  if (body.is_default !== undefined) updates.is_default = body.is_default;
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length > 1) {
    await supabase
      .from("tone_presets")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id);
  }

  if (body.is_default) {
    await supabase
      .from("tone_presets")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("id", id);
  }

  if (Array.isArray(body.examples)) {
    await supabase.from("tone_preset_examples").delete().eq("preset_id", id);
    for (let i = 0; i < Math.min(body.examples.length, 20); i++) {
      const c = body.examples[i]?.trim();
      if (c) {
        await supabase.from("tone_preset_examples").insert({
          preset_id: id,
          content: c,
          sort_order: i,
        });
      }
    }
  }

  const { data: updated } = await supabase
    .from("tone_presets")
    .select("*")
    .eq("id", id)
    .single();

  const { data: examples } = await supabase
    .from("tone_preset_examples")
    .select("id, content, sort_order")
    .eq("preset_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...updated, examples: examples ?? [] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: preset } = await supabase
    .from("tone_presets")
    .select("preset_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!preset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (preset.preset_type === "system") {
    return NextResponse.json(
      { error: "시스템 기본 프리셋은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await supabase.from("tone_preset_examples").delete().eq("preset_id", id);
  await supabase
    .from("tone_presets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
