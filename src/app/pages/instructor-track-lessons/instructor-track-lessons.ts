
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
interface LessonItem {
  id: number;
  title: string;
  description: string;
  order: number;
}

interface ContentItem {
  id: number;
  lessonId: number;
  lessonTypeId: number;
  lessonTypeName: string;
  contentUrl: string | null;
  originalFileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  isFree: boolean | null;
  workshopId: number | null;
  interactiveActivityId: number | null;
}

interface SelectableItem {
  id: number;
  title: string;
  details: string;
}

@Component({
  selector: 'app-instructor-track-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-track-lessons.html'
})
export class InstructorTrackLessons implements OnInit {
 private readonly apiUrl = `${environment.apiUrl}/api`;

  trackId = 0;

  lessons: LessonItem[] = [];
  selectedLesson: LessonItem | null = null;
  contents: ContentItem[] = [];
  workshops: SelectableItem[] = [];
  activities: SelectableItem[] = [];

  newLessonTitle = '';
  newLessonDescription = '';

  selectedFileTypeId = 1;
  isFree = false;
  selectedFiles: File[] = [];

  loadingLessons = false;
  loadingContents = false;
  loadingOptions = false;
  creatingLesson = false;
  uploadingFiles = false;
  addingLinkedContent = false;
  deletingContentId: number | null = null;

