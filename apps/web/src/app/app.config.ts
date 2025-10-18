import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import {
  provideQueryClient,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBzKDUlINd0G1zF5RicvS4Pj7NjNOwBsVs',
  authDomain: 'project-suggestion.firebaseapp.com',
  projectId: 'project-suggestion',
  storageBucket: 'project-suggestion.firebasestorage.app',
  messagingSenderId: '210593912815',
  appId: '1:210593912815:web:39c07fa5b66783c146c81a',
  measurementId: 'G-2T5K1F05KF',
};

const queryClient = new QueryClient({});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideQueryClient(queryClient),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFunctions(() => {
      const fns = getFunctions();
      if (
        typeof location !== 'undefined' &&
        location.hostname === 'localhost'
      ) {
        console.log(
          'Connecting to Firebase Functions emulator on localhost:5001',
        );
        connectFunctionsEmulator(fns, 'localhost', 5001);
      } else {
        console.log('Using production Firebase Functions');
      }
      return fns;
    }),
  ],
};
