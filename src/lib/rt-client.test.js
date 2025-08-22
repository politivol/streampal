import { describe, it, expect } from 'vitest';
import { RottenTomatoesClient } from './rt-client.js';

describe('RottenTomatoesClient.parseScores', () => {
  it('prefers JSON scores over promotional HTML snippets', () => {
    const client = new RottenTomatoesClient();
    const html = `
      <div class="promo">tomatometer 93% | audience-score 93%</div>
      <script>{"tomatometer":88,"audienceScore":91}</script>
    `;
    const scores = client.parseScores(html, 'Test Movie');
    expect(scores.tomatometer).toBe(88);
    expect(scores.audience_score).toBe(91);
  });
});
