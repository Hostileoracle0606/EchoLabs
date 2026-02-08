import type { ClassifiedIntent } from '@/types/intents';
import { INTENT_PRIORITY } from '@/types/intents';

export function scorePriorities(intents: ClassifiedIntent[]): ClassifiedIntent[] {
  return intents
    .map((intent) => ({
      ...intent,
      priority: INTENT_PRIORITY[intent.type] ?? 1,
    }))
    .sort((a, b) => b.priority - a.priority);
}
