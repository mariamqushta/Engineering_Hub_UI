import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// import '../../../test-setup';
import {  AdminInteractive} from './admin-interactive';

describe('AdminInteractive', () => {
  let component:  AdminInteractive;
  let fixture: ComponentFixture< AdminInteractive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInteractive],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminInteractive);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(request => request.url.endsWith('/api/Admin/interactive-activities'))
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
