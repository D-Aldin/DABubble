import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelMessageInputComponent } from './channel-message-input.component';

describe('ChannelMessageInputComponent', () => {
  let component: ChannelMessageInputComponent;
  let fixture: ComponentFixture<ChannelMessageInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelMessageInputComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelMessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
