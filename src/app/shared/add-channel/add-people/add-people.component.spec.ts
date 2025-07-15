import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPeopleComponent } from './add-people.component';

describe('AddPeopleComponent', () => {
  let component: AddPeopleComponent;
  let fixture: ComponentFixture<AddPeopleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPeopleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddPeopleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
