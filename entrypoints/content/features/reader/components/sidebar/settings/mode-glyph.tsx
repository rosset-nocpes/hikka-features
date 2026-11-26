import { MangaReadingMode } from '../../../reader.enums';

/** A page: a rounded outline with a few lines of "panels". */
const Page = ({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) => (
  <>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={1.5}
      fill="currentColor"
      fillOpacity={0.12}
      stroke="currentColor"
      strokeWidth={1.5}
    />
    <path
      d={`M${x + 3} ${y + h * 0.38}H${x + w - 3}M${x + 3} ${y + h * 0.66}H${x + w - 3}`}
      stroke="currentColor"
      strokeOpacity={0.45}
      strokeWidth={1.25}
      strokeLinecap="round"
    />
  </>
);

/** An arrow from (x1, y1) to (x2, y2), with a head at its end. */
const Arrow = ({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = (turn: number) =>
    `${x2 - 3.5 * Math.cos(angle + turn)} ${y2 - 3.5 * Math.sin(angle + turn)}`;

  return (
    <path
      d={`M${x1} ${y1}L${x2} ${y2}M${head(0.7)}L${x2} ${y2}L${head(-0.7)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/** A small picture of how pages follow each other in `mode`. */
const ModeGlyph = ({ mode }: { mode: MangaReadingMode }) => (
  <svg
    viewBox="0 0 36 28"
    className="h-7 w-9 overflow-hidden"
    aria-hidden="true"
  >
    {mode === MangaReadingMode.LeftToRight && (
      <>
        <Page x={4} y={3} w={14} h={22} />
        <Arrow x1={22} y1={14} x2={32} y2={14} />
      </>
    )}
    {mode === MangaReadingMode.RightToLeft && (
      <>
        <Page x={18} y={3} w={14} h={22} />
        <Arrow x1={14} y1={14} x2={4} y2={14} />
      </>
    )}
    {mode === MangaReadingMode.Vertical && (
      <>
        {/* A page, and the next one below it. */}
        <Page x={6} y={1} w={13} h={18} />
        <rect
          x={6}
          y={22}
          width={13}
          height={8}
          rx={1.5}
          fill="currentColor"
          fillOpacity={0.12}
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <Arrow x1={28} y1={6} x2={28} y2={22} />
      </>
    )}
    {mode === MangaReadingMode.Strip && (
      <>
        {/* One column running past both edges, its pages seamed. */}
        <rect
          x={6}
          y={-2}
          width={13}
          height={32}
          fill="currentColor"
          fillOpacity={0.12}
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <path
          d="M6 9.5H19M6 18.5H19"
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={1.25}
          strokeDasharray="2 1.5"
        />
        <Arrow x1={28} y1={6} x2={28} y2={22} />
      </>
    )}
  </svg>
);

export default ModeGlyph;
