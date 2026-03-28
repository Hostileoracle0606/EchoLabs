import type { Tool } from '@google/genai';
import type { SkillDefinition } from './types';
import { chartSkill } from './chart.skill';
import { summarySkill } from './summary.skill';
import { referenceSkill } from './reference.skill';
import { contextSkill } from './context.skill';

/** All registered skills — single source of truth */
const SKILLS: SkillDefinition[] = [
  chartSkill,
  summarySkill,
  referenceSkill,
  contextSkill,
];

/** Fast lookup: skill name → SkillDefinition */
const SKILL_MAP = new Map<string, SkillDefinition>(
  SKILLS.map((s) => [s.name, s])
);

/**
 * Returns the tools array formatted for the @google/genai SDK.
 * Pass directly to generateContent({ config: { tools } }).
 */
export function getGeminiTools(): Tool[] {
  return [
    {
      functionDeclarations: SKILLS.map((skill) => ({
        name: skill.name,
        description: skill.description,
        parameters: skill.parameters,
      })),
    },
  ];
}

/** Look up a skill by its Gemini function name */
export function getSkill(name: string): SkillDefinition | undefined {
  return SKILL_MAP.get(name);
}

/** Get all registered skill names */
export function getAllSkillNames(): string[] {
  return SKILLS.map((s) => s.name);
}

/** Get all registered skill definitions */
export function getAllSkills(): SkillDefinition[] {
  return SKILLS;
}
