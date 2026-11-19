import { Pipe, PipeTransform } from '@angular/core';

export function formatTime12Hour(value: string | null | undefined): string {
  const time = value?.trim();
  if (!time) return '';

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i.exec(time);
  if (!match) return time;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) {
    return time;
  }

  const period = meridiem ?? (hour >= 12 ? 'PM' : 'AM');
  if (!meridiem) {
    hour = hour % 12 || 12;
  }

  return `${hour}:${match[2].padStart(2, '0')} ${period}`;
}

@Pipe({
  name: 'time12Hour',
  standalone: true
})
export class Time12HourPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatTime12Hour(value);
  }
}
