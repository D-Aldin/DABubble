import { TestBed } from '@angular/core/testing';

import { MentioningService } from './mentioning.service';

describe('MentioningService', () => {
  let service: MentioningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MentioningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
