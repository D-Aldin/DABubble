import { TestBed } from '@angular/core/testing';

import { OpenProfileCardService } from './open-profile-card.service';

describe('OpenProfileCardService', () => {
  let service: OpenProfileCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenProfileCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
