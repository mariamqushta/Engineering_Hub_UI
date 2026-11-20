import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../../../test-setup';
import { Register } from './register';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
import { Router } from '@angular/router';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let registerSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registerSpy = vi.fn(() => NEVER);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthService, useValue: { register: registerSpy } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: LanguageService, useValue: { translate: (key: string) => key } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects registration when both email and phone are empty', () => {
    component.register();

    expect(component.errorMessage).toBe('emailOrPhoneRequired');
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('allows registration with only a phone number', () => {
    component.phone = ' 5551234 ';

    component.register();

    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: '5551234' })
    );
  });
});
