import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChatstudent } from './admin-chatstudent';

describe('AdminChatstudent', () => {
  let component: AdminChatstudent;
  let fixture: ComponentFixture<AdminChatstudent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminChatstudent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminChatstudent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
