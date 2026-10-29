export interface LessonContent {
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
