'use client';

import { useState } from 'react';
import type { Skill, SkillCategory } from '@/types';
import { getSkillState, getOrderedTrackSkills } from '@/lib/skillUtils';
import { SKILLS } from '@/data/mockData';
import SkillTrack from './SkillTrack';
import UploadProofModal from './UploadProofModal';

interface SkillTreeProps {
  unlockedSkillIds: string[];
}

const TRACKS: { category: SkillCategory }[] = [
  { category: 'pull' },
  { category: 'push' },
  { category: 'lever' },
];

export default function SkillTree({ unlockedSkillIds }: SkillTreeProps) {
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);

  const handleSkillClick = (skill: Skill) => {
    const state = getSkillState(skill, unlockedSkillIds);
    if (state === 'available') {
      setPendingSkill(skill);
    }
  };

  return (
    <>
      <div className="space-y-10">
        {TRACKS.map(({ category }) => (
          <SkillTrack
            key={category}
            category={category}
            skills={getOrderedTrackSkills(SKILLS, category)}
            getState={(skill) => getSkillState(skill, unlockedSkillIds)}
            onSkillClick={handleSkillClick}
          />
        ))}
      </div>

      {pendingSkill && (
        <UploadProofModal
          skill={pendingSkill}
          onClose={() => setPendingSkill(null)}
        />
      )}
    </>
  );
}
