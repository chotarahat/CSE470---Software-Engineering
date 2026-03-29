/**
 * Crisis Detector — Automated Crisis Trigger
 *
 * Scans a ticket's description and priority for crisis signals.
 * Returns { isCrisis, triggeredKeywords, severityScore }
 *
 * Severity scoring:
 *   Each matched keyword adds its weight to the score.
 *   Score >= 2  → isCrisis = true
 *   Priority 'urgent' alone → isCrisis = true (regardless of score)
 */

// Keywords grouped by severity weight
// Weight 3 = immediate danger, Weight 2 = strong indicator, Weight 1 = possible indicator
const CRISIS_KEYWORDS = [
  // Weight 3 — direct expressions of suicidal/self-harm intent
  { phrase: 'kill myself',        weight: 3 },
  { phrase: 'end my life',        weight: 3 },
  { phrase: 'want to die',        weight: 3 },
  { phrase: 'going to die',       weight: 3 },
  { phrase: 'suicide',            weight: 3 },
  { phrase: 'suicidal',           weight: 3 },
  { phrase: 'self harm',          weight: 3 },
  { phrase: 'self-harm',          weight: 3 },
  { phrase: 'cut myself',         weight: 3 },
  { phrase: 'hurt myself',        weight: 3 },
  { phrase: 'take my own life',   weight: 3 },
  { phrase: 'not want to live',   weight: 3 },
  { phrase: 'no reason to live',  weight: 3 },
  { phrase: 'overdose',           weight: 3 },

  // Weight 2 — strong distress indicators
  { phrase: 'hopeless',           weight: 2 },
  { phrase: 'helpless',           weight: 2 },
  { phrase: 'worthless',          weight: 2 },
  { phrase: 'can\'t go on',       weight: 2 },
  { phrase: 'cannot go on',       weight: 2 },
  { phrase: 'give up',            weight: 2 },
  { phrase: 'no way out',         weight: 2 },
  { phrase: 'end it all',         weight: 2 },
  { phrase: 'better off dead',    weight: 2 },
  { phrase: 'disappear forever',  weight: 2 },
  { phrase: 'nobody cares',       weight: 2 },
  { phrase: 'severe anxiety',     weight: 2 },
  { phrase: 'panic attack',       weight: 2 },
  { phrase: 'breaking down',      weight: 2 },

  // Weight 1 — general distress
  { phrase: 'can\'t cope',        weight: 1 },
  { phrase: 'cannot cope',        weight: 1 },
  { phrase: 'falling apart',      weight: 1 },
  { phrase: 'desperate',          weight: 1 },
  { phrase: 'crisis',             weight: 1 },
  { phrase: 'emergency',          weight: 1 },
  { phrase: 'abuse',              weight: 1 },
  { phrase: 'harassment',         weight: 1 },
];

const CRISIS_SCORE_THRESHOLD = 2;

/**
 * Analyzes text and priority for crisis signals.
 * @param {string} description - The ticket description text
 * @param {string} priority    - The ticket priority ('low'|'medium'|'high'|'urgent')
 * @returns {{ isCrisis: boolean, triggeredKeywords: string[], severityScore: number }}
 */
const detectCrisis = (description, priority) => {
  const text = (description || '').toLowerCase();

  let severityScore = 0;
  const triggeredKeywords = [];

  for (const { phrase, weight } of CRISIS_KEYWORDS) {
    if (text.includes(phrase)) {
      severityScore += weight;
      triggeredKeywords.push(phrase);
    }
  }

  // Urgent priority alone is always a crisis
  const urgentPriority = priority === 'urgent';

  const isCrisis = severityScore >= CRISIS_SCORE_THRESHOLD || urgentPriority;

  return { isCrisis, triggeredKeywords, severityScore };
};

module.exports = { detectCrisis };