import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThreadMessagingService {
  private threadMessageIdSubject = new BehaviorSubject<string | null>(null);
  public threadMessageId$ = this.threadMessageIdSubject.asObservable();

  openThread(messageId: string) {
    this.threadMessageIdSubject.next(messageId);
  }

  closeThread() {
    this.threadMessageIdSubject.next(null);
  }
}
