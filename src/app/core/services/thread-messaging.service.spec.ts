import { TestBed } from '@angular/core/testing';

import { ThreadMessagingService } from './thread-messaging.service';

describe('ThreadMessagingService', () => {
  let service: ThreadMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreadMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
