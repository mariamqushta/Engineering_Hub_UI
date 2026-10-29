import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
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

  constructor(private authService: AuthService,
  private router: Router,
  public languageService: LanguageService,) {}

  register(): void {

    const data = {
      userName: this.userName,
      password: this.password,
      fullName: this.fullName,
      role: this.role
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
      error.error?.message || 'Unknown error'
    }`
  );
}

    });
  }


}
