import { Directive, ElementRef, HostListener, Input, NgZone } from '@angular/core';

@Directive({
  selector: '[appAutoYScroll]',
  standalone: true
})
export class AutoYScrollDirective {
  @Input() enabledBreakpoint = 580;
  @Input() speed = 40; // px per second
  @Input() pauseDuration = 1500; // ms pause after reset
  @Input() resumeDelayAfterUserScroll = 4000; // ms delay before resuming after manual scroll

  private rafId: number | null = null;
  private running = false;
  private pausedByUser = false;
  private manualScrolling = false;
  private lastTs = 0;
  private watchInterval?: any;

  private trackEl?: HTMLDivElement;
  private pos = 0; // current transform offset
  private pauseUntil = 0;
  private resumeTimeoutId: any;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) { }

  ngAfterViewInit(): void {
    this.el.nativeElement.addEventListener('scroll', this.onUserScroll, { passive: true });
    setTimeout(() => {
      this.maybeStart();
      this.watchInterval = setInterval(() => this.maybeStart(), 2000);
    }, 2500);
  }


  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('scroll', this.onUserScroll);
    this.stop();
    clearInterval(this.watchInterval);
    if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
  }

  @HostListener('window:resize')
  onResize() {
    this.maybeStart();
  }

  @HostListener('touchstart')
  @HostListener('mousedown')
  onPointerDown() {
    this.pausedByUser = true;
    this.manualScrolling = true;
    this.stop();
    if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
  }

  @HostListener('touchend')
  @HostListener('mouseup')
  onPointerUp() {
    if (this.manualScrolling) {
      const el = this.el.nativeElement;
      let lastScrollLeft = el.scrollLeft;
      let stillScrollingCount = 0;

      const checkScrollStop = () => {
        if (el.scrollLeft !== lastScrollLeft) {
          lastScrollLeft = el.scrollLeft;
          stillScrollingCount = 0;
          requestAnimationFrame(checkScrollStop);
        } else if (stillScrollingCount < 3) {
          stillScrollingCount++;
          requestAnimationFrame(checkScrollStop);
        } else {
          // Momentum stopped, now wait 4s before resuming
          this.resumeTimeoutId = setTimeout(() => {
            this.manualScrolling = false;
            this.pausedByUser = false;
            this.pos = el.scrollLeft; // sync starting position
            this.maybeStart();
          }, this.resumeDelayAfterUserScroll);
        }
      };
      requestAnimationFrame(checkScrollStop);
    }
  }

  private onUserScroll = () => {
    if (!this.pausedByUser) {
      this.pausedByUser = true;
      this.manualScrolling = true;
      this.stop();
      if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
    }
  };

  private isMobile(): boolean {
    return window.innerWidth <= (this.enabledBreakpoint ?? 580);
  }

  private hasOverflow(): boolean {
    const n = this.el.nativeElement;
    const track = this.trackEl ?? ({} as HTMLElement);
    return (track.scrollWidth || n.scrollWidth) > n.clientWidth + 2;
  }

  private maybeStart() {
    if (!this.isMobile() || !this.hasOverflow() || this.pausedByUser) {
      this.stop();
      return;
    }
    if (!this.running) {
      this.start();
    }
  }

  private setupTrack() {
    const host = this.el.nativeElement;
    if (this.trackEl) return;

    const track = document.createElement('div');
    track.style.display = 'inline-flex';
    track.style.flexDirection = 'row';
    track.style.willChange = 'transform';
    track.style.transform = 'translate3d(0,0,0)';

    while (host.firstChild) {
      track.appendChild(host.firstChild);
    }
    host.appendChild(track);
    this.trackEl = track;

    host.style.overflowX = 'scroll';
    host.style.overflowY = 'hidden';
    host.style.whiteSpace = 'nowrap';
  }

  private start() {
    this.setupTrack();

    const host = this.el.nativeElement;
    const track = this.trackEl!;
    this.running = true;
    this.lastTs = 0;

    this.zone.runOutsideAngular(() => {
      const step = (ts: number) => {
        if (!this.running) return;

        if (this.pausedByUser || !this.isMobile() || !this.hasOverflow()) {
          this.stop();
          return;
        }

        const maxShift = Math.max(0, track.scrollWidth - host.clientWidth);

        // Handle pause after reset
        if (this.pauseUntil > ts) {
          this.lastTs = ts;
          this.rafId = requestAnimationFrame(step);
          return;
        }

        if (!this.lastTs) this.lastTs = ts;
        const dt = (ts - this.lastTs) / 1000;
        this.lastTs = ts;

        const delta = (this.speed ?? 40) * dt;
        this.pos += delta;

        // reached end? snap back and pause
        if (this.pos >= maxShift) {
          this.pos = 0;
          this.pauseUntil = ts + this.pauseDuration;
          this.lastTs = ts;
        }

        track.style.transform = `translate3d(${-this.pos}px, 0, 0)`;
        this.rafId = requestAnimationFrame(step);
      };

      this.rafId = requestAnimationFrame(step);
    });
  }

  private stop() {
    this.running = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
