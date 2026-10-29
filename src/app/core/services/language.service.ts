
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import enTranslations from '../../../assets/i18n/en.json';
import arTranslations from '../../../assets/i18n/ar.json';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly languageSubject = new BehaviorSubject<AppLanguage>(
    this.getInitialLanguage()
  );

  readonly language$ = this.languageSubject.asObservable();

  private readonly translations = signal<Record<string, string>>({});

  constructor() {
    this.applyLanguage(this.currentLanguage);
    this.loadTranslations(this.currentLanguage);
  }

  get currentLanguage(): AppLanguage {
    return this.languageSubject.value;
  }

  translate(key: string): string {
    return this.translations()[key] ?? key;
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.currentLanguage) return;

    this.languageSubject.next(language);
    this.applyLanguage(language);
    this.loadTranslations(language);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('engineering-hub-language', language);
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLanguage === 'en' ? 'ar' : 'en');
  }

  private loadTranslations(language: AppLanguage): void {
    const selectedTranslations =
      language === 'ar' ? arTranslations : enTranslations;

    this.translations.set(selectedTranslations);
  }

  private getInitialLanguage(): AppLanguage {
    if (!isPlatformBrowser(this.platformId)) {
      return 'en';
    }

    return localStorage.getItem('engineering-hub-language') === 'ar'
      ? 'ar'
      : 'en';
  }

  private applyLanguage(language: AppLanguage): void {
    const html = this.document.documentElement;

    html.lang = language;
    html.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
}
