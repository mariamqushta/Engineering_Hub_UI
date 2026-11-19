import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

import { Register } from './register';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  const authService = {
    register: vi.fn()
  };

  beforeEach(async () => {
    authService.register.mockReturnValue(EMPTY);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: LanguageService,
          useValue: { translate: (key: string) => key }
        },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects registration when neither email nor phone is valid', () => {
    component.fullName = 'New Student';
    component.userName = 'newstudent';
    component.password = 'password';
    component.email = 'not-an-email';
    component.phoneNumber = 'not-a-phone';

    component.register();

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('registrationContactRequired');
  });

  it('allows registration with a valid phone number', () => {
    component.fullName = 'New Student';
    component.userName = 'newstudent';
    component.password = 'password';
    component.phoneNumber = '+1 212-555-0182';

    component.register();

    expect(authService.register).toHaveBeenCalledWith({
      userName: 'newstudent',
      password: 'password',
      fullName: 'New Student',
      email: null,
      phoneNumber: '+1 212-555-0182',
      role: 'Student',
      accountType: 0
    });
  });
});
