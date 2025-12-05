import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemItem } from '../../models/file-system-item.model';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-media-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-lightbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaLightboxComponent implements OnChanges {
  @Input({ required: true }) playlist!: FileSystemItem[];
  @Input() startIndex = 0;
  @Output() close = new EventEmitter<void>();

  currentIndex = signal(0);
  
  // A signal that derives the full content URL from the thumbnail URL
  currentMedia = computed(() => {
    const item = this.playlist[this.currentIndex()];
    if (!item) return null;
    
    // In a real app, you might have separate properties for thumb and full-size.
    // Here, we'll just manipulate the mock URL.
    const contentUrl = item.thumbnailUrl?.replace('/40/40', '/800/600')
      .replace('/200/200', '/800/600');
      
    return {
      ...item,
      contentUrl: item.icon === 'video' ? item.thumbnailUrl?.split('#t=')[0] : contentUrl
    };
  });
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startIndex']) {
      this.currentIndex.set(this.startIndex);
    }
  }

  next(): void {
    this.currentIndex.update(i => (i + 1) % this.playlist.length);
  }

  prev(): void {
    this.currentIndex.update(i => (i - 1 + this.playlist.length) % this.playlist.length);
  }

  closeLightbox(): void {
    this.close.emit();
  }
}
