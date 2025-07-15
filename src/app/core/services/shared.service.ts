import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private data$ = new BehaviorSubject<any>(null);
  sharedData$ = this.data$.asObservable();

  setData(value: any) {
    this.data$.next(value);
  }

  getData() {
    return this.data$.value;
  }
}
