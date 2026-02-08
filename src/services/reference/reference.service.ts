import { geminiGenerate } from '../gemini/gemini.client';
import { REFERENCE_SEARCH_PROMPT } from './prompts';
import type { AgentRequest, ReferenceAgentResponse, Source } from '@/types/agents';

export async function findReferences(request: AgentRequest): Promise<ReferenceAgentResponse> {
  const { intent } = request;
  const query = intent.excerpt;

  try {
    const response = await geminiGenerate({
      systemPrompt: REFERENCE_SEARCH_PROMPT,
      userPrompt: `Find the source for this reference: "${intent.excerpt}"\nContext: ${request.context}`,
      jsonMode: true,
    });

    const parsed = JSON.parse(response);

    if (parsed.title && parsed.url) {
      const source: Source = {
        title: parsed.title,
        url: parsed.url,
        snippet: parsed.snippet || '',
        confidence: parsed.confidence || 'unverified',
        domain: parsed.domain || extractDomain(parsed.url),
      };
      return { sources: [source], query };
    }

    // Handle array response (multiple sources)
    if (Array.isArray(parsed)) {
      const sources: Source[] = parsed
        .filter((s: Record<string, unknown>) => s.title && s.url)
        .map((s: Record<string, string>) => ({
          title: s.title,
          url: s.url,
          snippet: s.snippet || '',
          confidence: (s.confidence as Source['confidence']) || 'unverified',
          domain: s.domain || extractDomain(s.url),
        }));
      return { sources, query };
    }

    return { sources: [], query };
  } catch {
    return { sources: [], query };
  }
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
