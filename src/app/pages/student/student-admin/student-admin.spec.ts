import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAdmin } from './student-admin';

describe('StudentAdmin', () => {
  let component: StudentAdmin;
  let fixture: ComponentFixture<StudentAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
