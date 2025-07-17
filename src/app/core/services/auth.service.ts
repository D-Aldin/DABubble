import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, UserCredential, updatePassword as firebaseUpdatePassword } from '@angular/fire/auth';
import { BehaviorSubject, from, Observable } from 'rxjs';
import {
  getAuth,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
  User
} from 'firebase/auth';

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
      this.initializedSubject.next(true); //  only now we're sure
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

  get currentUserId(): string {
    return this.auth.currentUser?.uid || '';
  }


  signInAsGuest(): Observable<User> {
    const auth = getAuth();

    return from(
      setPersistence(auth, browserLocalPersistence) // ensures session survives browser restarts
        .then(() => signInAnonymously(auth))        // then do the anonymous sign-in
        .then(async userCredential => {
          const user = userCredential.user;
          const guestName = 'Guest' + Math.floor(1000 + Math.random() * 9000);

          try {
            await updateProfile(user, {
              displayName: guestName,
              photoURL: 'assets/images/register/default-profile-img.svg'
            });
            return user;
          } catch (error) {
            console.error('Failed to update guest profile:', error);
            return user; // Return the user even if updateProfile fails
          }
        })
    );
  }

  async loginWithGoogle(): Promise<UserCredential | null> {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result;
    } catch (error) {
      return null;
    }
  }

  requestPasswordReset(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  updatePassword(currentUser: User, newPassword: string): Promise<void> {
    return firebaseUpdatePassword(currentUser, newPassword);
  }
}
