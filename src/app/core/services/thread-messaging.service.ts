import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThreadMessagingService {
  private threadStateSubject = new BehaviorSubject<{ messageId: string; channelId: string } | null>(null);
  threadState$ = this.threadStateSubject.asObservable();

  openThread(channelId: string, messageId: string) {
    this.threadStateSubject.next({ messageId, channelId });
  }

  closeThread() {
    this.threadStateSubject.next(null);
  }
}

