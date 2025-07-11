import { TestBed } from '@angular/core/testing';

import { DirectMessagingService } from './direct-messaging.service';

describe('DirectMessagingService', () => {
  let service: DirectMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
