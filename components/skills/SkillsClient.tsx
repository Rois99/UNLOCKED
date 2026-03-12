'use client';

import { useState } from 'react';
import type { Skill, TreeType } from '@/types';
import { SKILLS, MOCK_USER } from '@/data/mockData';
import {
  CALISTHENICS_LAYOUT,
  GYM_LAYOUT,
  CANVAS_SIZE,
  TREE_CENTER,
} from '@/data/treeLayouts';
import { getSkillState } from '@/lib/skillUtils';
import TreeSwitcher     from './TreeSwitcher';
import TreeViewport     from './TreeViewport';
import RadialSkillTree  from './RadialSkillTree';
import UploadProofModal from './UploadProofModal';

export default function SkillsClient() {
  const [treeType,    setTreeType]    = useState<TreeType>('calisthenics');
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);

  const treeSkills = SKILLS.filter((s) => s.treeType === treeType);
  const layout     = treeType === 'calisthenics' ? CALISTHENICS_LAYOUT : GYM_LAYOUT;

  return (
    <>
      {/* Switcher */}
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
          unlockedIds={MOCK_USER.unlockedSkillIds}
          getState={(skill) => getSkillState(skill, MOCK_USER.unlockedSkillIds)}
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
