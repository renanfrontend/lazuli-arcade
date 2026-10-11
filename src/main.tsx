import './ui/styles/fonts.css';
import './ui/styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { AppServices } from './application/ports';
import { createBrowserStore } from './infrastructure/browserStore';
import { cryptoSeed } from './infrastructure/seed';
import { createWebAudioFeedback } from './infrastructure/webAudioFeedback';
import { App } from './ui/App';

/* Composition root: the only place that knows about concrete adapters. */
const services: AppServices = {
  store: createBrowserStore('lazuli-blocks:v1'),
  feedback: createWebAudioFeedback(),
  seedSource: cryptoSeed,
};

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
);
