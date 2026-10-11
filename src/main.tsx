import './shared/ui/styles/fonts.css';
import './shared/ui/styles/base.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ArcadeApp } from './app/ArcadeApp';
import { LAZULI_STORE, readLegacySound } from './games/lazuli-blocks/application/profile';
import type { ArcadeServices } from './shared/application/arcade';
import type { KeyValueStore } from './shared/application/ports';
import { createSettingsStore } from './shared/application/settings';
import { createWebAudio } from './shared/infrastructure/audio/webAudio';
import { createBrowserStore } from './shared/infrastructure/browserStore';
import { cryptoSeed } from './shared/infrastructure/seed';

/* Composition root: the only module that knows about concrete adapters. */
const stores = new Map<string, KeyValueStore>();
/** One store per namespace, so the in-memory fallback (private mode) is shared by every reader. */
const openStore = (namespace: string): KeyValueStore => {
  let store = stores.get(namespace);
  if (!store) {
    store = createBrowserStore(namespace);
    stores.set(namespace, store);
  }
  return store;
};

const settings = createSettingsStore(openStore('arcade:v1'), () => {
  // One-time migration: before the arcade existed, Lazuli Blocks kept its own sound toggle.
  const sound = readLegacySound(openStore(LAZULI_STORE));
  return sound === undefined ? {} : { sound };
});

const audio = createWebAudio();
audio.setEnabled(settings.get().sound);
settings.subscribe(() => {
  audio.setEnabled(settings.get().sound);
});

const services: ArcadeServices = { openStore, audio, seedSource: cryptoSeed, settings };

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <ArcadeApp services={services} />
  </StrictMode>,
);
