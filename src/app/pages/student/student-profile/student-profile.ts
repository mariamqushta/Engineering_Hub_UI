
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  finalize,
  Subscription,
  timeout
} from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css',
})
export class StudentProfile implements OnInit, OnDestroy {
  userName = '';
  fullName = '';
  savedFullName = '';
  savedUserName = '';
  profileImageUrl: string | null = null;

  selectedImage: File | null = null;
  previewUrl: string | null = null;

  isLoading = true;
  isSaving = false;
  message = '';
  errorMessage = '';

  private profileSubscription?: Subscription;
  private saveSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private getImageUrl(path: string | null): string | null {
    if (!path) return null;

    if (path.startsWith('http')) return path;

    return `https://localhost:7109${path.startsWith('/') ? '' : '/'}${path}`;
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.profileSubscription?.unsubscribe();

    this.profileSubscription = this.authService
      .getCurrentUser()
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (user: any) => {
          this.userName = user.userName ?? user.username ?? '';
         this.fullName = user.fullName ?? user.FullName ?? '';
         this.savedFullName = this.fullName;
         this.savedUserName = this.userName;
          this.profileImageUrl = this.getImageUrl(
              user.profileImageUrl ?? this.profileImageUrl
            );

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load student profile:', error);

          this.errorMessage =
            error.name === 'TimeoutError'
              ? 'Loading your profile took too long. Please try again.'
              : error.error?.message ??
                'Could not load your profile. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  get avatarLetter(): string {
    return (this.fullName || this.userName || 'S')
      .trim()
      .charAt(0)
      .toUpperCase();
  }

  get displayedImage(): string | null {
    return this.previewUrl || this.profileImageUrl;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.message = '';
    this.errorMessage = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Choose a JPG, PNG, or WebP image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The image must be 5 MB or smaller.';
      input.value = '';
      return;
    }

    this.clearPreviewUrl();

    this.selectedImage = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  saveProfile(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.userName.trim()) {
      this.errorMessage = 'Username is required.';
      return;
    }

   const formData = new FormData();
    formData.append('userName', this.userName.trim());
    formData.append('fullName', this.fullName.trim());

    if (this.selectedImage) {
      formData.append('profileImage', this.selectedImage);
    }

    this.isSaving = true;
    this.saveSubscription?.unsubscribe();

    this.saveSubscription = this.authService
      .updateProfile(formData)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.userName = response.userName ?? this.userName;
          this.fullName = response.fullName ?? this.fullName;
          this.savedFullName = this.fullName;
           this.savedUserName = this.userName;
          this.profileImageUrl = this.getImageUrl(
          response.profileImageUrl ?? this.profileImageUrl
        );

          this.selectedImage = null;
          this.clearPreviewUrl();

          this.message = 'Profile updated successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to update student profile:', error);

          this.errorMessage =
            error.name === 'TimeoutError'
              ? 'Saving took too long. Please try again.'
              : error.error?.message ??
                'Could not update your profile. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  private clearPreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription?.unsubscribe();
    this.saveSubscription?.unsubscribe();
    this.clearPreviewUrl();
  }
}
