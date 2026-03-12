import type { SkillConnection } from '@/lib/skillUtils';
import { buildSvgPath } from '@/lib/skillUtils';
import type { NodePosition } from '@/data/treeLayouts';

interface TreeConnectionsProps {
  connections: SkillConnection[];
  center: NodePosition;
  width: number;
  height: number;
}

/**
 * Renders SVG lines behind skill nodes.
 * Sits at z-index 0; nodes sit at z-index 10 above it.
 */
export default function TreeConnections({
  connections,
  center,
  width,
  height,
}: TreeConnectionsProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <defs>
        {/* Emerald glow — unlocked paths */}
        <filter id="tc-emerald-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Cyan glow — available paths */}
        <filter id="tc-cyan-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map((conn, i) => {
        const d = buildSvgPath(conn.from, conn.to, center);
        if (!d) return null;

        if (conn.style === 'unlocked') {
          return (
            <g key={i}>
              {/* Wide soft halo */}
              <path
                d={d}
                stroke="#34d399"
                strokeWidth={8}
                opacity={0.15}
                fill="none"
                filter="url(#tc-emerald-glow)"
              />
              {/* Crisp main line */}
              <path
                d={d}
                stroke="#34d399"
                strokeWidth={2}
                opacity={0.8}
                fill="none"
              />
            </g>
          );
        }

        if (conn.style === 'available') {
          return (
            <g key={i}>
              <path
                d={d}
                stroke="#22d3ee"
                strokeWidth={1.5}
                opacity={0.35}
                fill="none"
                strokeDasharray="7 5"
                filter="url(#tc-cyan-glow)"
              />
            </g>
          );
        }

        // locked
        return (
          <g key={i}>
            <path
              d={d}
              stroke="#1e293b"
              strokeWidth={1.5}
              opacity={0.55}
              fill="none"
            />
          </g>
        );
      })}
    </svg>
  );
}
