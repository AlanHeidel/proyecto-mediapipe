import { useEffect, useState } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { createFaceLandmarker } from "../lib/mediapipe/face/createFaceLandmarker";

export type FaceLandmarkerStatus = "idle" | "loading" | "ready" | "error";

export function useFaceLandmarker(enabled: boolean) {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null
  );
  const [status, setStatus] = useState<FaceLandmarkerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || faceLandmarker) {
      return;
    }

    let cancelled = false;

    const loadFaceLandmarker = async () => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const nextFaceLandmarker = await createFaceLandmarker();

        if (cancelled) {
          nextFaceLandmarker.close();
          return;
        }

        setFaceLandmarker(nextFaceLandmarker);
        setStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to initialize Face Landmarker."
        );
      }
    };

    loadFaceLandmarker();

    return () => {
      cancelled = true;
    };
  }, [enabled, faceLandmarker]);

  useEffect(() => {
    return () => {
      faceLandmarker?.close();
    };
  }, [faceLandmarker]);

  return { faceLandmarker, status, errorMessage };
}
