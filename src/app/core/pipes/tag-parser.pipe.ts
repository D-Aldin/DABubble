import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'parseTags',
  standalone: true
})
export class ParseTagsPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

transform(text: string): SafeHtml {
  if (!text) return '';
  let parsedText = text.replace(/@([^@#\s][^@#]*[^@#\s]|[\wäöüÄÖÜß])/g, (match, username) => {
    const trimmed = username.trim();
    return `<span class="tag-link user-tag" data-type="user" data-name="${trimmed}">@${trimmed}</span>`;
  });
  parsedText = parsedText.replace(/#([^@#\s][^@#]*[^@#\s]|[\wäöüÄÖÜß-])/g, (match, channel) => {
    const trimmed = channel.trim();
    return `<span class="tag-link channel-tag" data-type="channel" data-name="${trimmed}">#${trimmed}</span>`;
  });
  return this.sanitizer.bypassSecurityTrustHtml(parsedText);
}
}