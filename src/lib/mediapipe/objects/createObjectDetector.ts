import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";

const VISION_WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export const OBJECT_DETECTOR_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

export async function createObjectDetector() {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);

  return ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: OBJECT_DETECTOR_MODEL_ASSET_PATH,
    },
    runningMode: "VIDEO",
    displayNamesLocale: "en",
    maxResults: 5,
    scoreThreshold: 0.5,
  });
}
