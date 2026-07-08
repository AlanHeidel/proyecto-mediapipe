import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const VISION_WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export const FACE_LANDMARKER_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function createFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL_ASSET_PATH,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  });
}
