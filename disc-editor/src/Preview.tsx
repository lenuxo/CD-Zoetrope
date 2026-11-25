import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, Ref } from 'react';
import { ChevronDown, ChevronUp, Disc3, Film, Frame, Maximize2, Minimize2, Pause, Play, RotateCw, ScanLine, SlidersHorizontal, Zap } from 'lucide-react';
import { disc, motionPreview } from './disc';
import type { DiscLayout } from './disc';
import DiscSurface from './DiscSurface';
import { cdState, displayFlashHz, strobeExposure } from './simulation';
import type { StrobeExposure } from './simulation';
import type { DiscSettings } from './settings';

const motionModes = [
  { value: 'rotation', label: '旋转', Icon: RotateCw },
  { value: 'frame', label: '定格帧', Icon: Frame },
  { value: 'strobe', label: '频闪', Icon: Zap },
] as const;

type MotionMode = (typeof motionModes)[number]['value'];
type PreviewMode = 'disc' | MotionMode;

interface NumericControlProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  readout?: ReactNode;
  onChange: (value: number) => void;
}

function PreviewRange({ id, label, value, min = 0, max, step = 1, readout, onChange }: NumericControlProps & { step?: number }) {
  const fill: CSSProperties & { '--range-fill': string } = {
    '--range-fill': `${(value - min) / (max - min) * 100}%`,
  };
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="flex justify-between gap-2 text-xs text-stage-muted">
        <span>{label}</span>
        <span className="font-mono text-stage-highlight">{readout}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        className="range-control range-dark mt-1"
        style={fill}
        onChange={(event) => onChange(event.target.valueAsNumber)} />
    </div>
  );
}

function PreviewNumber({ id, label, value, min = 0, max, unit, readout, onChange }: NumericControlProps & { unit: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const validRange = `${min}–${max} ${unit}`;

  function commit(input: HTMLInputElement) {
    if (draft === null) return;
    const number = input.valueAsNumber;
    if (Number.isFinite(number) && number >= min && number <= max) {
      onChange(number);
    } else {
      setRejected(true);
    }
    setDraft(null);
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs text-stage-muted">
        <label htmlFor={id}>{label}</label>
        {readout && <output htmlFor={id} className="font-mono text-stage-highlight">{readout}</output>}
      </div>
      <div className="mt-1 flex items-center gap-2 rounded border border-neutral-600 bg-neutral-900 pr-2.5 focus-within:border-white">
        <input id={id} className="preview-number min-w-0 flex-1 px-2.5 py-1.5 font-mono text-sm tabular-nums text-white"
          type="number" inputMode="decimal" min={min} max={max} step="any" value={draft ?? value}
          title={validRange} aria-describedby={`${id}-hint`}
          onChange={(event) => { setDraft(event.target.value); setRejected(false); }}
          onBlur={(event) => commit(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            event.currentTarget.blur();
          }} />
        <span aria-hidden="true" className="shrink-0 font-mono text-xs text-stage-muted">{unit}</span>
      </div>
      <p id={`${id}-hint`} className={rejected ? 'mt-1 text-xs text-stage-muted' : 'sr-only'}>
        {rejected ? `已恢复上次的值。请输入 ${validRange}。` : `范围 ${validRange}，按回车确认。`}
      </p>
    </div>
  );
}

function positionedArtwork(settings: DiscSettings, guides = false) {
  return disc(settings, guides, '120').replace('<svg ', '<svg x="-60" y="-60" ');
}

interface CompositedDiscProps {
  artwork: string;
  artworkRef?: Ref<SVGGElement>;
  angle?: number;
}

function CompositedDisc({ artwork, artworkRef, angle = 0 }: CompositedDiscProps) {
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true">
      <DiscSurface />
      <g ref={artworkRef} transform={`rotate(${angle})`} data-disc-artwork
        dangerouslySetInnerHTML={{ __html: artwork }} />
    </svg>
  );
}

interface ExposureProps {
  artwork: string;
  exposure: StrobeExposure;
  lit: boolean;
}

