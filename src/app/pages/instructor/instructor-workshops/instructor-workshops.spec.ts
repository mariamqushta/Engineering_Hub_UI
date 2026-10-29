import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorWorkshops } from './instructor-workshops';

describe('InstructorWorkshops', () => {
  let component: InstructorWorkshops;
  let fixture: ComponentFixture<InstructorWorkshops>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorWorkshops],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorWorkshops);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
