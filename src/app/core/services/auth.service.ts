import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, User, UserCredential } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private userSubject = new BehaviorSubject<User | null>(null)
  private initializedSubject = new BehaviorSubject<boolean>(false);
  public loggedOutManually = false;

  initialized$ = this.initializedSubject.asObservable();
  user$ = this.userSubject.asObservable(); // Observable for use in components

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      this.initializedSubject.next(true); // ✅ only now we're sure
    });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    this.loggedOutManually = true;
    return signOut(this.auth);
  }

  getCurrentUser() {
    return this.userSubject.value;
  }

  async loginWithGoogle(): Promise<UserCredential | null> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      // ✅ Benutzer ist jetzt in Firebase Authentication eingetragen
      console.log('Angemeldeter Nutzer:', result.user);
      return result;
    } catch (error) {
      console.error('Google-Anmeldung fehlgeschlagen:', error);
      return null;
    }
  }
}
