import { ElementRef } from '@angular/core';

export function scrollToBottom(container?: ElementRef): void {
  if (!container) {
    return;
  }
  const el = container.nativeElement;
  el.scrollTop = el.scrollHeight;
}
