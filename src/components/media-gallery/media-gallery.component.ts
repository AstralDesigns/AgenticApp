import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemItem } from '../../models/file-system-item.model';

@Component({
  selector: 'app-media-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaGalleryComponent {
  @Input({ required: true }) mediaItems!: FileSystemItem[];
  @Output() itemSelect = new EventEmitter<FileSystemItem>();

  selectItem(item: FileSystemItem): void {
    this.itemSelect.emit(item);
  }
}
