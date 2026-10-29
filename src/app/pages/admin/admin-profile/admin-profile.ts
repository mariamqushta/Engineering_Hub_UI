
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
interface AdminProfileData {
  id?: string;
  userName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string | null;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  profileImageUrl?: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  roles?: string[];
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-profile.html'
})
export class AdminProfile implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/Account/me`;
  private cdr = inject(ChangeDetectorRef);
  profile: AdminProfileData | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient,
       public languageService: LanguageService,) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<AdminProfileData | { user: AdminProfileData }>(
      this.apiUrl,
      { withCredentials: true }
    ).subscribe({
      next: response => {
        this.profile = 'user' in response
          ? response.user
          : response;

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load admin profile:', error);
        this.errorMessage =
          error.error?.message ||
          'Could not load your profile. Please check that you are logged in.';
        this.isLoading = false;
      }
    });
  }

  get initials(): string {
    const name = this.profile?.fullName?.trim();

    if (name) {
      return name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
    }

    return this.profile?.userName?.slice(0, 2).toUpperCase() || 'AD';
  }
}
