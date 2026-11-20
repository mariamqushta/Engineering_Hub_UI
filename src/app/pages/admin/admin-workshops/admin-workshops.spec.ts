import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// import '../../../test-setup';
import { AdminWorkshops } from './admin-workshops';

describe('AdminWorkshops', () => {
  let component: AdminWorkshops;
  let fixture: ComponentFixture<AdminWorkshops>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkshops],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkshops);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(request => request.url.endsWith('/api/Admin/workshops'))
      .flush([]);
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
