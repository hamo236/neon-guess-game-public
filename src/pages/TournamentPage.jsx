import React from 'react';
import CompetitiveModePage from './CompetitiveModePage.jsx';
import { CompetitiveModeProvider } from '../context/CompetitiveModeContext.jsx';
import { COMPETITIVE_MODES } from '../modes/modeTypes.js';

export default function TournamentPage() {
  return <CompetitiveModeProvider mode={COMPETITIVE_MODES.TOURNAMENT}><CompetitiveModePage mode={COMPETITIVE_MODES.TOURNAMENT} /></CompetitiveModeProvider>;
}
