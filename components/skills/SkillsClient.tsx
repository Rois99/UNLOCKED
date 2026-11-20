'use client';

import { useState, useMemo } from 'react';
import type { Skill, TreeType } from '@/types';
import type { DbSkillRow, DbDependencyRow } from '@/lib/skillUtils';
import { buildDepsMap, dbRowToSkill, getSkillState } from '@/lib/skillUtils';
import { computeLayout, CANVAS_SIZE, TREE_CENTER } from '@/data/treeLayouts';
import TreeViewport     from './TreeViewport';
import RadialSkillTree  from './RadialSkillTree';
import UploadProofModal from './UploadProofModal';

interface SkillsClientProps {
  allSkills:        DbSkillRow[];
  allDeps:          DbDependencyRow[];
  unlockedSkillIds: string[];
  labels:           { dragHint: string; or: string };
}

export default function SkillsClient({
  allSkills,
  allDeps,
  unlockedSkillIds,
  labels,
}: SkillsClientProps) {
  // Pilot scope is calisthenics only; the gym tree stays in the data but is
  // not shown. Re-enable by restoring <TreeSwitcher> (components/skills/TreeSwitcher.tsx).
  const treeType: TreeType = 'calisthenics';
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);

  // Build the deps map once — shared across both tree types
  const depsMap = useMemo(() => buildDepsMap(allDeps), [allDeps]);

  // Filter to the active tree, convert DB rows → Skill domain objects
  const treeSkills = useMemo(
    () =>
      allSkills
        .filter((s) => s.tree_type === treeType)
        .map((s) => dbRowToSkill(s, depsMap)),
    [allSkills, treeType, depsMap],
  );

  // Dynamically compute positions from the live skill graph — no hardcoded coords
  const layout = useMemo(
    () => computeLayout(
      allSkills.filter((s) => s.tree_type === treeType),
      allDeps,
    ),
    [allSkills, allDeps, treeType],
  );

  return (
    <>
      {/* Pan / zoom viewport */}
      <TreeViewport
        canvasWidth={CANVAS_SIZE.width}
        canvasHeight={CANVAS_SIZE.height}
        hint={labels.dragHint}
      >
        <RadialSkillTree
          skills={treeSkills}
          layout={layout}
          canvasWidth={CANVAS_SIZE.width}
          canvasHeight={CANVAS_SIZE.height}
          center={TREE_CENTER}
          unlockedIds={unlockedSkillIds}
          getState={(skill) => getSkillState(skill, unlockedSkillIds)}
          onSkillClick={setPendingSkill}
          orLabel={labels.or}
        />
      </TreeViewport>

      {/* Upload proof modal */}
      {pendingSkill && (
        <UploadProofModal
          skill={pendingSkill}
          onClose={() => setPendingSkill(null)}
        />
      )}
    </>
  );
}
