import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Ilustração decorativa vetorial da tela principal. */
export function HomeArtwork() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 180 150" aria-hidden>
      <Defs>
        <LinearGradient id="paperGlow" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f1f5f7" />
          <Stop offset="1" stopColor="#eaf0f3" />
        </LinearGradient>
        <LinearGradient id="board" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#345e7b" />
          <Stop offset="1" stopColor="#082b47" />
        </LinearGradient>
        <LinearGradient id="clip" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ff820e" />
          <Stop offset="1" stopColor="#f45200" />
        </LinearGradient>
      </Defs>
      <Path
        d="M42 36C57 1 100-1 131 9s43 31 27 57c-11 17-13 32 6 48 24 25-44 34-95 28S1 124 12 99s21-41 30-63Z"
        fill="url(#paperGlow)"
      />
      <Ellipse cx="98" cy="143" rx="65" ry="6" fill="#dfe9ee" />
      <G transform="rotate(7 99 84)">
        <Rect
          x="57"
          y="33"
          width="87"
          height="107"
          rx="9"
          fill="#092b44"
          opacity="0.12"
          transform="translate(2 3)"
        />
        <Rect x="55" y="31" width="87" height="107" rx="9" fill="url(#board)" />
        <Rect x="60" y="36" width="77" height="97" rx="5" fill="#fffefd" />
        <Path
          d="M78 38V27q0-4 4-4h9v-3a8 8 0 0 1 16 0v3h10q4 0 4 4v11Z"
          fill="url(#clip)"
          stroke="#e95100"
          strokeWidth="0.7"
        />
        {[55, 79, 103].map((y) => (
          <G key={y}>
            <Rect x="70" y={y} width="17" height="18" rx="3" fill="#ffe8d5" />
            <Path
              d={`m74 ${y + 8} 4 4 7-8`}
              stroke="#fa6107"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={`M94 ${y + 5}h29M94 ${y + 12}h24`}
              stroke="#c7d7e1"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </G>
        ))}
      </G>
      <Path
        d="m34 36 5 7m10-11-1 8m-21 9 8 3"
        stroke="#ff730a"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CardWave({ color, layered = false }: { color: string; layered?: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 65" preserveAspectRatio="none" aria-hidden>
      <Path d="M0 65c80 0 123-12 154-33S210 1 240 0v65Z" fill={color} />
      {layered && <Path d="M90 65c70-5 95-42 150-42v42Z" fill="#ffe1c5" opacity={0.5} />}
    </Svg>
  );
}
