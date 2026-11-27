import type { DiagramObjectKind, PlayerShape } from "../lib/diagram-data";

export const equipmentNames: Record<DiagramObjectKind, string> = {
  player: "Player",
  goalkeeper: "Goalkeeper",
  "neutral-player": "Neutral player",
  ball: "Soccer ball",
  cone: "Tall cone",
  "flat-cone": "Flat cone",
  disc: "Marker disc",
  pole: "Training pole",
  flag: "Corner flag",
  goal: "Full-size goal",
  "mini-goal": "Mini goal",
  mannequin: "Training mannequin",
  ladder: "Agility ladder",
  hurdle: "Hurdle",
  coach: "Coach",
  text: "Text",
};

export const equipmentGroups = [
  {
    name: "Players",
    kinds: ["player", "goalkeeper", "neutral-player", "coach"],
  },
  { name: "Balls", kinds: ["ball"] },
  { name: "Markers", kinds: ["cone", "flat-cone", "disc", "pole", "flag"] },
  { name: "Goals", kinds: ["goal", "mini-goal"] },
  { name: "Training Equipment", kinds: ["mannequin", "ladder", "hurdle"] },
] as const;

export function isPlayer(kind: DiagramObjectKind) {
  return (
    kind === "player" || kind === "goalkeeper" || kind === "neutral-player"
  );
}

