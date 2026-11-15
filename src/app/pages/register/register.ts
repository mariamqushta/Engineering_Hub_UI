
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
  role: string = 'Student';
  accountType: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {}

  register(): void {

    const data = {
      userName: this.userName,
      password: this.password,
      fullName: this.fullName,
      role: this.role,
      accountType: this.role === 'Student' ? this.accountType : 0
    };
console.log('Registration data:', data);
console.log('Selected Role:', data.role);
console.log('Selected Account Type:', data.accountType);
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
}
