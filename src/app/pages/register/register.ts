
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
  phone = '';
  role: string = 'Student';
  accountType: number = 0;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {}

  register(): void {
    const email = this.email.trim();
    const phone = this.phone.trim();

    if (!email && !phone) {
      this.errorMessage =
        this.languageService.translate('emailOrPhoneRequired');
      return;
    }

    this.errorMessage = '';

    const data = {
      userName: this.userName,
      password: this.password,
      fullName: this.fullName,
      email: email || undefined,
      phoneNumber: phone || undefined,
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

        alert(
          `Registration failed.\nStatus: ${error.status}\nMessage: ${
            error.error?.message || error.error || 'Unknown error'
          }`
        );
      }

    });
  }
}
