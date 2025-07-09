import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessToastComponent } from './success-toast.component';

describe('SuccessToastComponent', () => {
  let component: SuccessToastComponent;
  let fixture: ComponentFixture<SuccessToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessToastComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SuccessToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
