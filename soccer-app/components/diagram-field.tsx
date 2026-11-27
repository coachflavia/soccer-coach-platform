import type { FieldTemplate } from "../lib/diagram-data";

type Pitch = {
  length: number;
  width: number;
  goal: number;
  boxDepth: number;
  boxWidth: number;
  goalArea: number;
  spot: number;
  circle: number;
};

const regulation: Pitch = {
  length: 105,
  width: 68,
  goal: 7.32,
  boxDepth: 16.5,
  boxWidth: 40.32,
  goalArea: 5.5,
  spot: 11,
  circle: 9.15,
};

// Small-sided sizes are representative configurations. Local competition rules vary.
const pitches: Partial<Record<FieldTemplate, Pitch>> = {
  "9v9": {
    length: 73,
    width: 46,
    goal: 4.88,
    boxDepth: 12.8,
    boxWidth: 29.3,
    goalArea: 4.6,
    spot: 8.2,
    circle: 6.4,
  },
  "7v7": {
    length: 55,
    width: 37,
    goal: 3.66,
    boxDepth: 9.15,
    boxWidth: 16.46,
    goalArea: 0,
    spot: 7.3,
    circle: 4.6,
  },
  "5v5": {
    length: 37,
    width: 27,
    goal: 3.66,
    boxDepth: 8.2,
    boxWidth: 14.6,
    goalArea: 0,
    spot: 6.4,
    circle: 4.6,
  },
  futsal: {
    length: 40,
    width: 20,
    goal: 3,
    boxDepth: 6,
    boxWidth: 15,
    goalArea: 0,
    spot: 6,
    circle: 3,
  },
};

export function DiagramField({
  template,
  horizontal,
  id,
}: {
  template: FieldTemplate;
  horizontal: boolean;
  id: string;
}) {
  const pitch = pitches[template] ?? regulation;
  const futsal = template === "futsal";
  const half = template === "half";
  const third = template === "final-third";
  const blank = template === "blank" || template === "grid";
  const length = pitch.length / (half ? 2 : third ? 3 : 1);
  const { width, circle } = pitch;
  const scale = Math.min(920 / length, 570 / width);
  const right = half || third ? 954 : (1000 + length * scale) / 2;
  const stripe = length / (half ? 6 : third ? 4 : 12);

  return (
    <g
      transform={horizontal ? undefined : "translate(0 1000) rotate(-90)"}
      pointerEvents="none"
    >
      <defs>
        <linearGradient id={`${id}-light`} x2="0" y2="1">
          <stop stopColor="#fff" stopOpacity=".10" />
          <stop offset=".54" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#071e14" stopOpacity=".24" />
        </linearGradient>
        <pattern
          id={`${id}-mow`}
          width={stripe * 2}
          height="1"
          patternUnits="userSpaceOnUse"
        >
          <rect width={stripe} height="1" fill="#143c18" opacity=".13" />
        </pattern>
        <pattern
          id={`${id}-grain`}
          width="14"
          height="11"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M2 2h2M9 4h1M5 8h2M12 10h1"
            stroke="#efffdc"
            strokeOpacity=".09"
          />
          <path d="M6 2h1M1 6h2M10 8h1" stroke="#143c18" strokeOpacity=".18" />
        </pattern>
        <pattern
          id={`${id}-grid`}
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M50 0H0V50"
            fill="none"
            stroke="#fff"
            strokeOpacity=".18"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="1000" height="650" fill={futsal ? "#1f5057" : "#306340"} />
      <g transform={`translate(${right - length * scale} 325) scale(${scale})`}>
        {!blank && (
          <>
            <rect
              y={-width / 2}
              width={length}
              height={width}
              fill={futsal ? "#347983" : "#508843"}
            />
            {!futsal && (
              <rect
                y={-width / 2}
                width={length}
                height={width}
                fill={`url(#${id}-mow)`}
              />
            )}
          </>
        )}
      </g>
      {!futsal && <rect width="1000" height="650" fill={`url(#${id}-grain)`} />}
      <rect width="1000" height="650" fill={`url(#${id}-light)`} />
      {template === "grid" && (
        <rect
          x="25"
          y="25"
          width="950"
          height="600"
          fill={`url(#${id}-grid)`}
          stroke="#f6faf0"
          strokeOpacity=".55"
          strokeWidth="2"
        />
      )}
      {!blank && (
        <g
          transform={`translate(${right - length * scale} 325) scale(${scale})`}
          fill="none"
          stroke="#f6faf0"
          strokeWidth={2.25 / scale}
          strokeOpacity=".93"
        >
          <path
            d={`M0 ${-width / 2}H${length}V${width / 2}H0${third ? "" : "Z"}`}
          />
          {!half && !third && (
            <>
              <path d={`M${length / 2} ${-width / 2}V${width / 2}`} />
              <circle cx={length / 2} r={circle} />
              <circle cx={length / 2} r=".27" fill="#f6faf0" />
              <PitchEnd pitch={pitch} futsal={futsal} />
            </>
          )}
          {half && (
            <>
              <path d={`M0 ${-circle}A${circle} ${circle} 0 0 1 0 ${circle}`} />
              <circle r=".27" fill="#f6faf0" />
            </>
          )}
          <g transform={`translate(${length} 0) scale(-1 1)`}>
            <PitchEnd pitch={pitch} futsal={futsal} />
          </g>
        </g>
      )}
    </g>
  );
}

function PitchEnd({ pitch, futsal }: { pitch: Pitch; futsal: boolean }) {
  const { width, goal, boxDepth, boxWidth, goalArea, spot, circle } = pitch;
  const arcHeight = Math.sqrt(
    Math.max(0, circle ** 2 - (boxDepth - spot) ** 2),
  );
  const corner = futsal ? 0.25 : 1;
  const depth = futsal ? 1 : 2;
  const net = goal / 2;
  return (
    <>
      <path
        d={`M0 ${-width / 2 + corner}A${corner} ${corner} 0 0 0 ${corner} ${-width / 2}
      M0 ${width / 2 - corner}A${corner} ${corner} 0 0 1 ${corner} ${width / 2}`}
      />
      {futsal ? (
        <>
          <path d="M0 -7.5A6 6 0 0 1 6 -1.5V1.5A6 6 0 0 1 0 7.5" />
          <circle cx="10" r=".12" fill="#f6faf0" />
        </>
      ) : (
        <>
          <path d={`M0 ${-boxWidth / 2}H${boxDepth}V${boxWidth / 2}H0`} />
          {goalArea > 0 && (
            <path d={`M0 ${-net - goalArea}H${goalArea}V${net + goalArea}H0`} />
          )}
          {arcHeight > 0 && (
            <path
              d={`M${boxDepth} ${-arcHeight}A${circle} ${circle} 0 0 1 ${boxDepth} ${arcHeight}`}
            />
          )}
        </>
      )}
      <circle cx={spot} r=".22" fill="#f6faf0" />
      <path
        d={`M0 ${-net}H${-depth}V${net}H0Z`}
        fill="#16382e"
        fillOpacity=".6"
        strokeWidth=".15"
      />
      <path d={`M${-depth / 2} ${-net}V${net}`} strokeWidth=".08" />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${-depth} ${-net + (goal * i) / 8}H0`}
          strokeWidth=".08"
        />
      ))}
      <path d={`M0 ${-net}V${net}`} strokeWidth=".27" />
    </>
  );
}
