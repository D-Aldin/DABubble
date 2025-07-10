import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyD168Ov3OPIuwF4NX-8K-tilgOrNwntkuE',
  authDomain: 'dabubble-64746.firebaseapp.com',
  projectId: 'dabubble-64746',
  storageBucket: 'dabubble-64746.appspot.com',
  messagingSenderId: '944811862636',
  appId: '1:944811862636:web:432e48e014e312351c8649',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'dabubble-64746',
        appId: '1:944811862636:web:432e48e014e312351c8649',
        storageBucket: 'dabubble-64746.firebasestorage.app',
        apiKey: 'AIzaSyD168Ov3OPIuwF4NX-8K-tilgOrNwntkuE',
        authDomain: 'dabubble-64746.firebaseapp.com',
        messagingSenderId: '944811862636',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
