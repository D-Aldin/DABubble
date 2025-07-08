import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../app.config';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private firebaseApp;

  constructor() {
    this.firebaseApp = initializeApp(firebaseConfig);
  }

  getApp() {
    return this.firebaseApp;
  }
}
