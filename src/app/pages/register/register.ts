
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
})
export class Register {

  userName: string = '';
  password: string = '';
  fullName: string = '';
  email = '';
  phoneNumber = '';
  role: string = 'Student';
  accountType: number = 0;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {}

  register(): void {
    this.errorMessage = '';

    if (!this.fullName.trim() || !this.userName.trim() || !this.password) {
      this.errorMessage =
        this.languageService.translate('registrationFieldsRequired');
      return;
    }

    const email = this.email.trim();
    const phoneNumber = this.phoneNumber.trim();
    const hasValidEmail = this.isValidEmail(email);
    const hasValidPhoneNumber = this.isValidPhoneNumber(phoneNumber);

    if (!hasValidEmail && !hasValidPhoneNumber) {
      this.errorMessage =
        this.languageService.translate('registrationContactRequired');
      return;
    }

    const data = {
      userName: this.userName.trim(),
      password: this.password,
      fullName: this.fullName.trim(),
      email: email || null,
      phoneNumber: phoneNumber || null,
      role: this.role,
      accountType: this.role === 'Student' ? this.accountType : 0
    };

    this.authService.register(data).subscribe({

      next: (response) => {
        console.log('Registration successful:', response);
        alert('Registration successful!');
        this.router.navigate(['/login']);
      },

      error: (error) => {
        console.error('Registration error:', error);
        console.log('Status:', error.status);
        console.log('Response:', error.error);

        alert(
          `Registration failed.\nStatus: ${error.status}\nMessage: ${
            error.error?.message || error.error || 'Unknown error'
          }`
        );
      }

    });
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  private isValidPhoneNumber(value: string): boolean {
    if (!/^\+?[\d\s().-]+$/.test(value)) return false;

    const digitCount = value.replace(/\D/g, '').length;
    return digitCount >= 7 && digitCount <= 15;
  }
}
