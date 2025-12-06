import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemItem } from '../../models/file-system-item.model';
import { FileSystemService } from '../../services/file-system.service';

// FIX: Define a type for the lightbox item to resolve the 'type' property conflict
// between FileSystemItem ('file' | 'folder') and the desired media type ('image' | 'video' | 'other').
type LightboxMediaItem = Omit<FileSystemItem, 'type'> & {
  contentUrl: string | null;
  type: 'image' | 'video' | 'other';
};

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

  private fileSystemService = inject(FileSystemService);

  currentIndex = signal(0);
  
  // FIX: Replaced the faulty computed property with a signal that is populated asynchronously.
  // This new structure holds the item, its data URL, and its type ('image' or 'video').
  currentMedia = signal<LightboxMediaItem | null>(null);

  constructor() {
    // FIX: Use an effect to react to changes in the current index and load the corresponding media file.
    // This handles the asynchronous nature of file reading.
    effect(() => {
      const index = this.currentIndex();
      const item = this.playlist?.[index];

      if (item) {
        this.loadMedia(item);
      } else {
        this.currentMedia.set(null);
      }
    }, { allowSignalWrites: true });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startIndex'] || changes['playlist']) {
      this.currentIndex.set(this.startIndex);
    }
  }

  private async loadMedia(item: FileSystemItem): Promise<void> {
    const type = this.getFileType(item.name);
    // FIX: Destructure to remove the original 'type' from 'item' before creating the new object,
    // resolving the type conflict.
    const { type: _fileSystemType, ...restOfItem } = item;

    if (type === 'other') {
      this.currentMedia.set({ ...restOfItem, contentUrl: null, type });
      return;
    }

    const result = await this.fileSystemService.readFile(item.path);
    if ('error' in result) {
      console.error(`Failed to read file ${item.path}:`, result.error);
      this.currentMedia.set({ ...restOfItem, contentUrl: null, type });
      return;
    }

    const mimeType = this.getMimeType(item.name);
    let url: string;

    if (result.encoding === 'base64') {
      url = `data:${mimeType};base64,${result.content}`;
    } else { // Handle text-based media like SVG
      url = `data:${mimeType};charset=utf-8,${encodeURIComponent(result.content)}`;
    }
    this.currentMedia.set({ ...restOfItem, contentUrl: url, type });
  }

  private getFileType(fileName: string): 'image' | 'video' | 'other' {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'mkv'].includes(extension)) {
      return 'video';
    }
    return 'other';
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    switch (extension) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'svg': return 'image/svg+xml';
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'mov': return 'video/quicktime';
      case 'mkv': return 'video/x-matroska';
      default: return 'application/octet-stream';
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
