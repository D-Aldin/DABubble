import { TestBed } from '@angular/core/testing';

import { ChannelMessagingService } from './channel-messaging.service';

describe('ChannelMessagingService', () => {
  let service: ChannelMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChannelMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
