import { TestBed } from '@angular/core/testing';

import { ProfileOverlayService } from './profile-overlay.service';

describe('ProfileOverlayService', () => {
  let service: ProfileOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileOverlayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
