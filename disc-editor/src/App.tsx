import { useState } from 'react';
import type { ChangeEventHandler, CSSProperties, ReactNode } from 'react';
import {
  ChevronDown, CircleDot, Disc3, Download, Fish, Image,
  RotateCcw, Ruler, ScanLine, SlidersHorizontal, Zap,
} from 'lucide-react';
import { disc, layout, pngDpi, pngSide } from './disc';
import Preview from './Preview';
import { download, renderPng } from './export';
import { bandRange, defaults, ranges } from './settings';
import type { AnimationExample, DiscSettings, RangeSpec } from './settings';

const shellClass = 'mx-auto w-full max-w-[1408px] px-5 sm:px-8 lg:px-12';
const rowClass = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 text-[13px]';
const exampleOptions = [
  { value: 'koi', label: '游鱼摆尾', Icon: Fish },
  { value: 'ball', label: '小球跳动', Icon: CircleDot },
] satisfies { value: AnimationExample; label: string; Icon: typeof Fish }[];

interface SelectSettingProps {
  label: string;
  id: string;
  value: number;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  children: ReactNode;
}

function SelectSetting({ label, id, value, onChange, children }: SelectSettingProps) {
  return (
    <label className={rowClass} htmlFor={id}>
      <span>{label}</span>
      <div className="relative">
        <select id={id} value={value} onChange={onChange} className="select-control">
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted" size={14} aria-hidden="true" />
      </div>
    </label>
  );
}

interface RangeSettingProps {
  spec: RangeSpec;
  value: number;
  onChange: (value: number) => void;
  detail: string;
}

