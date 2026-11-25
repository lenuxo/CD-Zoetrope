import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cdState, strobeExposure } from './simulation';

const sectionClass = 'border-t border-line py-7 sm:py-9';
const headingClass = 'mb-3 text-xl font-bold tracking-tight sm:text-2xl';
const copyClass = 'max-w-[70ch] text-sm leading-7 text-muted sm:text-base';
const sourceClass = 'font-medium text-ink underline underline-offset-4 hover:text-muted';

function StrobeCalculator() {
  const [progress, setProgress] = useState(0);
  const [slots, setSlots] = useState(12);
  const [pulseMs, setPulseMs] = useState(1);
  const { rpm, radiusMm } = cdState(progress);
  const { frequency, sweep, dutyPercent } = strobeExposure(0, slots, 1, rpm, pulseMs);

  return (
    <div className="mt-5 grid gap-5 rounded-lg border border-line bg-paper p-4 sm:grid-cols-2 sm:p-5">
      <fieldset className="grid min-w-0 gap-4">
        <legend className="mb-3 text-sm font-semibold">调整模拟参数</legend>
        <div>
          <label htmlFor="guide-progress" className="flex justify-between gap-3 text-sm">
            读盘进度 <span className="font-mono text-muted">{progress}%</span>
          </label>
          <input id="guide-progress" className="mt-2 w-full accent-ink" type="range" min="0" max="100"
            value={progress} onChange={(event) => setProgress(event.target.valueAsNumber)} />
        </div>
        <label className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
          每圈槽数
          <select className="rounded border border-line bg-paper px-2 py-1 font-mono" value={slots}
            onChange={(event) => setSlots(Number(event.target.value))}>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={54}>54</option>
          </select>
        </label>
        <div>
          <label htmlFor="guide-pulse" className="flex justify-between gap-3 text-sm">
            光脉宽 <span className="font-mono text-muted">{pulseMs.toFixed(1)} ms</span>
          </label>
          <input id="guide-pulse" className="mt-2 w-full accent-ink" type="range" min="0.1" max="2" step="0.1"
            value={pulseMs} onChange={(event) => setPulseMs(event.target.valueAsNumber)} />
        </div>
      </fieldset>
      <dl className="grid content-start gap-2 rounded-md bg-workspace p-4 text-sm">
        {[
          ['读取半径', `${radiusMm.toFixed(1)} mm`],
          ['盘片转速', `${Math.round(rpm)} RPM`],
          ['每槽一闪', `${frequency.toFixed(1)} Hz`],
          ['单次亮灯转过', `${sweep.toFixed(2)}°`],
          ['亮灯占空比', `${dutyPercent.toFixed(1)}%`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
            <dt className="text-muted">{label}</dt>
            <dd className="font-mono font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Guide() {
  return (
    <main className="mx-auto w-full max-w-[900px] px-5 pt-7 pb-10 sm:px-8 sm:pt-10">
      <div className="pb-7 sm:pb-9">
        <h1 className="text-[29px] leading-tight font-bold tracking-tight sm:text-[36px]">CD Zoetrope 原理与设计</h1>
        <p className={copyClass + ' mt-3'}>
          把连续动画帧印在音频 CD 的盘面上，再用跟随盘片转动的短闪光逐帧照亮。CD 播放器继续负责播音乐，外置传感器和灯负责呈现动画。
        </p>
      </div>

      <section className={sectionClass}>
        <h2 className={headingClass}>为什么 CD 从内圈转得快，到了外圈就变慢？</h2>
        <p className={copyClass}>
          典型的 1× 音频 CD 以恒定线速度（CLV）读取。激光头每秒扫过的轨道长度大致相同。外圈一转经过的轨道更长，所以每秒需要的圈数更少。编辑器以 1.3 m/s 模拟，读取半径从 25 mm 移到 58 mm 时，约从 497 RPM 降到 214 RPM。实际机器可能因缓冲、跳曲或停转偏离这个模型。
        </p>
        <p className="mt-2 text-sm"><a className={sourceClass} href="https://blogs.loc.gov/now-see-hear/files/2018/05/digital-revo.pdf">Philips 的 CD 技术资料</a></p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>为什么闪光能让图案动起来？</h2>
        <p className={copyClass}>
          以 12 槽盘为例，每格相隔 30°。盯住盖板上的一个固定位置，盘片每走过一格就闪一次，下一张图便出现在同一个位置。固定参考线看起来停在原地，小球相对它的位置逐次变化，就能看出跳动。
        </p>
        <figure className="mt-4">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-studio p-3 text-center text-white sm:gap-3">
            {[25, 43, 60].map((height, index) => (
              <div key={height} className="min-w-0 rounded border border-white/25 px-2 pt-2 pb-2.5">
                <div className="relative mx-auto h-20 w-16 max-w-full" aria-hidden="true">
                  <span className="absolute bottom-3 left-1/2 h-0.5 w-3/4 -translate-x-1/2 bg-white" />
                  <span className="absolute left-1/2 size-4 -translate-x-1/2 rounded-full bg-white" style={{ bottom: height }} />
                </div>
                <span className="text-xs">第 {index + 1} 次闪光</span>
              </div>
            ))}
          </div>
          <figcaption className="mt-2 text-xs text-muted">同一观察位置的三次采样示意。</figcaption>
        </figure>
        <p className={copyClass + ' mt-4'}>
          盘速变化时，固定频率的闪光会让图案漂移。测试盘的同步环每格印一对黑白区域，传感器只取同一种边沿，每格触发一次。这样实际转过多少角度，就决定什么时候闪。
        </p>
        <p className="mt-2 text-sm"><a className={sourceClass} href="https://learn.adafruit.com/strobe-zoetrope">Adafruit 频闪走马灯实验</a></p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>帧数、重复次数和槽数怎么选？</h2>
        <ul className={copyClass + ' list-disc space-y-2 pl-5'}>
          <li><strong className="text-ink">帧数</strong>决定一个动作循环有多少张图。把每帧等角度绕盘心排开，图案的朝向也跟着转。</li>
          <li><strong className="text-ink">槽数</strong>等于帧数乘以重复次数。12 帧排一组，每圈走完一轮动作。在 300 RPM 下，一秒转五圈，所以每槽一闪需要 60 Hz，动作每秒循环五次。</li>
          <li><strong className="text-ink">重复次数</strong>增加后，一圈能播多轮同一动作。54 槽的游鱼是 18 帧重复三组。槽越密，单个图形和黑白标记能占的空间就越小。</li>
        </ul>
        <p className={copyClass + ' mt-4'}>
          第一张盘可以用 12 帧小球。小球沿半径跳，闪光造成的拖影主要沿圆周方向。每帧配上同样的参考线，能同时观察同步是否稳定和动作是否清楚。标记环位置和可印内外径要按闭盖视野与商家模板确定。
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>转速和光脉宽怎样影响画面？</h2>
        <p className={copyClass}>
          每秒闪光次数等于转速 ÷ 60 × 槽数。单次闪光越长，盘片在亮灯期间转过的角度就越大。以 500 RPM 为例，亮灯 1 ms 会转过 3°，在半径 45 mm 处约有 2.36 mm 的切向位移。
        </p>
        <StrobeCalculator />
        <p className={copyClass + ' mt-4'}>
          光脉宽指 LED 实际发光的时间，控制器发出的脉冲还会受到灯具响应影响。编辑器将频闪按每秒两次慢放，便于看清每次采样。这里的频率和占空比用于估算实物需求，亮度和拖影还要用样片验证。
        </p>
      </section>

      <a href="#/" className="button button-primary">返回编辑器 <ArrowRight size={16} aria-hidden="true" /></a>
    </main>
  );
}
