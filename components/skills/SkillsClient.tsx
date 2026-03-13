'use client';

import { useState, useMemo } from 'react';
import type { Skill, TreeType } from '@/types';
import type { DbSkillRow, DbDependencyRow } from '@/lib/skillUtils';
import { buildDepsMap, dbRowToSkill, getSkillState } from '@/lib/skillUtils';
import { computeLayout, CANVAS_SIZE, TREE_CENTER } from '@/data/treeLayouts';
import TreeSwitcher     from './TreeSwitcher';
import TreeViewport     from './TreeViewport';
import RadialSkillTree  from './RadialSkillTree';
import UploadProofModal from './UploadProofModal';

interface SkillsClientProps {
  allSkills:        DbSkillRow[];
  allDeps:          DbDependencyRow[];
  unlockedSkillIds: string[];
}

export default function SkillsClient({
  allSkills,
  allDeps,
  unlockedSkillIds,
}: SkillsClientProps) {
  const [treeType,     setTreeType]     = useState<TreeType>('calisthenics');
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
      {/* Tree switcher */}
      <div className="flex justify-center">
        <TreeSwitcher value={treeType} onChange={setTreeType} />
      </div>

      {/* Pan / zoom viewport */}
      <TreeViewport
        canvasWidth={CANVAS_SIZE.width}
        canvasHeight={CANVAS_SIZE.height}
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
