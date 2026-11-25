import { useId } from 'react';

function annulus(outer: number, inner: number) {
  function circle(radius: number) {
    return `M ${radius} 0 a ${radius} ${radius} 0 1 0 ${-2 * radius} 0 a ${radius} ${radius} 0 1 0 ${2 * radius} 0 Z`;
  }
  return `${circle(outer)} ${circle(inner)}`;
}

// Label-side mockup in the same millimeter coordinates as the print artwork.
export default function DiscSurface() {
  const metal = useId();
  const plastic = useId();
  const bevel = useId();
  const hole = 7.5;
  const hubEdge = 16.5;
  return (
    <g data-disc-surface aria-hidden="true">
      <defs>
        <linearGradient id={metal} x1="0" y1=".2" x2="1" y2=".8">
          <stop offset="0" stopColor="#a2a8ac" />
          <stop offset=".19" stopColor="#f7f8f9" />
          <stop offset=".35" stopColor="#b5bcc3" />
          <stop offset=".55" stopColor="#e6e8e9" />
          <stop offset=".73" stopColor="#939ba3" />
          <stop offset=".88" stopColor="#f1f3f5" />
          <stop offset="1" stopColor="#b5bbc0" />
        </linearGradient>
        <linearGradient id={plastic} x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#f5f7fa" stopOpacity=".56" />
          <stop offset=".35" stopColor="#d5dade" stopOpacity=".27" />
          <stop offset=".62" stopColor="#f1f3f6" stopOpacity=".42" />
          <stop offset="1" stopColor="#a1a7ae" stopOpacity=".24" />
        </linearGradient>
        <linearGradient id={bevel} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".39" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".76" stopColor="#24282d" stopOpacity=".78" />
          <stop offset="1" stopColor="#f9fafb" stopOpacity=".8" />
        </linearGradient>
      </defs>

      <path d={annulus(60, hubEdge)} fill={`url(#${metal})`} fillRule="evenodd" />
      <path d={annulus(hubEdge, hole)} fill={`url(#${plastic})`} fillRule="evenodd" />
      <g fill="none" stroke={`url(#${bevel})`}>
        <circle r="59.74" strokeWidth=".48" />
        <circle r="58.75" strokeWidth=".22" />
        <circle r={hubEdge} strokeWidth=".35" />
        <circle r="14.4" strokeWidth=".22" />
        <circle r="10.5" strokeWidth=".17" />
        <circle r="7.73" strokeWidth=".44" />
      </g>
      <circle r="57.8" fill="none" stroke="#fff" strokeOpacity=".46" strokeWidth=".13" />
      <circle r="17.4" fill="none" stroke="#fdfdfd" strokeOpacity=".56" strokeWidth=".18" />
    </g>
  );
}
