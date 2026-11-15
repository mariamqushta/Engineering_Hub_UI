import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorAdmin } from './instructor-admin';

describe('InstructorAdmin', () => {
  let component: InstructorAdmin;
  let fixture: ComponentFixture<InstructorAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
