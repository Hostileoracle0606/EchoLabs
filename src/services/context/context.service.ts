import mockData from '@/data/mock-context.json';
import type { AgentRequest, ContextAgentResponse, ContextMatch } from '@/types/agents';

interface MockEntry {
  id: string;
  keywords: string[];
  [key: string]: unknown;
}

const MIN_SCORE_THRESHOLD = 0.3;
const MAX_RESULTS = 3;

export function findContextMatches(request: AgentRequest): ContextAgentResponse {
  const { intent } = request;
  const searchText = intent.excerpt.toLowerCase();
  const searchWords = searchText.split(/\s+/).filter((w) => w.length > 2);

  const allMatches: ContextMatch[] = [];

  // Search emails
  for (const email of mockData.emails) {
    const score = scoreMatch(searchWords, email as MockEntry);
    if (score >= MIN_SCORE_THRESHOLD) {
      allMatches.push({
        id: email.id,
        matchType: 'email',
        title: email.subject,
        preview: email.preview,
        from: email.from,
        date: email.date,
        avatarColor: email.avatarColor,
        relevanceScore: score,
      });
    }
  }

  // Search documents
  for (const doc of mockData.documents) {
    const score = scoreMatch(searchWords, doc as MockEntry);
    if (score >= MIN_SCORE_THRESHOLD) {
      allMatches.push({
        id: doc.id,
        matchType: 'doc',
        title: doc.title,
        preview: doc.preview,
        date: doc.modified,
        fileType: doc.fileType,
        relevanceScore: score,
      });
    }
  }

  // Search calendar
  for (const cal of mockData.calendar) {
    const score = scoreMatch(searchWords, cal as MockEntry);
    if (score >= MIN_SCORE_THRESHOLD) {
      allMatches.push({
        id: cal.id,
        matchType: 'calendar',
        title: cal.title,
        preview: `${cal.time} — ${cal.attendees.join(', ')}`,
        date: cal.date,
        relevanceScore: score,
      });
    }
  }

  // Search Slack
  for (const slack of mockData.slack) {
    const score = scoreMatch(searchWords, slack as MockEntry);
    if (score >= MIN_SCORE_THRESHOLD) {
      allMatches.push({
        id: slack.id,
        matchType: 'slack',
        title: `${slack.channel} — ${slack.from}`,
        preview: slack.message,
        channel: slack.channel,
        from: slack.from,
        date: slack.time,
        relevanceScore: score,
      });
    }
  }

  // Sort by relevance and take top N
  allMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return { matches: allMatches.slice(0, MAX_RESULTS) };
}

function scoreMatch(searchWords: string[], entry: MockEntry): number {
  const entryKeywords = entry.keywords.map((k) => k.toLowerCase());

  // Also check other text fields
  const allText = Object.values(entry)
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
    .toLowerCase();

  let matchCount = 0;

  for (const word of searchWords) {
    if (entryKeywords.some((k) => k.includes(word) || word.includes(k))) {
      matchCount += 2; // Keyword match is worth more
    } else if (allText.includes(word)) {
      matchCount += 1; // General text match
    }
  }

  return searchWords.length > 0 ? matchCount / (searchWords.length * 2) : 0;
}