function Exposure({ artwork, exposure, lit }: ExposureProps) {
  // Composite samples of the same print artwork over the duration of a pulse.
  const samples = Array.from({ length: 9 }, (_, i) => (
    <use key={i} href="#exposure-disc"
      transform={`rotate(${exposure.angle + (i + 0.5) / 9 * exposure.sweep})`}
      opacity={1 / (i + 1)} />
  ));
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true" className="strobe-image">
      <defs>
        <g id="exposure-disc" dangerouslySetInnerHTML={{ __html: artwork }} />
      </defs>
      <g className={lit ? 'exposure-layer' : 'exposure-layer exposure-dim'}>
        <DiscSurface />
        {samples}
      </g>
    </svg>
  );
}

interface PreviewProps {
  settings: DiscSettings;
  geometry: DiscLayout;
  resetCount: number;
  active: boolean;
}

export default function Preview({ settings, geometry, resetCount, active }: PreviewProps) {
  const { count, direction, example, guides, repeats } = settings;
  const { slots, isBall } = geometry;
  const [mode, setMode] = useState<PreviewMode>('disc');
  const [lastMotionMode, setLastMotionMode] = useState<MotionMode>('rotation');
  const [fullWindow, setFullWindow] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pulseMs, setPulseMs] = useState(1);
  const [flash, setFlash] = useState({ index: 0, lit: true });
  const [rpm, setRpm] = useState(cdState(0).rpm);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const previewField = useRef<HTMLDivElement>(null);
  const windowToggle = useRef<HTMLButtonElement>(null);
  const rotor = useRef<SVGGElement>(null);
  const angle = useRef(0);
  const elapsed = useRef(0);
  const lastTrigger = useRef(0);
  const effectiveFrame = Math.min(frame, count - 1);

  const printedDisc = useMemo(() => positionedArtwork(settings), [settings]);
  const discView = useMemo(() => guides ? positionedArtwork(settings, true) : printedDisc, [settings, guides, printedDisc]);
  const exposure = strobeExposure(flash.index, slots, direction, rpm, pulseMs);

  useLayoutEffect(() => {
    // Keep the same preview and playback state when entering the modal top layer.
    if (previewDialog.current) previewDialog.current.open = true;
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      const entered = document.fullscreenElement === previewField.current;
      setFullscreen(entered);
      if (entered && !active) void document.exitFullscreen().catch(() => {});
    }
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, [active]);

  useEffect(() => {
    if (active) return;
    setPlaying(false);
    if (document.fullscreenElement === previewField.current) {
      void document.exitFullscreen().catch(() => {});
    }
    if (previewDialog.current?.matches(':modal')) {
      previewDialog.current.close();
      previewDialog.current.open = true;
      setFullWindow(false);
    }
  }, [active]);

  useEffect(() => {
    setPlaying(false);
    setFrame(0);
    setFlash({ index: 0, lit: true });
    lastTrigger.current = 0;
    angle.current = 0;
    elapsed.current = 0;
    rotor.current?.setAttribute('transform', 'rotate(0)');
  }, [example, direction, resetCount]);

  useEffect(() => {
    if (!playing) return;

    function pauseWhenHidden() {
      if (document.hidden) setPlaying(false);
    }
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [playing]);

  useEffect(() => {
    if (!playing || mode !== 'frame') return;
    const timer = setInterval(() => setFrame((current) => (current + 1) % count), 140);
    return () => clearInterval(timer);
  }, [playing, mode, count]);

  useEffect(() => {
    if (!playing || mode !== 'rotation') return;
    let request: number;
    let previous: number | undefined;
    let lastReadout = 0;
    const initialAngle = angle.current;
    const initialTurns = cdState(progress, elapsed.current).turns;

    function tick(now: number) {
      if (previous !== undefined) {
        elapsed.current += (now - previous) / 1000;
        const current = cdState(progress, elapsed.current);
        angle.current = (initialAngle + direction * (current.turns - initialTurns) * 360) % 360;
        rotor.current?.setAttribute('transform', `rotate(${angle.current})`);
        if (now - lastReadout >= 250) {
          setRpm(current.rpm);
          lastReadout = now;
        }
      }
      previous = now;
      request = requestAnimationFrame(tick);
    }

    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, mode, progress, direction]);

  useEffect(() => {
    if (!playing || mode !== 'strobe') return;
    const interval = 1000 / displayFlashHz;
    const visiblePulse = 165;
    const firstIndex = lastTrigger.current;
    let request: number;
    let start: number | undefined;
    let lastStep = -1;
    let wasLit: boolean | undefined;

    function tick(now: number) {
      start ??= now;
      const time = now - start;
      const step = Math.floor(time / interval);
      const lit = time % interval < visiblePulse;
      if (step !== lastStep || lit !== wasLit) {
        lastTrigger.current = (firstIndex + step) % slots;
        setFlash({ index: lastTrigger.current, lit });
        lastStep = step;
        wasLit = lit;
      }
      request = requestAnimationFrame(tick);
    }

    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, mode, slots]);

  function switchMode(next: PreviewMode) {
    if (next === mode) return;
    setPlaying(false);
    setMode(next);
    setFlash((current) => ({ ...current, lit: true }));
    if (next !== 'disc') setLastMotionMode(next);
  }

  function changeProgress(value: number) {
    elapsed.current = 0;
    setProgress(value);
    setRpm(cdState(value).rpm);
  }

  function togglePlaying() {
    if (playing && mode === 'strobe') setFlash((current) => ({ ...current, lit: true }));
    setPlaying(!playing);
  }

  function changeWindow(expand: boolean) {
    const dialog = previewDialog.current;
    if (!dialog) return;
    dialog.close();
    if (expand) dialog.showModal();
    else dialog.open = true;
    setFullWindow(expand);
    windowToggle.current?.focus({ preventScroll: true });
  }

  async function toggleFullscreen() {
    if (fullWindow) {
      changeWindow(false);
      return;
    }
    if (fullscreen) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    const field = previewField.current;
    if (document.fullscreenEnabled && field?.requestFullscreen) {
      try {
        await field.requestFullscreen();
        return;
      } catch {
        // A browser or an embedding page can deny native fullscreen.
        if (field.closest('[hidden]')) return;
      }
    }
    changeWindow(true);
  }

  const expanded = fullscreen || fullWindow;
  const fullscreenLabel = fullscreen ? '退出全屏' : fullWindow ? '退出全窗口预览' :
    document.fullscreenEnabled ? '全屏预览' : '全窗口预览';
  const isSimulation = mode === 'rotation' || mode === 'strobe';
  const inMotionPreview = mode !== 'disc';
  const displayName = isBall ? '小球' : '游鱼';

  return (
    <section aria-label="预览工作区" className="preview-panel">
      <div inert={expanded} className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-5 sm:py-3">
        <div className={`hidden items-center gap-2.5 text-sm font-semibold text-ink ${inMotionPreview ? 'xl:flex' : 'sm:flex'}`}>
          <ScanLine size={17} className="text-muted" aria-hidden="true" />预览工作区
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-initial">
          <div className="flex gap-0.5 rounded-md border border-line bg-workspace p-0.5" role="group" aria-label="预览类型">
            <button type="button" className="preview-toggle" aria-pressed={!inMotionPreview} onClick={() => switchMode('disc')}>
              <Disc3 size={15} className="shrink-0" aria-hidden="true" />盘面图案
            </button>
            <button type="button" className="preview-toggle" aria-pressed={inMotionPreview} onClick={() => {
              if (!inMotionPreview) switchMode(lastMotionMode);
            }}>
              <Film size={15} className="shrink-0" aria-hidden="true" />动作预览
            </button>
          </div>
          {inMotionPreview && (
            <div className="flex gap-0.5" role="group" aria-label="模拟方式">
              {motionModes.map(({ value, label, Icon }) => (
                <button key={value} type="button" className="motion-toggle" aria-pressed={mode === value} onClick={() => switchMode(value)}>
                  <Icon size={14} className="shrink-0" aria-hidden="true" />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <dialog ref={previewDialog} className="preview-dialog" aria-label="预览画板" onCancel={(event) => {
        event.preventDefault();
        changeWindow(false);
      }}>
        <div ref={previewField} className={mode === 'disc' ? 'preview-field' : 'preview-field preview-field-motion'}>
          <button ref={windowToggle} type="button" className="button preview-expand"
            aria-label={fullscreenLabel} title={fullscreenLabel}
            onClick={toggleFullscreen}>
            {expanded ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}
          </button>
          {mode === 'strobe' ? (
            <div id="stage" className="art-stage" role="img" aria-label={`${displayName}频闪模拟`}>
              <Exposure artwork={printedDisc} exposure={exposure} lit={!playing || flash.lit} />
            </div>
          ) : mode === 'frame' ? (
            <div id="stage" className="art-stage art-stage-motion" role="img" aria-label={`${displayName}定格帧`}
              dangerouslySetInnerHTML={{ __html: motionPreview(settings, effectiveFrame, geometry) }} />
          ) : (
            <div key={mode} id="stage" className="art-stage disc-stage"
              role="img" aria-label={`${displayName}${mode === 'rotation' ? '旋转模拟' : '测试盘盘面'}`}>
              <CompositedDisc artwork={mode === 'rotation' ? printedDisc : discView}
                artworkRef={mode === 'rotation' ? rotor : null} angle={mode === 'rotation' ? angle.current : 0} />
            </div>
          )}
          {inMotionPreview && (
            <div className="playback-dock">
              <div className="playback-actions">
                <button id="play" type="button" className="button button-play min-w-[4.6rem]" onClick={togglePlaying}
                  title={mode === 'strobe' && !playing ? '播放慢速频闪' : undefined}>
                  {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
                  {playing ? '暂停' : '播放'}
                </button>
                <button type="button" className="button playback-toggle"
                  aria-expanded={settingsOpen} aria-controls="playback-settings"
                  onClick={() => setSettingsOpen((open) => !open)}>
                  <SlidersHorizontal size={15} aria-hidden="true" />播放设置
                  {settingsOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronUp size={14} aria-hidden="true" />}
                </button>
              </div>
              <div id="playback-settings" className="playback-popover" hidden={!settingsOpen}>
                <div className="space-y-3">
                  {mode === 'frame' && <PreviewRange id="frame" label="预览帧" value={effectiveFrame} max={count - 1}
                    readout={<output id="counter">{effectiveFrame + 1} / {count}</output>}
                    onChange={(next) => { setPlaying(false); setFrame(next); }} />}
                  {isSimulation && <PreviewNumber id="track-progress" label="读盘进度" value={progress} max={100} unit="%"
                    readout={`${Math.round(rpm)} RPM`} onChange={changeProgress} />}
                  {mode === 'strobe' && <>
                    <PreviewNumber id="pulse-width" label="光脉宽" value={pulseMs} min={0.1} max={2}
                      unit="ms" onChange={setPulseMs} />
                    <p className="border-t border-white/15 pt-2 text-xs leading-relaxed text-stage-muted">
                      硬件估算 <strong className="text-white">{exposure.frequency.toFixed(1)} Hz</strong>
                      {' · '}占空比 {exposure.dutyPercent.toFixed(1)}%
                      <br />单次亮灯转过 {Math.abs(exposure.sweep).toFixed(2)}°
                    </p>
                  </>}
                </div>
              </div>
            </div>
          )}
        </div>
      </dialog>
      <div inert={expanded} className="border-t border-line px-4 py-3 sm:px-5">
        <div id="caption" className="space-y-1 text-xs leading-relaxed text-muted">
          {mode === 'disc' && <p className="flex flex-wrap gap-x-5 gap-y-1">
            <span><strong className="text-ink">{count} 帧</strong> × {repeats} 组</span>
            <span><strong className="text-ink">{slots} 对</strong> 黑白标记</span>
            <span>{direction === 1 ? '顺时针' : '逆时针'}旋转</span>
          </p>}
          {mode === 'frame' && <p>固定观察位置，可慢放或逐帧查看。</p>}
          {mode === 'rotation' && <p>以 1.3 m/s 恒定线速度模拟 1× 音频 CD。读盘进度越靠外，盘片转得越慢。</p>}
          {mode === 'strobe' && <p>屏幕以每秒 2 次慢放，逐个展示同步标记触发时的盘面。亮灭只发生在盘面区域。</p>}
        </div>
      </div>
    </section>
  );
}
