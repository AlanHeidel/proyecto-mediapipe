import { useEffect, useRef, useState } from "react";
import { Camera, Video, VideoOff } from "lucide-react";
import Aurora from "./components/bg/Aurora";

type CameraState = "idle" | "loading" | "active" | "error";

const statusDotClasses: Record<CameraState, string> = {
  idle: "bg-red-400",
  loading: "bg-amber-400 shadow-[0_0_18px_rgba(250,204,21,0.55)]",
  active: "bg-green-500 shadow-[0_0_18px_rgba(34,197,94,0.55)]",
  error: "bg-rose-600 shadow-[0_0_18px_rgba(251,113,133,0.55)]",
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

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
          width: { ideal: 1280 },
          height: { ideal: 1280 },
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
          <header className="flex flex-col items-center gap-4 text-center">
            <button className="flex items-center justify-center cursor-pointer h-20 w-20 rounded-[1.35rem] bg-[linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.04))] shadow-[0_20px_50px_rgba(3,9,20,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-[18px] hover:scale-[1.02] transition duration-200">
              <Camera
                aria-hidden="true"
                className="h-10 w-10 text-[#ffa047] drop-shadow-[0_6px_20px_rgba(255,174,71,0.2)]"
                strokeWidth={2.25}
              />
            </button>
            <h1 className="m-0 text-[2rem] font-bold tracking-[0.14em] text-[#f7fbff]">
              AI Recognition
            </h1>
          </header>

          <div className="w-85 lg:min-w-[24rem] lg:w-1/2">
            <div className="relative aspect-10/16 overflow-hidden rounded-3xl bg-[rgba(0,0,0,0.5)] shadow-[0_24px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[50px] lg:aspect-16/11">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transition-opacity duration-200 ${cameraState === "active" ? "opacity-100" : "opacity-0"
                  }`}
                style={{ transform: "scaleX(-1)" }}
              />

              <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(180deg,rgba(5,10,19,0.22),rgba(5,10,19,0.72)_92%)] p-3 sm:p-4">
                <div className="mx-auto inline-flex max-w-full items-center justify-center gap-3 self-center rounded-full bg-[rgba(0,0,0,0.56)] px-1 py-1 backdrop-blur-lg">
                  <span
                    className={`h-[0.65rem] w-[0.65rem] rounded-full  ${statusDotClasses[cameraState]}`}
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-col justify-center gap-3 lg:flex-row">
                  <button
                    type="button"
                    className="cursor-pointer inline-flex w-full min-w-0 items-center justify-center gap-3 rounded-full border border-transparent bg-[linear-gradient(135deg,#ff8a1d,#ff6a00)] px-[1.15rem] py-[0.95rem] text-[0.96rem] font-medium tracking-[0.02em] text-[#fff8f1] shadow-[0_16px_30px_rgba(255,106,0,0.24)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-40"
                    onClick={startCamera}
                    disabled={cameraState === "loading" || cameraState === "active"}
                  >
                    <Video aria-hidden="true" className="h-[1.2rem] w-[1.2rem]" />
                    <span>Turn on</span>
                  </button>

                  <button
                    type="button"
                    className="cursor-pointer inline-flex w-full min-w-0 items-center justify-center gap-3 rounded-full border border-white/[0.14] bg-white/6 px-[1.15rem] py-[0.95rem] text-[0.96rem] font-medium tracking-[0.02em] text-slate-100 backdrop-blur-[14px] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-40"
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
