import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThreadMessagingService {
  private threadStateSubject = new BehaviorSubject<{ 
    messageId: string; 
    channelId: string; 
    threadType: 'channel' | 'direct'; 
  } | null>(null);
   public threadState$ = this.threadStateSubject.asObservable();


  openThread(channelId: string, messageId: string, threadType: 'channel' | 'direct') {
    this.threadStateSubject.next({ messageId, channelId, threadType });
  }


  closeThread() {
    this.threadStateSubject.next(null);
  }

  getCurrentThread() {
    return this.threadStateSubject.getValue();
  }

}

