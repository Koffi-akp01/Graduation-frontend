import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SharedModule } from '../../../shared/shared-module';
import { ToastService } from '../../../shared/services/toast';
import { StudentService, MemoireVersion } from '../../../core/services/student.service';
import { TopNav } from '../../../core/components/top-nav/top-nav';

@Component({
  selector: 'app-upload-memoire',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SharedModule, TopNav],
  templateUrl: './upload-memoire.html',
  styleUrl: './upload-memoire.scss',
})
export class UploadMemoireComponent implements OnInit {
  private studentService = inject(StudentService);
  private toast = inject(ToastService);

  versions = signal<MemoireVersion[]>([]);
  dragOver = false;
  uploadProgress = 0;
  uploading = false;
  error = '';
  success = false;
  pdfUrl: string | null = null;

  ngOnInit() {
    this.studentService.getVersions().subscribe({
      next: (data) => this.versions.set(data),
      error: () => this.toast.error('Impossible de charger les versions'),
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile(file);
  }

  viewPdf(version: MemoireVersion) {
    this.pdfUrl = version.url;
  }

  private uploadFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.error = 'Seuls les fichiers PDF sont acceptés.';
      this.success = false;
      return;
    }
    this.error = '';
    this.success = false;
    this.uploading = true;
    this.uploadProgress = 10;

    this.studentService.uploadMemoire(file).subscribe({
      next: (version) => {
        this.uploadProgress = 100;
        this.uploading = false;
        this.success = true;
        this.versions.update(v => [version, ...v]);
        this.toast.success('Mémoire déposé avec succès !');
      },
      error: () => {
        this.error = "Échec de l'upload. Veuillez réessayer.";
        this.uploadProgress = 0;
        this.uploading = false;
      },
    });
  }
}
