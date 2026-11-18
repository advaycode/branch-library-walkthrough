import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  BANDS,
  BUILDING_COPY,
  CLIPS,
  EXTERIOR,
  FLOORS,
  LOGO,
  ROOMS,
  SIGN,
  WHERE_TO,
  type FloorId,
  type Pic,
  type Pt,
  type RoomId,
} from "./data";

type Scene = { kind: "building" } | { kind: "floor"; floor: FloorId } | { kind: "room"; room: RoomId };

const BUILDING: Scene = { kind: "building" };
const floorScene = (floor: FloorId): Scene => ({ kind: "floor", floor });
const roomScene = (room: RoomId): Scene => ({ kind: "room", room });

const keyOf = (s: Scene) =>
  s.kind === "building" ? "exterior" : s.kind === "floor" ? `floor${s.floor}` : s.room;
const floorOf = (s: Scene): FloorId | 0 =>
  s.kind === "building" ? 0 : s.kind === "floor" ? s.floor : ROOMS[s.room].floor;
const picOf = (s: Scene): Pic =>
  s.kind === "building" ? EXTERIOR : s.kind === "floor" ? FLOORS[s.floor].pic : ROOMS[s.room].pic;
const nameOf = (s: Scene) =>
  s.kind === "building"
    ? "Building"
    : s.kind === "floor"
      ? FLOORS[s.floor].name
      : ROOMS[s.room].title;