function RangeSetting({ spec, value, onChange, detail }: RangeSettingProps) {
  const { id, label, min, max, step, unit } = spec;
  const fill: CSSProperties & { '--range-fill': string } = {
    '--range-fill': `${(value - min) / (max - min) * 100}%`,
  };
  return (
    <div className={rowClass}>
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id} id={id + 'Out'} className="value-readout">
        {value} {unit}{detail}
      </output>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="range-control col-span-2"
        style={fill} />
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState(defaults);
  const [resetCount, setResetCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const { example, count, repeats, direction, guides, diameter } = settings;
  const geometry = layout(settings);
  const { slots, outerTrack, innerTrack, ballRadius } = geometry;
  const stripeWidth = Math.PI * (outerTrack + innerTrack) / (2 * slots);
  function update<Key extends keyof DiscSettings>(key: Key, value: DiscSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setSettings({ ...defaults, example });
    setResetCount((current) => current + 1);
  }

  function exportName(extension: 'svg' | 'png') {
    return `cd-${example}-${slots}slots-${count}f.${extension}`;
  }

  function exportSvg() {
    download(new Blob([disc(settings)], { type: 'image/svg+xml;charset=utf-8' }), exportName('svg'));
  }

  async function exportPng() {
    setExportError(false);
    setExporting(true);
    try {
      const svg = new Blob([disc(settings, false, `${pngSide}px`)], { type: 'image/svg+xml;charset=utf-8' });
      const png = await renderPng(svg);
      download(png, exportName('png'));
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  function renderRange(spec: RangeSpec) {
    const fitted = Math.round(ballRadius * 200) / 100;
    const detail = spec.id === 'diameter' && fitted < diameter ? `（盘面 ${fitted} mm）` : '';
    return <RangeSetting key={spec.id} spec={spec} value={settings[spec.id]}
      detail={detail} onChange={(value) => update(spec.id, value)} />;
  }

  return (
    <div className="min-h-screen bg-workspace font-sans text-ink">
      <header className="border-b border-line bg-paper">
        <div className={shellClass + ' flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3.5 sm:py-4'}>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded bg-studio text-white"><Disc3 size={22} strokeWidth={1.65} aria-hidden="true" /></span>
            <strong className="brand-type text-xl tracking-tight">CD Zoetrope</strong>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="导出盘面">
            <button id="save-png" type="button" className="button button-secondary" disabled={exporting} onClick={exportPng}
              title={`${pngSide} × ${pngSide} 像素，${pngDpi} DPI`}>
              <Image size={16} aria-hidden="true" />{exporting ? '正在导出…' : '下载 PNG'}
            </button>
            <button id="save" type="button" className="button button-primary" onClick={exportSvg}>
              <Download size={16} aria-hidden="true" />下载 SVG
            </button>
          </div>
        </div>
      </header>
      <main className={shellClass + ' pt-7 pb-9 sm:pt-9'}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-7">
          <div>
            <h1 className="text-[29px] leading-tight font-bold tracking-tight sm:text-[36px]">测试盘编辑器</h1>
            <p className="mt-1.5 text-sm text-muted">排列动画帧，预览动作，并导出可印刷的 CD 盘面。</p>
          </div>
          <div className="flex items-center gap-2 pb-0.5 text-sm text-muted">
            <Ruler size={16} aria-hidden="true" />
            <span>导出画布</span>
            <span className="font-mono font-medium text-ink">120 × 120 mm</span>
          </div>
        </div>
        {exportError && <p role="alert" className="mb-4 rounded border border-ink bg-paper px-3 py-2 text-sm font-medium text-ink">PNG 导出失败，请重试。</p>}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Preview settings={settings} geometry={geometry} resetCount={resetCount} />
          <aside className="overflow-hidden rounded-lg border border-line bg-paper">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5">
              <h2 className="flex items-center gap-2 text-base font-bold"><SlidersHorizontal size={17} className="text-muted" aria-hidden="true" />盘面设置</h2>
              <button type="button" id="reset" className="button button-quiet" onClick={reset}>
                <RotateCcw size={15} aria-hidden="true" />恢复默认
              </button>
            </div>
            <div className="space-y-4 px-4 pt-4 pb-4 sm:px-5">
              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold">动画示例</legend>
                <div id="example" className="grid grid-cols-2 gap-2">
                  {exampleOptions.map(({ value, label, Icon }) => (
                    <label key={value} className="example-option">
                      <input className="sr-only" type="radio" name="example" value={value} checked={example === value}
                        onChange={() => update('example', value)} />
                      <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2.5">
                {ranges.filter((spec) => spec.group === 'art' && (!spec.example || spec.example === example)).map(renderRange)}
                <div className="grid gap-2 min-[370px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <SelectSetting id="repeats" label="重复次数" value={repeats} onChange={(event) => update('repeats', Number(event.target.value))}>
                    {[1, 2, 3].map((value) => <option key={value} value={value}>{value} 组</option>)}
                  </SelectSetting>
                  <SelectSetting id="direction" label="盘片转向" value={direction} onChange={(event) => update('direction', event.target.value === '-1' ? -1 : 1)}>
                    <option value="1">顺时针</option>
                    <option value="-1">逆时针</option>
                  </SelectSetting>
                </div>
              </div>
              <section aria-labelledby="sync-heading" className="space-y-2.5 border-t border-line pt-3.5">
                <h3 id="sync-heading" className="flex items-center gap-2 text-sm font-bold"><ScanLine size={15} className="text-muted" aria-hidden="true" />同步标记</h3>
                {renderRange(bandRange)}
                <label className="flex min-h-6 cursor-pointer items-center gap-2 text-[13px]">
                  <input id="guides" type="checkbox" checked={guides} className="size-4 accent-ink"
                    onChange={(event) => update('guides', event.target.checked)} />显示帧号与辅助线
                </label>
                <div id="timing" className="flex items-start gap-2.5 rounded-md border border-line bg-workspace px-3 py-2.5">
                  <Zap size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <strong className="font-mono text-sm">{Math.round(slots * 200 / 60)}–{Math.round(slots * 500 / 60)} Hz</strong>
                      <span className="text-xs text-muted">200–500 RPM</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">标记环中线处每段黑或白约 {stripeWidth.toFixed(1)} mm</p>
                  </div>
                </div>
              </section>
              <details className="group border-t border-line pt-2.5">
                <summary className="flex min-h-7 cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  <Ruler size={15} className="text-muted" aria-hidden="true" />印刷范围
                  <span className="ml-auto font-mono text-xs font-normal text-muted">{settings.inner}–{settings.outer} mm</span>
                  <ChevronDown size={15} className="shrink-0 text-muted group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-3 space-y-2.5">
                  {ranges.filter((spec) => spec.group === 'print').map(renderRange)}
                  <p className="text-xs leading-relaxed text-muted">请按印刷商模板调整可印内径和外径。</p>
                </div>
              </details>
            </div>
          </aside>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">中心和外缘保留透明。送印前请确认同步环的白色扇区会实际印成白色。</p>
      </main>
    </div>
  );
}