  selectedWorkshopId = '';
  selectedActivityId = '';

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
         public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!Number.isInteger(id) || id <= 0) {
        this.errorMessage = 'The track ID is invalid.';
        this.cdr.detectChanges();
        return;
      }

      this.trackId = id;
      this.selectedLesson = null;
      this.contents = [];
      this.lessons = [];

      this.cdr.detectChanges();
      void this.loadPageData();
    });
  }

  private async loadPageData(): Promise<void> {
    await Promise.all([
      this.loadLessons(),
      this.loadLinkedOptions()
    ]);

    this.cdr.detectChanges();
  }

  async loadLessons(): Promise<void> {
    this.loadingLessons = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(
          `${this.apiUrl}/Lesson/Track/${this.trackId}`,
          { withCredentials: true }
        )
      );

      this.lessons = this.toArray(response)
        .map(item => this.normalizeLesson(item))
        .filter(lesson => lesson.id > 0);

      this.cdr.detectChanges();

      if (this.selectedLesson) {
        const refreshed = this.lessons.find(
          lesson => lesson.id === this.selectedLesson?.id
        );

        this.selectedLesson = refreshed ?? null;
      }

      if (!this.selectedLesson && this.lessons.length > 0) {
        await this.selectLesson(this.lessons[0]);
      } else if (this.selectedLesson) {
        await this.loadLessonContents();
      } else {
        this.contents = [];
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(
        error,
        'Could not load the lessons for this track.'
      );
    } finally {
      this.loadingLessons = false;
      this.cdr.detectChanges();
    }
  }

  async createLesson(): Promise<void> {
    const title = this.newLessonTitle.trim();

    if (!title) {
      this.errorMessage = 'Enter a lesson title first.';
      this.cdr.detectChanges();
      return;
    }

    this.clearMessages();
    this.creatingLesson = true;
    this.cdr.detectChanges();

    try {
      const response = await firstValueFrom(
        this.http.post<unknown>(
          `${this.apiUrl}/Lesson`,
          {
            trackId: this.trackId,
            title,
            description: this.newLessonDescription.trim() || null
          },
          { withCredentials: true }
        )
      );

      const created = this.normalizeLesson(response);

      this.newLessonTitle = '';
      this.newLessonDescription = '';

      await this.loadLessons();

      if (created.id > 0) {
        const matchingLesson = this.lessons.find(
          lesson => lesson.id === created.id
        );

        if (matchingLesson) {
          await this.selectLesson(matchingLesson);
        }
      } else {
        const matchingLesson = [...this.lessons]
          .reverse()
          .find(lesson => lesson.title === title);

        if (matchingLesson) {
          await this.selectLesson(matchingLesson);
        }
      }

      this.successMessage = 'Lesson created successfully.';
    } catch (error) {
      this.errorMessage = this.getErrorMessage(
        error,
        'Could not create the lesson.'
      );
    } finally {
      this.creatingLesson = false;
      this.cdr.detectChanges();
    }
  }

  async selectLesson(lesson: LessonItem): Promise<void> {
    this.selectedLesson = lesson;
    this.contents = [];
    this.clearMessages();
    this.cdr.detectChanges();

    await this.loadLessonContents();
  }

  async loadLessonContents(): Promise<void> {
    if (!this.selectedLesson) {
      this.contents = [];
      this.loadingContents = false;
      this.cdr.detectChanges();
      return;
    }

    const lessonId = this.selectedLesson.id;

    this.loadingContents = true;
    this.cdr.detectChanges();

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(
          `${this.apiUrl}/LessonContent/lesson/${lessonId}`,
          { withCredentials: true }
        )
      );

      // Ignore an older response if the instructor switched lessons.
      if (this.selectedLesson?.id !== lessonId) {
        return;
      }

      this.contents = this.toArray(response)
        .map(item => this.normalizeContent(item))
        .filter(content => content.id > 0);

      this.cdr.detectChanges();
    } catch (error) {
      if (this.selectedLesson?.id === lessonId) {
        this.errorMessage = this.getErrorMessage(
          error,
          'Could not load content for this lesson.'
        );
      }
    } finally {
      this.loadingContents = false;
      this.cdr.detectChanges();
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedFiles = Array.from(input.files ?? []);
    this.clearMessages();
    this.cdr.detectChanges();
  }

  async uploadFiles(): Promise<void> {
    if (!this.selectedLesson) {
      this.errorMessage = 'Select a lesson first.';
      this.cdr.detectChanges();
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Choose at least one file.';
      this.cdr.detectChanges();
      return;
    }

    if (![1, 2, 3].includes(this.selectedFileTypeId)) {
      this.errorMessage = 'Choose a valid file type.';
      this.cdr.detectChanges();
      return;
    }

    const lessonId = this.selectedLesson.id;
    const files = [...this.selectedFiles];
    const fileTypeId = this.selectedFileTypeId;
    const isFree = this.isFree;

    this.clearMessages();
    this.uploadingFiles = true;
    this.cdr.detectChanges();

    let uploadedCount = 0;
    const failedFiles: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();

        formData.append('LessonId', String(lessonId));
        formData.append('LessonTypeId', String(fileTypeId));
        formData.append('File', file);
        formData.append('IsFree', String(isFree));

        try {
          await firstValueFrom(
            this.http.post(
              `${this.apiUrl}/LessonContent/file`,
              formData,
              { withCredentials: true }
            )
          );

          uploadedCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failedFiles.push(file.name);
        }
      }

      this.selectedFiles = [];

      const input = document.getElementById(
        'lesson-content-files'
      ) as HTMLInputElement | null;

      if (input) {
        input.value = '';
      }

      if (failedFiles.length === 0) {
        this.successMessage =
          `${uploadedCount} file(s) uploaded successfully.`;
      } else {
        this.errorMessage =
          `Uploaded ${uploadedCount} file(s). Failed: ${failedFiles.join(', ')}.`;
      }
    } catch (error) {
      console.error('Unexpected upload error:', error);
      this.errorMessage = 'An unexpected error occurred during upload.';
    } finally {
      // Restore the upload button immediately after uploads finish.
      this.uploadingFiles = false;
      this.cdr.detectChanges();
    }

    // Refresh the content list after restoring the upload button.
    if (this.selectedLesson?.id === lessonId) {
      await this.loadLessonContents();
    }

    this.cdr.detectChanges();
  }

  async onWorkshopSelected(value: string): Promise<void> {
    this.selectedWorkshopId = value;

    if (!value) return;

    const workshopId = Number(value);

    if (!Number.isInteger(workshopId) || workshopId <= 0) {
      this.errorMessage = 'Choose a valid workshop.';
      this.cdr.detectChanges();
      return;
    }

    await this.addWorkshopToLesson(workshopId);
  }

  async addWorkshopToLesson(workshopId: number): Promise<void> {
    if (!this.selectedLesson) {
      this.errorMessage = 'Select a lesson first.';
      this.selectedWorkshopId = '';
      this.cdr.detectChanges();
      return;
    }

    const lessonId = this.selectedLesson.id;

    this.clearMessages();
    this.addingLinkedContent = true;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/LessonContent/workshop`,
          {
            lessonId,
            lessonTypeId: 5,
            workshopId
          },
          { withCredentials: true }
        )
      );

      this.successMessage = 'Workshop attached to the lesson.';
      this.selectedWorkshopId = '';

      if (this.selectedLesson?.id === lessonId) {
        await this.loadLessonContents();
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(
        error,
        'Could not attach the workshop.'
      );

      this.selectedWorkshopId = '';
    } finally {
      this.addingLinkedContent = false;
      this.cdr.detectChanges();
    }
  }

  async onActivitySelected(value: string): Promise<void> {
    this.selectedActivityId = value;

    if (!value) return;

    const activityId = Number(value);

    if (!Number.isInteger(activityId) || activityId <= 0) {
      this.errorMessage = 'Choose a valid interactive activity.';
      this.cdr.detectChanges();
      return;
    }

    await this.addActivityToLesson(activityId);
  }

  async addActivityToLesson(activityId: number): Promise<void> {
    if (!this.selectedLesson) {
      this.errorMessage = 'Select a lesson first.';
      this.selectedActivityId = '';
      this.cdr.detectChanges();
      return;
    }

    const lessonId = this.selectedLesson.id;

    this.clearMessages();
    this.addingLinkedContent = true;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/LessonContent/interactive`,
          {
            lessonId,
            lessonTypeId: 4,
            interactiveActivityId: activityId
          },
          { withCredentials: true }
        )
      );

      this.successMessage =
        'Interactive activity attached to the lesson.';
      this.selectedActivityId = '';

      if (this.selectedLesson?.id === lessonId) {
        await this.loadLessonContents();
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(
        error,
        'Could not attach the interactive activity.'
      );

      this.selectedActivityId = '';
    } finally {
      this.addingLinkedContent = false;
      this.cdr.detectChanges();
    }
  }

  async deleteContent(content: ContentItem): Promise<void> {
    const confirmed = window.confirm(
      'Remove this content from the lesson?'
    );

    if (!confirmed) return;

    this.clearMessages();
    this.deletingContentId = content.id;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}/LessonContent/${content.id}`,
          { withCredentials: true }
        )
      );

      this.contents = this.contents.filter(
        item => item.id !== content.id
      );

      this.successMessage = 'Lesson content removed successfully.';
    } catch (error) {
      this.errorMessage = this.getErrorMessage(
        error,
        'Could not remove this content.'
      );
    } finally {
      this.deletingContentId = null;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigate(['/instructor/tracks']);
  }

  goToWorkshops(): void {
    this.router.navigate(['/instructor/workshops']);
  }

  goToActivities(): void {
    this.router.navigate(['/instructor/interactive']);
  }

  getContentTitle(content: ContentItem): string {
    if (content.originalFileName) {
      return content.originalFileName;
    }

    if (content.workshopId !== null) {
      return this.workshops.find(
        item => item.id === content.workshopId
      )?.title ?? `Workshop #${content.workshopId}`;
    }

    if (content.interactiveActivityId !== null) {
      return this.activities.find(
        item => item.id === content.interactiveActivityId
      )?.title ?? `Interactive activity #${content.interactiveActivityId}`;
    }

    return content.lessonTypeName || 'Lesson content';
  }

  formatFileSize(size: number | null): string {
    if (size === null || !Number.isFinite(size) || size < 0) {
      return '';
    }

    if (size < 1024) return `${size} B`;

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private async loadLinkedOptions(): Promise<void> {
    this.loadingOptions = true;
    this.cdr.detectChanges();

    try {
      const requests = await Promise.allSettled([
        firstValueFrom(
          this.http.get<unknown>(
            `${this.apiUrl}/Workshop/Track/${this.trackId}`,
            { withCredentials: true }
          )
        ),
        firstValueFrom(
          this.http.get<unknown>(
            `${this.apiUrl}/InteractiveActivity/Track/${this.trackId}`,
            { withCredentials: true }
          )
        )
      ]);

      if (requests[0].status === 'fulfilled') {
        this.workshops = this.toArray(requests[0].value)
          .map(item => this.normalizeSelectableItem(item, 'Workshop'))
          .filter(item => item.id > 0);
      } else {
        this.errorMessage = this.getErrorMessage(
          requests[0].reason,
          'Could not load workshops.'
        );
      }

      if (requests[1].status === 'fulfilled') {
        this.activities = this.toArray(requests[1].value)
          .map(item =>
            this.normalizeSelectableItem(item, 'Interactive activity')
          )
          .filter(item => item.id > 0);
      } else {
        this.errorMessage = this.getErrorMessage(
          requests[1].reason,
          'Could not load interactive activities.'
        );
      }
    } finally {
      this.loadingOptions = false;
      this.cdr.detectChanges();
    }
  }

  private normalizeLesson(value: unknown): LessonItem {
    const item = this.asRecord(value);

    return {
      id: this.readNumber(item, [
        'id', 'Id', 'lessonId', 'LessonId'
      ]),
      title: this.readString(item, ['title', 'Title']) || 'Untitled lesson',
      description: this.readString(item, ['description', 'Description']),
      order: this.readNumber(item, ['order', 'Order'])
    };
  }

  private normalizeContent(value: unknown): ContentItem {
    const item = this.asRecord(value);

    return {
      id: this.readNumber(item, ['id', 'Id']),
      lessonId: this.readNumber(item, ['lessonId', 'LessonId']),
      lessonTypeId: this.readNumber(item, ['lessonTypeId', 'LessonTypeId']),
      lessonTypeName:
        this.readString(item, ['lessonTypeName', 'LessonTypeName']) || 'Content',
      contentUrl: this.readNullableString(
        item, ['contentUrl', 'ContentUrl']
      ),
      originalFileName: this.readNullableString(
        item, ['originalFileName', 'OriginalFileName']
      ),
      contentType: this.readNullableString(
        item, ['contentType', 'ContentType']
      ),
      fileSize: this.readNullableNumber(item, ['fileSize', 'FileSize']),
      isFree: this.readNullableBoolean(item, ['isFree', 'IsFree']),
      workshopId: this.readNullableNumber(item, ['workshopId', 'WorkshopId']),
      interactiveActivityId: this.readNullableNumber(
        item, ['interactiveActivityId', 'InteractiveActivityId']
      )
    };
  }

  private normalizeSelectableItem(
    value: unknown,
    fallbackTitle: string
  ): SelectableItem {
    const item = this.asRecord(value);

    const id = this.readNumber(item, [
      'id', 'Id',
      'workshopId', 'WorkshopId',
      'interactiveActivityId', 'InteractiveActivityId',
      'activityId', 'ActivityId'
    ]);

    const title = this.readString(item, [
      'title', 'Title',
      'name', 'Name',
      'topic', 'Topic'
    ]) || `${fallbackTitle} #${id}`;

    const description = this.readString(item, [
      'description', 'Description'
    ]);

    const date = this.readString(item, ['date', 'Date']);
    const startTime = this.readString(item, ['startTime', 'StartTime']);
    const endTime = this.readString(item, ['endTime', 'EndTime']);

    const details = [
      description,
      date,
      startTime && endTime
        ? `${startTime}–${endTime}`
        : startTime || endTime
    ].filter(Boolean).join(' · ');

    return { id, title, details };
  }

  private toArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;

    const record = this.asRecord(value);
    const nested = record['data'] ?? record['items'] ?? record['result'];

    return Array.isArray(nested) ? nested : [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private readString(
    item: Record<string, unknown>,
    keys: string[]
  ): string {
    for (const key of keys) {
      const value = item[key];

      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
    }

    return '';
  }

  private readNumber(
    item: Record<string, unknown>,
    keys: string[]
  ): number {
    for (const key of keys) {
      const value = item[key];

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);

        if (Number.isFinite(parsed)) return parsed;
      }
    }

    return 0;
  }

  private readNullableString(
    item: Record<string, unknown>,
    keys: string[]
  ): string | null {
    const value = this.readString(item, keys);
    return value || null;
  }

  private readNullableNumber(
    item: Record<string, unknown>,
    keys: string[]
  ): number | null {
    const value = this.readNumber(item, keys);
    return value > 0 ? value : null;
  }

  private readNullableBoolean(
    item: Record<string, unknown>,
    keys: string[]
  ): boolean | null {
    for (const key of keys) {
      const value = item[key];

      if (typeof value === 'boolean') return value;
      if (value === 0 || value === 1) return value === 1;
      if (value === 'true' || value === 'false') {
        return value === 'true';
      }
    }

    return null;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;

      if (typeof body === 'string' && body.trim()) {
        return body;
      }

      if (body && typeof body === 'object') {
        const record = body as Record<string, unknown>;

        for (const key of ['message', 'Message', 'title', 'detail']) {
          const value = record[key];

          if (typeof value === 'string' && value.trim()) {
            return value;
          }
        }
      }

      if (error.status === 401) {
        return 'Your session has expired. Please log in again.';
      }

      if (error.status === 403) {
        return 'You are not authorized to perform this action.';
      }
    }

    return fallback;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
