import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPrivateSessions } from './admin-private-sessions';

describe('AdminPrivateSessions', () => {
  let component: AdminPrivateSessions;
  let fixture: ComponentFixture<AdminPrivateSessions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPrivateSessions],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPrivateSessions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
