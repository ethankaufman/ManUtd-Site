"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Kick } from "@/lib/kicks";
import type { createKickScene } from "./scene";
import { T_CONTACT } from "./motion";

type KickScene = ReturnType<typeof createKickScene>;

const SECONDS = 6; // length of the clip at normal speed
const SPEEDS = [
  { label: "1×", value: 1 },
  { label: "½×", value: 0.5 },
  { label: "¼×", value: 0.25 },
];

/**
 * The interactive 3D view of one goal. It starts paused at the moment of contact. Press play to watch the
 * whole goal, drag the slider to scrub, and drag the picture to look around. The 3D library loads only when this opens.
 */
export default function KickViewer({ kick }: { kick: Kick }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<KickScene | null>(null);
  const timeRef = useRef(T_CONTACT);
  const playingRef = useRef(false);
  const speedRef = useRef(1);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState(T_CONTACT);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const show = useCallback((t: number) => {
    timeRef.current = t;
    setTime(t);
    sceneRef.current?.setTime(t);
  }, []);

  // load the 3D scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    let disposed = false;
    let raf = 0;
    let last = 0;
    let observer: ResizeObserver | null = null;


    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      sceneRef.current?.tick();
      if (!playingRef.current) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const t = Math.min(1, timeRef.current + (dt / SECONDS) * speedRef.current);
      timeRef.current = t;
      setTime(t);
      sceneRef.current?.setTime(t);
      if (t >= 1) {
        playingRef.current = false;
        setPlaying(false);
      }
    };

    import("./scene")
      .then(({ createKickScene }) => {
        if (disposed) return;
        const scene = createKickScene(canvas);
        sceneRef.current = scene;
        const resize = () => {
          const r = box.getBoundingClientRect();
          if (r.width && r.height) scene.resize(Math.round(r.width), Math.round(r.height), Math.min(window.devicePixelRatio || 1, 2));
        };
        observer = new ResizeObserver(resize);
        observer.observe(box);
        scene.setKick(kick);
        scene.setTime(T_CONTACT);
        resize();
        setReady(true);
        raf = requestAnimationFrame(loop);
      })
      .catch((err) => {
        console.warn("The 3D view could not start:", err);
        if (!disposed) window.setTimeout(() => setFailed(true), 0);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // the scene is created once; switching goals is handled by the next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // switch goal
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    playingRef.current = false;
    window.setTimeout(() => {
      setPlaying(false);
      scene.setKick(kick);
      show(T_CONTACT);
    }, 0);
  }, [kick, ready, show]);

  function toggle() {
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    if (timeRef.current >= 0.999) show(0);
    playingRef.current = true;
    setPlaying(true);
  }

  function replay() {
    show(0);
    playingRef.current = true;
    setPlaying(true);
  }

  return (
    <div>
      <div ref={boxRef} className="relative h-[min(68vh,34rem)] min-h-[20rem] w-full overflow-hidden border border-white/15 bg-black">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing" aria-label={`3D reconstruction of ${kick.title}. Drag to look around.`} role="img" />

        {!ready ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black font-display text-2xl uppercase tracking-wide text-united-red">
            {failed ? "Your browser could not show the 3D view" : "Setting up the pitch…"}
          </div>
        ) : null}

        <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-widest text-white/50">Drag to look around · scroll to zoom</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border border-white/15 bg-[#0c0c0c] px-3 py-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="w-24 border border-united-red bg-united-red px-3 py-2 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-white hover:text-united-red disabled:opacity-40"
        >
          {playing ? "Pause" : time >= 0.999 ? "Again" : "Play"}
        </button>
        <button
          type="button"
          onClick={replay}
          disabled={!ready}
          className="border border-white/30 px-3 py-2 font-mono text-xs uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black disabled:opacity-40"
        >
          Replay
        </button>
        <label className="flex min-w-[10rem] flex-1 items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-white/55">
          <span className="sr-only">Timeline</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={time}
            disabled={!ready}
            aria-label="Timeline"
            onChange={(e) => {
              playingRef.current = false;
              setPlaying(false);
              show(parseFloat(e.target.value));
            }}
            className="h-1 w-full cursor-pointer accent-[#DA291C]"
          />
        </label>
        <div className="flex gap-1" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={speed === s.value}
              onClick={() => {
                speedRef.current = s.value;
                setSpeed(s.value);
              }}
              className={`border px-2.5 py-2 font-mono text-xs transition ${speed === s.value ? "border-white bg-white text-black" : "border-white/30 text-white/75 hover:border-white"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => sceneRef.current?.resetView()}
          disabled={!ready}
          className="border border-white/30 px-3 py-2 font-mono text-xs uppercase tracking-widest text-white/75 transition hover:border-white hover:text-white disabled:opacity-40"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
