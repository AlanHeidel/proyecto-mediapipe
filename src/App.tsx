import { startTransition, useEffect, useRef, useState } from "react";
import {
  Grid3x3,
  Hand,
  Package,
  ScanFace,
  Video,
  VideoOff,
} from "lucide-react";
import Aurora from "./components/bg/Aurora";
import { useFaceLandmarker } from "./hooks/useFaceLandmarker";
import { useHandLandmarker } from "./hooks/useHandLandmarker";
import { useObjectDetector } from "./hooks/useObjectDetector";
import { drawFaceLandmarks } from "./lib/mediapipe/face/drawFaceLandmarks";
import {
  getVisibleBlendshapes,
  type VisibleBlendshape,
} from "./lib/mediapipe/face/getVisibleBlendshapes";
import { drawHandLandmarks } from "./lib/mediapipe/hands/drawHandLandmarks";
import { drawObjectDetections } from "./lib/mediapipe/objects/drawObjectDetections";
import {
  clearCanvas,
  resizeCanvasToVideo,
} from "./lib/mediapipe/shared/canvas";

type CameraState = "idle" | "loading" | "active" | "error";
type DetectionMode = "face" | "hands" | "objects" | "ticTacToe";

const statusDotClasses: Record<CameraState, string> = {
  idle: "bg-red-400",
  loading: "bg-amber-400 shadow-[0_0_18px_rgba(250,204,21,0.55)]",
  active: "bg-green-500 shadow-[0_0_18px_rgba(34,197,94,0.55)]",
  error: "bg-rose-600 shadow-[0_0_18px_rgba(251,113,133,0.55)]",
};

