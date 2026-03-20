"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Preset = {
  id: string;
  name: string;
  preset_type: string;
  is_default: boolean;
  examples?: { id: string; content: string; sort_order: number }[];
};

export function PresetsClient() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExamples, setNewExamples] = useState<string[]>([""]);
  const [editExamples, setEditExamples] = useState<Record<string, string[]>>({});
  const [editName, setEditName] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchPresets = useCallback(() => {
    fetch("/api/presets")
      .then((r) => r.json())
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleCreate = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    fetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        examples: newExamples.filter((e) => e.trim()),
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => {
        setNewName("");
        setNewExamples([""]);
        setShowNewForm(false);
        fetchPresets();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [newName, newExamples, fetchPresets]);

  const handleUpdate = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return;
      const examples = editExamples[id] ?? preset.examples?.map((e) => e.content) ?? [""];
      const filtered = examples.filter((e) => e.trim());
      const name = (editName[id] ?? preset.name).trim() || preset.name;
      setLoading(true);
      fetch(`/api/presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          examples: filtered.length > 0 ? filtered : undefined,
        }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(() => {
          setEditingId(null);
          setEditExamples((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          fetchPresets();
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [presets, editExamples, editName, fetchPresets]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("이 프리셋을 삭제할까요?")) return;
      setLoading(true);
      fetch(`/api/presets/${id}`, { method: "DELETE" })
        .then((r) => (r.ok ? fetchPresets() : Promise.reject()))
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [fetchPresets]
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      setLoading(true);
      fetch(`/api/presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      })
        .then((r) => (r.ok ? fetchPresets() : Promise.reject()))
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [fetchPresets]
  );

  const startEdit = useCallback((p: Preset) => {
    setEditingId(p.id);
    setEditName((prev) => ({ ...prev, [p.id]: p.name }));
    setEditExamples((prev) => ({
      ...prev,
      [p.id]: (p.examples?.map((e) => e.content) ?? [""]).length > 0
        ? p.examples!.map((e) => e.content)
        : [""],
    }));
  }, []);

  const addExample = useCallback(
    (presetId: string) => {
      setEditExamples((prev) => ({
        ...prev,
        [presetId]: [...(prev[presetId] ?? [""]), ""],
      }));
    },
    []
  );

  const removeExample = useCallback(
    (presetId: string, idx: number) => {
      setEditExamples((prev) => {
        const arr = [...(prev[presetId] ?? [""])];
        arr.splice(idx, 1);
        return { ...prev, [presetId]: arr.length ? arr : [""] };
      });
    },
    []
  );

  const updateExample = useCallback(
    (presetId: string, idx: number, value: string) => {
      setEditExamples((prev) => {
        const arr = [...(prev[presetId] ?? [""])];
        arr[idx] = value;
        return { ...prev, [presetId]: arr };
      });
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">말투 프리셋</h1>
        <button
          type="button"
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          새 프리셋
        </button>
      </div>

      {showNewForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-medium text-slate-900">새 프리셋 만들기</h3>
          <input
            type="text"
            placeholder="프리셋 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="mt-4">
            <p className="text-sm text-slate-600">예시 문장 (10~20개)</p>
            {newExamples.map((ex, i) => (
              <div key={i} className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder={`예시 ${i + 1}`}
                  value={ex}
                  onChange={(e) => {
                    const next = [...newExamples];
                    next[i] = e.target.value;
                    setNewExamples(next);
                  }}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewExamples((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {newExamples.length < 20 && (
              <button
                type="button"
                onClick={() => setNewExamples((prev) => [...prev, ""])}
                className="mt-2 text-sm text-brand-600 hover:underline"
              >
                + 예시 추가
              </button>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || !newName.trim()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setNewName("");
                setNewExamples([""]);
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900">{preset.name}</h3>
                {preset.is_default && (
                  <span className="rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                    기본
                  </span>
                )}
                {preset.preset_type === "system" && (
                  <span className="text-xs text-slate-500">시스템</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!preset.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(preset.id)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    기본으로 설정
                  </button>
                )}
                {preset.preset_type === "custom" ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(preset.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => startEdit(preset)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>

            {editingId === preset.id ? (
              <div className="mt-4 space-y-2">
                {preset.preset_type === "custom" && (
                  <input
                    type="text"
                    value={editName[preset.id] ?? preset.name}
                    onChange={(e) =>
                      setEditName((prev) => ({
                        ...prev,
                        [preset.id]: e.target.value,
                      }))
                    }
                    placeholder="프리셋 이름"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}
                {(editExamples[preset.id] ?? [""]).map((ex, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={ex}
                      onChange={(e) =>
                        updateExample(preset.id, i, e.target.value)
                      }
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeExample(preset.id, i)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(editExamples[preset.id]?.length ?? 0) < 20 && (
                  <button
                    type="button"
                    onClick={() => addExample(preset.id)}
                    className="text-sm text-brand-600 hover:underline"
                  >
                    + 예시 추가
                  </button>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(preset.id)}
                    disabled={loading}
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditExamples((prev) => {
                        const next = { ...prev };
                        delete next[preset.id];
                        return next;
                      });
                    }}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {preset.examples?.slice(0, 5).map((ex) => (
                  <li key={ex.id} className="truncate">
                    • {ex.content}
                  </li>
                ))}
                {(preset.examples?.length ?? 0) > 5 && (
                  <li className="text-slate-400">
                    ... 외 {(preset.examples?.length ?? 0) - 5}개
                  </li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
