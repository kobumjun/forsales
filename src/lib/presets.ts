import type { Database } from "./database.types";

export type TonePreset = Database["public"]["Tables"]["tone_presets"]["Row"] & {
  examples?: { content: string }[];
};

export const DEFAULT_PRESETS: {
  name: string;
  preset_type: "system";
  examples: string[];
}[] = [
  {
    name: "기본",
    preset_type: "system",
    examples: [
      "네, 가능합니다.",
      "확인해 보겠습니다.",
      "진행하겠습니다.",
      "말씀해 주신 내용 반영해서 수정하겠습니다.",
      "이 부분은 이렇게 처리하면 됩니다.",
    ],
  },
  {
    name: "친절",
    preset_type: "system",
    examples: [
      "안녕하세요! 말씀해 주신 부분 확인해 드리겠습니다.",
      "좋은 질문이세요. 이 부분은 이렇게 진행하면 됩니다.",
      "도움이 되셨으면 좋겠습니다. 추가로 궁금한 점 있으시면 말씀해 주세요.",
      "불편을 드려 죄송합니다. 바로 확인 후 조치하겠습니다.",
      "친절하게 안내해 드리겠습니다.",
    ],
  },
  {
    name: "세일즈",
    preset_type: "system",
    examples: [
      "네, 충분히 가능합니다. 해당 기능 포함해서 진행해 드리겠습니다.",
      "추가 비용은 발생하지 않습니다. 편하게 요청 주세요.",
      "기간 여유 있으시면 이번 주 안에 반영해 드리겠습니다.",
      "현재 작업 범위 내에서 처리 가능합니다.",
      "추가 요청사항도 편하게 말씀해 주세요.",
    ],
  },
];