const detectionModes = [
  {
    id: "face",
    title: "Face Detection",
    description: "Track facial landmarks, contours and expressions in real time.",
    icon: ScanFace,
  },
  {
    id: "hands",
    title: "Hand Detection",
    description: "Detect hand landmarks and gestures directly from the webcam feed.",
    icon: Hand,
  },
  {
    id: "objects",
    title: "Object Recognition",
    description: "Detect common objects and draw live bounding boxes over the webcam feed.",
    icon: Package,
  },
  {
    id: "ticTacToe",
    title: "Finger Tic-Tac-Toe",
    description: "Move the index finger and pinch the thumb with the index finger to click.",
    icon: Grid3x3,
  },
] satisfies Array<{
  id: DetectionMode;
  title: string;
  description: string;
  icon: typeof ScanFace;
}>;

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastBlendshapeKeyRef = useRef("");

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [activeMode, setActiveMode] = useState<DetectionMode>("face");
  const [visibleBlendshapes, setVisibleBlendshapes] = useState<
    VisibleBlendshape[]
  >([]);

  const isFaceMode = activeMode === "face";
  const isHandsMode = activeMode === "hands";
  const isObjectsMode = activeMode === "objects";
  const currentMode =
    detectionModes.find((mode) => mode.id === activeMode) ?? detectionModes[0];

  const {
    faceLandmarker,
    status: faceLandmarkerStatus,
  } = useFaceLandmarker(isFaceMode);
  const { handLandmarker } = useHandLandmarker(isHandsMode);
  const { objectDetector } = useObjectDetector(isObjectsMode);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      clearCanvas(canvasRef.current);
    }

    lastVideoTimeRef.current = -1;
    lastBlendshapeKeyRef.current = "";
    setVisibleBlendshapes([]);
    setCameraState("idle");
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      return;
    }

    try {
      stopCamera();
      setCameraState("loading");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("active");
    } catch {
      setCameraState("error");
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas) {
      return;
    }

    if (
      !isFaceMode ||
      cameraState !== "active" ||
      !faceLandmarker ||
      !video
    ) {
      clearCanvas(canvas);
      lastVideoTimeRef.current = -1;
      lastBlendshapeKeyRef.current = "";
      setVisibleBlendshapes([]);
      return;
    }

    let animationFrameId = 0;

    const renderFrame = () => {
      const currentVideo = videoRef.current;
      const currentCanvas = canvasRef.current;

      if (!currentVideo || !currentCanvas) {
        return;
      }

      resizeCanvasToVideo(currentCanvas, currentVideo);

      if (
        currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        currentVideo.videoWidth > 0 &&
        currentVideo.currentTime !== lastVideoTimeRef.current
      ) {
        const result = faceLandmarker.detectForVideo(
          currentVideo,
          performance.now()
        );

        drawFaceLandmarks(currentCanvas, result);

        const nextBlendshapes = getVisibleBlendshapes(result, 0.5);
        const nextBlendshapeKey = nextBlendshapes
          .map(({ name }) => name)
          .join("|");

        if (nextBlendshapeKey !== lastBlendshapeKeyRef.current) {
          lastBlendshapeKeyRef.current = nextBlendshapeKey;
          startTransition(() => {
            setVisibleBlendshapes(nextBlendshapes);
          });
        }

        lastVideoTimeRef.current = currentVideo.currentTime;
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearCanvas(canvas);
      lastVideoTimeRef.current = -1;
      lastBlendshapeKeyRef.current = "";
      setVisibleBlendshapes([]);
    };
  }, [cameraState, faceLandmarker, isFaceMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas) {
      return;
    }

    if (
      !isHandsMode ||
      cameraState !== "active" ||
      !handLandmarker ||
      !video
    ) {
      clearCanvas(canvas);
      return;
    }

    let animationFrameId = 0;
    let lastVideoTime = -1;

    const renderFrame = () => {
      const currentVideo = videoRef.current;
      const currentCanvas = canvasRef.current;

      if (!currentVideo || !currentCanvas) {
        return;
      }

      resizeCanvasToVideo(currentCanvas, currentVideo);

      if (
        currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        currentVideo.videoWidth > 0 &&
        currentVideo.currentTime !== lastVideoTime
      ) {
        const result = handLandmarker.detectForVideo(
          currentVideo,
          performance.now()
        );

        drawHandLandmarks(currentCanvas, result);
        lastVideoTime = currentVideo.currentTime;
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearCanvas(canvas);
    };
  }, [cameraState, handLandmarker, isHandsMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas) {
      return;
    }

    if (
      !isObjectsMode ||
      cameraState !== "active" ||
      !objectDetector ||
      !video
    ) {
      clearCanvas(canvas);
      return;
    }

    let animationFrameId = 0;
    let lastVideoTime = -1;

    const renderFrame = () => {
      const currentVideo = videoRef.current;
      const currentCanvas = canvasRef.current;

      if (!currentVideo || !currentCanvas) {
        return;
      }

      resizeCanvasToVideo(currentCanvas, currentVideo);

      if (
        currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        currentVideo.videoWidth > 0 &&
        currentVideo.videoHeight > 0 &&
        currentVideo.currentTime !== lastVideoTime
      ) {
        const result = objectDetector.detectForVideo(
          currentVideo,
          performance.now()
        );

        drawObjectDetections(currentCanvas, result, {
          width: currentVideo.videoWidth,
          height: currentVideo.videoHeight,
        });
        lastVideoTime = currentVideo.currentTime;
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearCanvas(canvas);
    };
  }, [cameraState, isObjectsMode, objectDetector]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gray-900">
        <Aurora
          colorStops={["#FF8A1D", "#FFC857", "#c93535"]}
          amplitude={1.0}
          blend={0.8}
        />
      </div>

      <main className="relative z-10 min-h-screen">
        <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-8">
          <header className="flex w-full max-w-5xl flex-col items-center gap-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {detectionModes.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.id === activeMode;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setActiveMode(mode.id)}
                    aria-label={mode.title}
                    title={mode.title}
                    className={`flex h-15 w-15 cursor-pointer items-center justify-center rounded-[1.35rem] backdrop-blur-[20px] transition duration-300 hover:scale-[1.02] lg:h-20 lg:w-20 ${isActive
                      ? "bg-[linear-gradient(135deg,#ff8a1d,#ff6a00)] text-white shadow-[0_20px_50px_rgba(255,106,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)]"
                      : "bg-[linear-gradient(180deg,rgba(10,10,10,0.2),rgba(10,10,10,0.4))] text-[#ffa047] shadow-[0_20px_50px_rgba(3,9,20,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                      }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`h-8 w-8 lg:h-10 lg:w-10 ${isActive
                        ? "text-white drop-shadow-[0_6px_20px_rgba(255,255,255,0.18)]"
                        : "text-[#ffa047] drop-shadow-[0_6px_20px_rgba(255,174,71,0.2)]"
                        }`}
                      strokeWidth={2.25}
                    />
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <h1 className="m-0 text-[1.9rem] font-bold tracking-[0.14em] text-[#f7fbff] lg:text-[2.2rem]">
                {currentMode.title}
              </h1>
              <p className="mx-auto max-w-2xl text-[1rem] text-white/60 lg:text-[1.05rem]">
                {currentMode.description}
              </p>
            </div>
          </header>

          <div className="w-80 lg:min-w-[24rem] lg:w-1/2">
            <div className="relative aspect-9/16 overflow-hidden rounded-3xl bg-[rgba(0,0,0,0.5)] shadow-[0_24px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[50px] lg:aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 block h-full w-full object-contain transition-opacity duration-200 ${cameraState === "active" ? "opacity-100" : "opacity-0"}`}
              />

              <canvas
                ref={canvasRef}
                className={`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none absolute inset-0 aspect-video transition-opacity duration-200 ${isFaceMode &&
                  cameraState === "active" &&
                  faceLandmarkerStatus === "ready"
                  ? "opacity-100"
                  : isHandsMode &&
                    cameraState === "active" &&
                    handLandmarker
                  ? "opacity-100"
                  : isObjectsMode &&
                    cameraState === "active" &&
                    objectDetector
                  ? "opacity-100"
                  : "opacity-0"
                  }`}
              />

              {isFaceMode && visibleBlendshapes.length > 0 && (
                <div className="absolute left-3 top-3 z-10 max-w-48 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-left text-[0.72rem] text-white/90 backdrop-blur-lg sm:max-w-56 sm:text-xs">
                  <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Blendshapes
                  </div>
                  <div className="space-y-1.5">
                    {visibleBlendshapes.map((blendshape) => (
                      <div
                        key={blendshape.name}
                        className="truncate text-white/78"
                      >
                        {blendshape.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(180deg,rgba(5,10,19,0.22),rgba(5,10,19,0.72)_92%)] p-3 sm:p-4">
                <div className="mx-auto inline-flex max-w-full items-center justify-center gap-3 self-center rounded-full bg-[rgba(0,0,0,0.56)] px-1 py-1 text-sm text-white/80 backdrop-blur-lg">
                  <span
                    className={`h-2 w-2 rounded-full ${statusDotClasses[cameraState]}`}
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-col justify-center gap-3 lg:flex-row">
                  <button
                    type="button"
                    className="inline-flex w-full min-w-0 px-3 py-3 cursor-pointer items-center justify-center gap-3 rounded-full border border-transparent bg-[linear-gradient(135deg,#ff8a1d,#ff6a00)] text-[0.96rem] font-medium tracking-[0.02em] text-[#fff8f1] shadow-[0_16px_30px_rgba(255,106,0,0.24)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-40 lg:px-4 lg:py-4"
                    onClick={startCamera}
                    disabled={cameraState === "loading" || cameraState === "active"}
                  >
                    <Video aria-hidden="true" className="h-[1.2rem] w-[1.2rem]" />
                    <span>Turn on</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex w-full min-w-0 px-3 py-3 cursor-pointer items-center justify-center gap-3 rounded-full border border-white/[0.14] bg-white/6 text-[0.96rem] font-medium tracking-[0.02em] text-slate-100 backdrop-blur-[14px] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-40 lg:px-4 lg:py-4"
                    onClick={stopCamera}
                    disabled={cameraState === "idle" || cameraState === "loading"}
                  >
                    <VideoOff aria-hidden="true" className="h-[1.2rem] w-[1.2rem]" />
                    <span>Turn off</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
