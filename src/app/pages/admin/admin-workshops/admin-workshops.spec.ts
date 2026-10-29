import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWorkshops } from './admin-workshops';

describe('AdminWorkshops', () => {
  let component: AdminWorkshops;
  let fixture: ComponentFixture<AdminWorkshops>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkshops],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkshops);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
