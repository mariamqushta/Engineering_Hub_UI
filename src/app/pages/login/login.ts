import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  userName = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService,
  ) {}

  login(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const data = {
      userName: this.userName,
      password: this.password
    };

    this.authService.login(data).subscribe({
      next: () => {
        this.authService.getCurrentUser().subscribe({
            next: user => {
              console.log('Logged-in user:', user);
              console.log('User roles:', user.roles);

              if (
                user.roles?.includes('Admin') ||
                user.roles?.includes('SuperAdmin')
              ) {
                console.log('Navigating to admin dashboard');
                this.router.navigate(['/admin/dashboard']);
              } else if (user.roles?.includes('Instructor')) {
                console.log('Navigating to instructor dashboard');
                this.router.navigate(['/instructor/dashboard']);
              } else {
                console.log('Navigating to student home');
                this.router.navigate(['/']);
              }
            },
          error: (error) => {
            console.error('Could not get current user:', error);
            this.errorMessage =
              'Login succeeded, but we could not identify your role.';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = 'Login failed. Please check your username and password.';
        this.isLoading = false;
      }
    });
  }
}
