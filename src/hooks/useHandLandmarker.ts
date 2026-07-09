import { useEffect, useState } from "react";
import { HandLandmarker } from "@mediapipe/tasks-vision";
import { createHandLandmarker } from "../lib/mediapipe/hands/createHandLandmarker";

export type HandLandmarkerStatus = "idle" | "loading" | "ready" | "error";

export function useHandLandmarker(enabled: boolean) {
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
    null
  );
  const [status, setStatus] = useState<HandLandmarkerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || handLandmarker) {
      return;
    }

    let cancelled = false;

    const loadHandLandmarker = async () => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const nextHandLandmarker = await createHandLandmarker();

        if (cancelled) {
          nextHandLandmarker.close();
          return;
        }

        setHandLandmarker(nextHandLandmarker);
        setStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to initialize Hand Landmarker."
        );
      }
    };

    loadHandLandmarker();

    return () => {
      cancelled = true;
    };
  }, [enabled, handLandmarker]);

  useEffect(() => {
    return () => {
      handLandmarker?.close();
    };
  }, [handLandmarker]);

  return { handLandmarker, status, errorMessage };
}