export function EquipmentGraphic({
  kind,
  color,
  label = "",
  playerShape,
}: {
  kind: DiagramObjectKind;
  color: string;
  label?: string;
  playerShape?: PlayerShape;
}) {
  const ink = "#15252e";
  const white = "#f8fafc";
  const jersey =
    "M-8 -17L-19 -12 -23 -1 -15 4 -11 -2 -11 17Q0 20 11 17V-2L15 4 23 -1 19 -12 8 -17Q0 -11 -8 -17Z";
  let graphic;
  switch (kind) {
    case "player":
    case "goalkeeper":
    case "neutral-player":
      graphic = (
        <>
          {playerShape === "x" ? (
            <path
              d="M-13 -13L13 13M13 -13L-13 13"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
            />
          ) : playerShape === "triangle" ? (
            <path d="M0 -20L20 16H-20Z" fill={color} />
          ) : playerShape === "circle" ? (
            <circle r="18" fill={color} />
          ) : (
            <>
              <path d={jersey} fill={color} />
              <path
                d="M-11 7Q0 15 11 7V17Q0 20 -11 17Z"
                fill={ink}
                opacity=".23"
                stroke="none"
              />
              <path
                d="M-8 -16Q0 -9 8 -16M-21 -4L-15 0M21 -4L15 0"
                fill="none"
                stroke={white}
                strokeOpacity=".7"
              />
              {kind === "goalkeeper" && (
                <path d="M-24 3l5 2-2 5-5-2zM24 3l-5 2 2 5 5-2z" fill={white} />
              )}
            </>
          )}
          <text
            y="2"
            textAnchor="middle"
            dominantBaseline="central"
            fill={white}
            stroke={ink}
            strokeWidth="2.3"
            paintOrder="stroke"
            fontSize="13"
            fontWeight="800"
          >
            {label.slice(0, 3) ||
              (kind === "goalkeeper"
                ? "GK"
                : kind === "neutral-player"
                  ? "N"
                  : "")}
          </text>
        </>
      );
      break;
    case "ball":
      graphic = (
        <>
          <circle r="13" fill={color} />
          <path
            d="M0 -5L5 -1 3 5H-3L-5 -1ZM-4 -12L0 -9 4 -12M-13 -2L-9 1 -11 7M13 -2L9 1 11 7M-5 12L0 9 5 12"
            fill={ink}
          />
          <path
            d="M0 -9V-5M-9 1L-5 -1M9 1L5 -1M-3 5L0 9 3 5"
            fill="none"
            strokeWidth=".7"
          />
          <path
            d="M-8 -6Q-6 -10 -2 -11"
            fill="none"
            stroke={white}
            strokeOpacity=".8"
          />
        </>
      );
      break;
    case "cone":
    case "flat-cone": {
      const tall = kind === "cone";
      graphic = (
        <>
          <ellipse cy="11" rx={tall ? 17 : 20} ry="5" fill={color} />
          <path
            d={
              tall
                ? "M-11 10L-3 -17Q0 -20 3 -17L11 10Q0 15 -11 10Z"
                : "M-16 10L-7 1Q0 -2 7 1L16 10Q0 15 -16 10Z"
            }
            fill={color}
          />
          {tall ? (
            <path
              d="M-7 -1Q0 2 7 -1L8 3Q0 6 -8 3Z"
              fill={white}
              stroke="none"
            />
          ) : (
            <ellipse cy="2" rx="4" ry="1.7" fill={ink} stroke="none" />
          )}
        </>
      );
      break;
    }
    case "disc":
      graphic = (
        <>
          <ellipse cy="5" rx="16" ry="8" fill={ink} />
          <ellipse cy="2" rx="16" ry="8" fill={color} />
          <ellipse
            cy="2"
            rx="10"
            ry="4"
            fill="none"
            stroke={white}
            strokeOpacity=".6"
          />
        </>
      );
      break;
    case "pole":
    case "flag":
      graphic = (
        <>
          <ellipse cy="19" rx="9" ry="3" fill={ink} />
          <path
            d="M0 18V-22"
            stroke={kind === "flag" ? white : color}
            strokeWidth="3"
          />
          {kind === "flag" ? (
            <path d="M1 -21L20 -17 1 -8Z" fill={color} />
          ) : (
            <path d="M0 10V4M0 -8V-13" stroke={white} strokeWidth="3" />
          )}
        </>
      );
      break;
    case "goal":
    case "mini-goal": {
      const frame =
        kind === "goal" ? "M-24 12V-10H19V12" : "M-17 12V-8Q0 -13 15 -8V12";
      graphic = (
        <g transform={kind === "goal" ? undefined : "scale(.82)"}>
          <path
            d="M-24 -10L-18 -16H25V6L19 12H-24Z"
            fill="#28434a"
            fillOpacity=".75"
            stroke={color}
          />
          <path
            d="M-16 -16V12M-8 -16V12M0 -16V12M8 -16V12M16 -16V12M24 -16V6M-24 -4H25M-24 2H25M-24 8H23"
            stroke={white}
            strokeOpacity=".52"
            strokeWidth=".75"
          />
          <path d={frame} fill="none" stroke={color} strokeWidth="3" />
        </g>
      );
      if (kind === "mini-goal")
        graphic = (
          <g transform="scale(.8)">
            <path
              d="M-17 12V-8L-12 -13H19V7L15 12Z"
              fill="#28434a"
              stroke={color}
            />
            <path
              d="M-11 -12V12M-4 -12V12M3 -12V12M10 -12V12M-17 -2H19M-17 5H19"
              stroke={white}
              strokeWidth=".75"
              opacity=".6"
            />
            <path d={frame} fill="none" stroke={color} strokeWidth="3" />
          </g>
        );
      break;
    }
    case "mannequin":
      graphic = (
        <>
          <path
            d="M-7 22H7M-4 22V10M4 22V10"
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          <circle cy="-17" r="5.5" fill={color} />
          <path d="M-11 12V-3Q-11 -11 0 -11T11 -3V12Z" fill={color} />
          <path
            d="M-6 -3H6M-7 2H7M-7 7H7M-3 -6V10M3 -6V10"
            stroke={ink}
            strokeOpacity=".55"
          />
        </>
      );
      break;
    case "ladder":
      graphic = (
        <g fill="none" strokeLinecap="round">
          <path d="M-24 -8H24M-24 8H24" stroke={ink} strokeWidth="4" />
          <path
            d="M-22 -8V8M-11 -8V8M0 -8V8M11 -8V8M22 -8V8"
            stroke={color}
            strokeWidth="3"
          />
        </g>
      );
      break;
    case "hurdle":
      graphic = (
        <>
          <path d="M-23 14H-10M10 14H23" stroke={ink} strokeWidth="4" />
          <path
            d="M-18 13L-13 -9H13L18 13"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M-10 -10H10" stroke={white} strokeOpacity=".55" />
        </>
      );
      break;
    case "coach":
      graphic = (
        <>
          <path d="M-15 17V6Q-15 -2 0 -2T15 6V17Z" fill={color} />
          <circle cy="-10" r="7" fill="#dab49c" />
          <path d="M-7 -11Q-7 -22 4 -17L10 -12Z" fill={color} />
          <path d="M-6 1L0 6 6 1" fill="none" stroke={white} />
          <rect x="2" y="6" width="9" height="12" rx="2" fill="#ddb779" />
          <path d="M4 9H9M4 12H9" strokeWidth=".8" />
        </>
      );
      break;
    case "text":
      return (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          stroke={ink}
          strokeWidth="2"
          paintOrder="stroke"
          fontSize="29"
          fontWeight="700"
        >
          {label || "Label"}
        </text>
      );
  }

  return (
    <g stroke={ink} strokeWidth="1.4" strokeLinejoin="round">
      <ellipse
        cy="17"
        rx="13"
        ry="4"
        fill="#081d15"
        opacity=".26"
        stroke="none"
      />
      {graphic}
    </g>
  );
}
