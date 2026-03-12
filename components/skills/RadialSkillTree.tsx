import type { Skill, SkillState } from '@/types';
import type { TreeLayout, NodePosition } from '@/data/treeLayouts';
import { buildConnections } from '@/lib/skillUtils';
import TreeConnections from './TreeConnections';
import SkillNode from './SkillNode';

interface RadialSkillTreeProps {
  skills:       Skill[];
  layout:       TreeLayout;
  canvasWidth:  number;
  canvasHeight: number;
  center:       NodePosition;
  unlockedIds:  string[];
  getState:     (skill: Skill) => SkillState;
  onSkillClick: (skill: Skill) => void;
}

export default function RadialSkillTree({
  skills,
  layout,
  canvasWidth,
  canvasHeight,
  center,
  unlockedIds,
  getState,
  onSkillClick,
}: RadialSkillTreeProps) {
  // Compute connections from skill graph + layout positions.
  // This is pure data — no DOM interaction.
  const connections = buildConnections(skills, layout, unlockedIds);

  return (
    <div
      className="relative"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* Ambient radial glow radiating from tree center */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${center.x}px ${center.y}px,
            rgba(34,211,238,0.06) 0%,
            rgba(129,140,248,0.03) 35%,
            transparent 65%)`,
        }}
      />

      {/* ── Layer 0: SVG connection lines ──────────────────────────── */}
      <TreeConnections
        connections={connections}
        center={center}
        width={canvasWidth}
        height={canvasHeight}
      />

      {/* ── Layer 1: Center anchor dot ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/50 shadow-[0_0_14px_rgba(34,211,238,0.9)]"
        style={{ left: center.x, top: center.y }}
      />

      {/* ── Layer 2: Skill nodes ────────────────────────────────────── */}
      {skills.map((skill) => {
        const pos = layout[skill.id];
        if (!pos) return null;
        const state = getState(skill);

        return (
          <div
            key={skill.id}
            className="absolute z-10"
            style={{
              left:      pos.x,
              top:       pos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <SkillNode
              skill={skill}
              state={state}
              onClick={
                state === 'available' ? () => onSkillClick(skill) : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
