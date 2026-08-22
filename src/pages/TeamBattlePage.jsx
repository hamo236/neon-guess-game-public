import React from 'react';
import CompetitiveModePage from './CompetitiveModePage.jsx';
import { CompetitiveModeProvider } from '../context/CompetitiveModeContext.jsx';
import { COMPETITIVE_MODES } from '../modes/modeTypes.js';

export default function TeamBattlePage() {
  return (
    <CompetitiveModeProvider mode={COMPETITIVE_MODES.TEAM_BATTLE}>
      <CompetitiveModePage mode={COMPETITIVE_MODES.TEAM_BATTLE} />
    </CompetitiveModeProvider>
  );
}