const arStyle = (p: Pic) => ({ "--ar": String(p.w / p.h) }) as CSSProperties;
const pts = (shape: Pt[]) => shape.map(([x, y]) => `${x},${y}`).join(" ");
const clipPath = (shape: Pt[]) => `polygon(${shape.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const frames = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

// Scenes passed through on the way from a to b (excluding a).
function chain(a: Scene, b: Scene): Scene[] {
  if (keyOf(a) === keyOf(b)) return [];
  if (a.kind === "room" && b.kind === "room" && floorOf(a) === floorOf(b)) return [b];
  const out: Scene[] = [];
  let cur = a;
  if (a.kind === "room") {
    cur = floorScene(ROOMS[a.room].floor);
    out.push(cur);
  }
  if (b.kind === "building") {
    if (cur.kind !== "building") out.push(b);
    return out;
  }
  const fb = floorOf(b) as FloorId;
  if (cur.kind === "building" || (cur.kind === "floor" && cur.floor !== fb)) {
    cur = floorScene(fb);
    out.push(cur);
  }
  if (b.kind === "room") out.push(b);
  return out;
}

// Which clip joins two neighbouring scenes, and whether it plays backwards.
function clipFor(a: Scene, b: Scene): { key: string; reverse: boolean } | null {
  const pair = (x: Scene, y: Scene) => `${keyOf(x)}-${keyOf(y)}`;
  if (a.kind === "building" && b.kind === "floor") return { key: pair(a, b), reverse: false };
  if (a.kind === "floor" && b.kind === "building") return { key: pair(b, a), reverse: true };
  if (a.kind === "floor" && b.kind === "room") return { key: pair(a, b), reverse: false };
  if (a.kind === "room" && b.kind === "floor") return { key: pair(b, a), reverse: true };
  return null;
}

function firstFrame(v: HTMLVideoElement) {
  return new Promise<void>((resolve) => {
    const rv = v as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (rv.requestVideoFrameCallback) rv.requestVideoFrameCallback(() => resolve());
    else v.addEventListener("playing", () => setTimeout(resolve, 60), { once: true });
  });
}

export function Walkthrough() {
  const [scene, setScene] = useState<Scene>(BUILDING);
  const sceneRef = useRef<Scene>(BUILDING);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [uiOn, setUiOn] = useState(true);
  const [hot, setHot] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const signOpener = useRef<HTMLElement | null>(null);
  const signClose = useRef<HTMLButtonElement>(null);
  const [pulse, setPulse] = useState<{ id: string; n: number } | null>(null);
  const [announce, setAnnounce] = useState("");

  const reduced = useRef(false);
  const blobs = useRef<Record<string, string>>({});
  const baseRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const fromStage = useRef<HTMLDivElement>(null);
  const fromImg = useRef<HTMLImageElement>(null);
  const vStage = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const whereBtn = useRef<HTMLButtonElement>(null);

  // Preload every still and clip before the first click.
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pics = [EXTERIOR, FLOORS[1].pic, FLOORS[2].pic, ...Object.values(ROOMS).map((r) => r.pic)];
    const stills = pics.map(
      (p) =>
        new Promise<void>((res) => {
          const img = new Image();
          img.src = p.src;
          img.decode().then(() => res(), () => res());
        }),
    );
    const files = Object.values(CLIPS).flatMap((c) => (c ? [c.fwd, c.rev] : []));
    const clips = files.map((url) =>
      fetch(url)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(url))))
        .then((b) => {
          blobs.current[url] = URL.createObjectURL(b);
        })
        .catch(() => undefined),
    );
    Promise.all([...stills, ...clips]).then(() => setReady(true));
  }, []);

  const showFrom = (p: Pic) => {
    const layer = fromRef.current!;
    fromStage.current!.style.setProperty("--ar", String(p.w / p.h));
    fromImg.current!.src = p.src;
    layer.getAnimations().forEach((a) => a.cancel());
    layer.style.opacity = "1";
    layer.style.transform = "none";
    layer.style.visibility = "visible";
  };
  const hideFrom = () => {
    const layer = fromRef.current!;
    layer.style.visibility = "hidden";
    layer.style.opacity = "1";
    layer.style.transform = "none";
  };

  const crossfade = async (ms: number) => {
    await fromRef.current!.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: ms,
      easing: "ease",
      fill: "forwards",
    }).finished;
    hideFrom();
  };

  const playClip = async (url: string, startPic: Pic) => {
    const v = videoRef.current!;
    vStage.current!.style.setProperty("--ar", String(startPic.w / startPic.h));
    v.style.opacity = "0";
    v.src = url;
    v.defaultPlaybackRate = 2.2;
    v.playbackRate = 2.2;
    const painted = firstFrame(v);
    const ended = new Promise<void>((res) => v.addEventListener("ended", () => res(), { once: true }));
    await v.play();
    v.playbackRate = 2.2;
    await painted;
    v.style.opacity = "1";
    hideFrom(); // destination still now sits under the video
    const limit = (Number.isFinite(v.duration) ? v.duration / 2.2 : 3) * 1000 + 1500;
    await Promise.race([ended, wait(limit)]);
    await v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }).finished;
    v.getAnimations().forEach((a) => a.cancel());
    v.style.opacity = "0";
    v.pause();
  };

  const hop = async (a: Scene, b: Scene) => {
    showFrom(picOf(a)); // freeze the current picture on top
    sceneRef.current = b;
    setScene(b); // destination still renders underneath
    await frames();

    if (a.kind === "room" && b.kind === "room") return crossfade(250);

    if (a.kind === "floor" && b.kind === "floor") {
      if (reduced.current) return crossfade(300);
      const up = b.floor > a.floor; // going up: new floor arrives from above
      const opts = { duration: 600, easing: "cubic-bezier(.65,0,.35,1)" };
      const base = baseRef.current!;
      await Promise.all([
        base.animate(
          [{ transform: `translateY(${up ? -100 : 100}%)` }, { transform: "translateY(0)" }],
          opts,
        ).finished,
        fromRef.current!.animate(
          [{ transform: "translateY(0)" }, { transform: `translateY(${up ? 100 : -100}%)` }],
          { ...opts, fill: "forwards" },
        ).finished,
      ]);
      return hideFrom();
    }

    const c = clipFor(a, b);
    const files = c ? CLIPS[c.key] : undefined;
    const url = files ? blobs.current[c!.reverse ? files.rev : files.fwd] : undefined;
    if (!url || reduced.current) return crossfade(300);
    try {
      await playClip(url, picOf(a));
    } catch {
      await crossfade(300);
    }
  };

  const go = useCallback(
    async (target: Scene, spot?: string) => {
      if (busyRef.current) return;
      setMenuOpen(false);
      setSignOpen(false);
      const path = chain(sceneRef.current, target);
      if (path.length) {
        busyRef.current = true;
        setBusy(true);
        setHot(null);
        setFocusId(null);
        setUiOn(false);
        await wait(150);
        let cur = sceneRef.current;
        for (const next of path) {
          await hop(cur, next);
          cur = next;
        }
        setUiOn(true);
        busyRef.current = false;
        setBusy(false);
        setAnnounce(`${nameOf(target)}. ${target.kind === "room" ? ROOMS[target.room].fact : ""}`);
      }
      if (spot) setPulse((p) => ({ id: spot, n: (p?.n ?? 0) + 1 }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const back = useCallback(() => {
    const s = sceneRef.current;
    if (s.kind === "room") void go(floorScene(ROOMS[s.room].floor));
    else if (s.kind === "floor") void go(BUILDING);
  }, [go]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const s = sceneRef.current;
      if (s.kind === "building") return;
      const f = s.kind === "floor" ? s.floor : ROOMS[s.room].floor;
      const list = FLOORS[f].rooms;
      if (s.kind === "floor") return void go(roomScene(dir === 1 ? list[0] : list[list.length - 1]));
      const i = list.indexOf(s.room);
      void go(roomScene(list[(i + dir + list.length) % list.length]));
    },
    [go],
  );

  // Keyboard: Esc/Backspace back, 1/2 floors, arrows step rooms.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (signOpen) {
        if (e.key === "Escape" || e.key === "Backspace") {
          e.preventDefault();
          closeSign();
        }
        return;
      }
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        whereBtn.current?.focus();
        return;
      }
      if (!ready) return;
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        back();
      } else if (e.key === "1" || e.key === "2") {
        void go(floorScene(Number(e.key) as FloorId));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back, go, step, menuOpen, ready, signOpen]);

  useEffect(() => {
    if (menuOpen) menuRef.current?.querySelector("button")?.focus();
  }, [menuOpen]);

  useEffect(() => {
    if (signOpen) signClose.current?.focus();
  }, [signOpen]);

  const openSign = (e: React.MouseEvent<HTMLElement>) => {
    if (busyRef.current) return;
    signOpener.current = e.currentTarget;
    setMenuOpen(false);
    setSignOpen(true);
  };
  function closeSign() {
    setSignOpen(false);
    signOpener.current?.focus();
  }
  const pickSign = (i: number) => {
    const t = SIGN.entries[i].to;
    setSignOpen(false);
    if ("room" in t) void go(roomScene(t.room));
    else void go(floorScene(t.floor), t.spot);
  };

  const pic = picOf(scene);
  const curFloor = floorOf(scene);
  const live = ready && !busy;
  const uiCls = `bw-fade${uiOn && ready ? "" : " is-off"}`;
  const hoverProps = (id: string) => ({
    onMouseEnter: () => setHot(id),
    onMouseLeave: () => setHot((h) => (h === id ? null : h)),
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      setHot(id);
      if (e.currentTarget.matches(":focus-visible")) setFocusId(id);
    },
    onBlur: () => {
      setHot((h) => (h === id ? null : h));
      setFocusId((f) => (f === id ? null : f));
    },
  });

  const pickWhere = (i: number) => {
    const w = WHERE_TO[i];
    if ("room" in w) return void go(roomScene(w.room));
    const s = sceneRef.current;
    const f: FloorId = s.kind === "building" ? 1 : (floorOf(s) as FloorId);
    void go(floorScene(f), w.spot);
  };

  return (
    <div className="bw" aria-busy={!live}>
      <p className="bw-sr" aria-live="polite">
        {announce}
      </p>

      {/* Current scene (also the destination still while a move plays) */}
      <div className="bw-layer bw-base" ref={baseRef}>
        <div className="bw-stage" style={arStyle(pic)}>
          <img className="bw-pic" src={pic.src} alt="" draggable={false} />

          {scene.kind === "building" && (
            <div className={uiCls}>
              {/* Branch logo on the blue panel beside the doors (site overlay, not in the picture) */}
              <div className="bw-sign" aria-hidden="true">
                <img src="walk/img/logo-mark.png" alt="" draggable={false} />
              </div>
              <svg className="bw-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {BANDS.map((b) => {
                  const id = `band${b.floor}`;
                  const [x, y, w, h] = b.rect;
                  return (
                    <rect
                      key={id}
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      className={`bw-poly${hot === id ? " is-on" : ""}${focusId === id ? " is-focus" : ""}`}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
              {BANDS.map((b) => {
                const id = `band${b.floor}`;
                const [x, y, w, h] = b.rect;
                return (
                  <button
                    key={id}
                    type="button"
                    className="bw-hit"
                    style={{ clipPath: clipPath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]) }}
                    aria-label={`Floor ${b.floor}: ${b.title}. ${b.body}`}
                    disabled={!live}
                    onClick={() => void go(floorScene(b.floor))}
                    {...hoverProps(id)}
                  />
                );
              })}
              {BANDS.map((b) => {
                const id = `band${b.floor}`;
                if (hot !== id) return null;
                const [x, y, w, h] = b.rect;
                return (
                  <div
                    key={`card${id}`}
                    className={`bw-card${focusId === id ? " is-focus" : ""}`}
                    style={{ right: `${100 - x - w + 2.5}%`, top: `${y + h / 2}%` }}
                    aria-hidden="true"
                  >
                    <p className="bw-kicker">{b.kicker}</p>
                    <h2>{b.title}</h2>
                    <p>{b.body}</p>
                  </div>
                );
              })}
            </div>
          )}

          {scene.kind === "floor" && (
            <div className={uiCls}>
              <svg className="bw-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {FLOORS[scene.floor].rooms.map((r) => (
                  <polygon
                    key={r}
                    points={pts(ROOMS[r].shape)}
                    className={`bw-poly${hot === r ? " is-on" : ""}${focusId === r ? " is-focus" : ""}`}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              {FLOORS[scene.floor].rooms.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="bw-hit"
                  style={{ clipPath: clipPath(ROOMS[r].shape) }}
                  aria-label={`${ROOMS[r].title}. ${ROOMS[r].fact}`}
                  disabled={!live}
                  onClick={() => void go(roomScene(r))}
                  {...hoverProps(r)}
                />
              ))}
              {FLOORS[scene.floor].small.map((s, i) =>
                s.text === "Main entrance" ? (
                  <button
                    key={`${s.text}${i}`}
                    type="button"
                    className="bw-tag bw-tag--small bw-tag--btn"
                    style={{ left: `${s.at[0]}%`, top: `${s.at[1]}%` }}
                    aria-label="Main entrance: open the directory sign"
                    disabled={!live}
                    onClick={openSign}
                  >
                    {s.text} · Directory
                  </button>
                ) : (
                <span
                  key={`${s.text}${i}${s.id === pulse?.id ? pulse.n : ""}`}
                  className={`bw-tag bw-tag--small${s.id === pulse?.id ? " is-pulse" : ""}`}
                  style={{ left: `${s.at[0]}%`, top: `${s.at[1]}%` }}
                >
                  {s.text}
                </span>
                ),
              )}
              {FLOORS[scene.floor].rooms.map((r) => (
                <span
                  key={`t${r}`}
                  aria-hidden="true"
                  className={`bw-tag${hot === r ? " is-on" : ""}${focusId === r ? " is-focus" : ""}`}
                  style={{ left: `${ROOMS[r].label[0]}%`, top: `${ROOMS[r].label[1]}%` }}
                >
                  {ROOMS[r].title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frozen copy of the previous picture during a move */}
      <div className="bw-layer bw-from" ref={fromRef} aria-hidden="true">
        <div className="bw-stage" ref={fromStage}>
          <img className="bw-pic" ref={fromImg} alt="" draggable={false} />
        </div>
      </div>

      {/* Fly-in clip */}
      <div className="bw-layer bw-vlayer" aria-hidden="true">
        <div className="bw-stage" ref={vStage}>
          <video className="bw-pic bw-video" ref={videoRef} muted playsInline preload="auto" />
        </div>
      </div>

      {/* Always on screen */}
      <header className="bw-top">
        <button type="button" className="bw-logo" onClick={() => void go(BUILDING)} aria-label="Branch, back to the building">
          <img src={LOGO} alt="Branch" />
        </button>
        <nav className="bw-nav" aria-label="Floors">
          {([1, 2] as FloorId[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`bw-pill${curFloor === f ? " is-current" : ""}`}
              aria-current={curFloor === f ? "true" : undefined}
              onClick={() => void go(floorScene(f))}
            >
              Floor {f}
            </button>
          ))}
          <button
            type="button"
            className={`bw-pill${signOpen ? " is-current" : ""}`}
            aria-haspopup="dialog"
            onClick={openSign}
          >
            Directory
          </button>
          <button
            type="button"
            ref={whereBtn}
            className={`bw-pill${menuOpen ? " is-current" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="bw-where"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Where to?
          </button>
          {menuOpen && (
            <div className="bw-menu" id="bw-where" ref={menuRef}>
              <ul>
                {WHERE_TO.map((w, i) => (
                  <li key={w.label}>
                    <button type="button" onClick={() => pickWhere(i)}>
                      {w.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </header>

      {scene.kind === "building" && (
        <section className={`bw-intro ${uiCls}`} aria-label="Welcome">
          <p className="bw-kicker">{BUILDING_COPY.kicker}</p>
          <h1 className="bw-headline">{BUILDING_COPY.headline}</h1>
          <p className="bw-hint">{ready ? BUILDING_COPY.hint : "Loading the building…"}</p>
        </section>
      )}

      {scene.kind === "room" && (
        <>
          <section className={`bw-caption ${uiCls}`} aria-label={ROOMS[scene.room].title}>
            <p className="bw-kicker">{ROOMS[scene.room].kicker}</p>
            <h1>{ROOMS[scene.room].title}</h1>
            <p className="bw-fact">{ROOMS[scene.room].fact}</p>
            {ROOMS[scene.room].sample && <p className="bw-sample">Sample availability and prices.</p>}
          </section>
          <nav className={`bw-rooms ${uiCls}`} aria-label={`Rooms on ${FLOORS[ROOMS[scene.room].floor].name}`}>
            {FLOORS[ROOMS[scene.room].floor].rooms.map((r) => (
              <button
                key={r}
                type="button"
                className={`bw-pill${r === scene.room ? " is-current" : ""}`}
                aria-current={r === scene.room ? "true" : undefined}
                onClick={() => void go(roomScene(r))}
              >
                {ROOMS[r].title}
              </button>
            ))}
            {scene.room === "welcome" && (
              <button type="button" className="bw-pill" aria-haspopup="dialog" onClick={openSign}>
                Directory sign
              </button>
            )}
            <button type="button" className="bw-pill bw-pill--back" onClick={back}>
              Back to floor plan
            </button>
          </nav>
        </>
      )}
      {signOpen && (
        <div className="bw-sign-modal" onClick={(e) => e.target === e.currentTarget && closeSign()}>
          <div className="bw-sign-panel" role="dialog" aria-modal="true" aria-label="Directory sign">
            <div className="bw-sign-head">
              <p className="bw-kicker">Tap a destination</p>
              <button type="button" className="bw-pill bw-pill--dark" ref={signClose} onClick={closeSign}>
                Close
              </button>
            </div>
            <div className="bw-sign-board" style={{ aspectRatio: `${SIGN.w} / ${SIGN.h}` }}>
              <img src={SIGN.src} alt={SIGN.alt} draggable={false} />
              {SIGN.entries.map((en, i) => (
                <button
                  key={en.label}
                  type="button"
                  className="bw-sign-hit"
                  style={{ left: `${en.rect[0]}%`, top: `${en.rect[1]}%`, width: `${en.rect[2]}%`, height: `${en.rect[3]}%` }}
                  aria-label={`Go to ${en.label}`}
                  onClick={() => pickSign(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
