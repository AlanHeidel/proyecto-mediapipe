import type { Category, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export interface VisibleBlendshape {
  name: string;
  score: number;
}

const BLENDSHAPE_LABELS: Record<string, string> = {
  browDownLeft: "Eyebrow Lowered",
  browDownRight: "Eyebrow Lowered",
  browInnerUp: "Eyebrow Raised",
  browOuterUpLeft: "Eyebrow Raised",
  browOuterUpRight: "Eyebrow Raised",
  cheekPuff: "Cheek Puff",
  cheekSquintLeft: "Cheek Squint",
  cheekSquintRight: "Cheek Squint",
  eyeBlinkLeft: "Eye Blink",
  eyeBlinkRight: "Eye Blink",
  eyeLookDownLeft: "Looking Down",
  eyeLookDownRight: "Looking Down",
  eyeLookOutLeft: "Looking Left",
  eyeLookInRight: "Looking Left",
  eyeLookInLeft: "Looking Right",
  eyeLookOutRight: "Looking Right",
  eyeLookUpLeft: "Looking Up",
  eyeLookUpRight: "Looking Up",
  eyeSquintLeft: "Eye Squint",
  eyeSquintRight: "Eye Squint",
  eyeWideLeft: "Eyes Wide",
  eyeWideRight: "Eyes Wide",
  jawForward: "Jaw Forward",
  jawLeft: "Jaw Side",
  jawRight: "Jaw Side",
  jawOpen: "Jaw Open",
  mouthClose: "Mouth Closed",
  mouthDimpleLeft: "Mouth Dimple",
  mouthDimpleRight: "Mouth Dimple",
  mouthFrownLeft: "Mouth Frown",
  mouthFrownRight: "Mouth Frown",
  mouthFunnel: "Mouth Funnel",
  mouthLeft: "Mouth Side",
  mouthLowerDownLeft: "Lower Lip Down",
  mouthLowerDownRight: "Lower Lip Down",
  mouthPressLeft: "Mouth Press",
  mouthPressRight: "Mouth Press",
  mouthPucker: "Mouth Pucker",
  mouthRight: "Mouth Side",
  mouthRollLower: "Lower Lip Roll",
  mouthRollUpper: "Upper Lip Roll",
  mouthShrugLower: "Lower Lip Shrug",
  mouthShrugUpper: "Upper Lip Shrug",
  mouthSmileLeft: "Mouth Smile",
  mouthSmileRight: "Mouth Smile",
  mouthStretchLeft: "Mouth Stretch",
  mouthStretchRight: "Mouth Stretch",
  mouthUpperUpLeft: "Upper Lip Up",
  mouthUpperUpRight: "Upper Lip Up",
  noseSneerLeft: "Nose Sneer",
  noseSneerRight: "Nose Sneer",
};

export function getVisibleBlendshapes(
  result: FaceLandmarkerResult,
  threshold = 0.5
) {
  const firstFaceBlendshapes = result.faceBlendshapes[0];

  if (!firstFaceBlendshapes) {
    return [];
  }

  const groupedBlendshapes = new Map<string, number>();

  firstFaceBlendshapes.categories.forEach((category) => {
    if (category.score <= threshold) {
      return;
    }

    const label = resolveBlendshapeLabel(category);

    if (
      !label ||
      label.includes("Upper Lip") ||
      label.includes("Lower Lip")
    ) {
      return;
    }

    const currentScore = groupedBlendshapes.get(label) ?? 0;

    if (category.score > currentScore) {
      groupedBlendshapes.set(label, category.score);
    }
  });

  return Array.from(groupedBlendshapes.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([name, score]) => ({ name, score }));
}

function resolveBlendshapeLabel(category: Category) {
  const rawName = category.categoryName || category.displayName;

  if (BLENDSHAPE_LABELS[rawName]) {
    return BLENDSHAPE_LABELS[rawName];
  }

  const formattedLabel = formatBlendshapeName(
    rawName
      .replace(/Left|Right/g, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
  );

  return formattedLabel;
}

function formatBlendshapeName(name: string) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
