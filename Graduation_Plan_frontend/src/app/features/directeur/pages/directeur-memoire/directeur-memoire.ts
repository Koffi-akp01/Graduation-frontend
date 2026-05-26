import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AnnotationService, Annotation, NouvelleAnnotation } from '../../../../core/services/annotation/annotation';
import { ToastService } from '../../../../shared/services/toast';

@Component({
  selector: 'app-directeur-memoire',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopNav],
  templateUrl: './directeur-memoire.html',
  styleUrls: ['./directeur-memoire.scss'],
})
export class DirecteurMemoireComponent implements OnInit, OnDestroy {
  private route     = inject(ActivatedRoute);
  private annSvc    = inject(AnnotationService);
  private toast     = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private http      = inject(HttpClient);

  docId        = signal<number>(0);
  memoireUrl   = signal<string>('');
  etudiantNom  = signal<string>('');

  // Blob URL générée après fetch du PDF avec auth header
  blobSafeUrl  = signal<SafeResourceUrl | null>(null);
  isPdfLoading = signal(false);
  pdfError     = signal(false);

  // Fallback : URL directe (pour le lien "ouvrir dans un onglet")
  safeDirectUrl = computed((): SafeResourceUrl | null => {
    const url = this.memoireUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  private blobObjectUrl: string | null = null;

  annotations  = signal<Annotation[]>([]);
  isLoading    = signal(false);
  isSaving     = signal(false);

  form = { page: 1, texte: '', couleur: '#FF6B35' };
  couleurs = [
    { val: '#FF6B35', label: 'Orange' },
    { val: '#E63946', label: 'Rouge' },
    { val: '#2196F3', label: 'Bleu' },
    { val: '#22C55E', label: 'Vert' },
    { val: '#9C27B0', label: 'Violet' },
  ];

  pageActive = signal<number | null>(null);

  annotationsFiltrees = computed(() => {
    const page = this.pageActive();
    const list = this.annotations();
    return page === null ? list : list.filter(a => a.page === page);
  });

  pagesDisponibles = computed(() =>
    [...new Set(this.annotations().map(a => a.page))].sort((a, b) => a - b)
  );

  nbNonResolues = computed(() => this.annotations().filter(a => !a.est_resolu).length);

  ngOnInit(): void {
    const id  = Number(this.route.snapshot.paramMap.get('docId'));
    const url = decodeURIComponent(this.route.snapshot.queryParamMap.get('url') ?? '');
    const nom = decodeURIComponent(this.route.snapshot.queryParamMap.get('nom') ?? '');

    this.docId.set(id);
    this.memoireUrl.set(url);
    this.etudiantNom.set(nom);

    if (url) this.chargerPdfBlob(url);
    this.chargerAnnotations();
  }

  ngOnDestroy(): void {
    if (this.blobObjectUrl) {
      URL.revokeObjectURL(this.blobObjectUrl);
    }
  }

  // Télécharge le PDF via HttpClient (avec JWT) et crée une blob URL
  private chargerPdfBlob(url: string): void {
    this.isPdfLoading.set(true);
    this.pdfError.set(false);

    this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(() => of(null))
    ).subscribe(blob => {
      this.isPdfLoading.set(false);
      if (!blob) {
        this.pdfError.set(true);
        return;
      }
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      this.blobObjectUrl = objectUrl;
      this.blobSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
    });
  }

  chargerAnnotations(): void {
    this.isLoading.set(true);
    this.annSvc.getAnnotations(this.docId()).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.annotations.set(data);
      this.isLoading.set(false);
    });
  }

  ajouterAnnotation(): void {
    if (!this.form.texte.trim()) {
      this.toast.error('Le texte de l\'annotation est obligatoire.');
      return;
    }
    const payload: NouvelleAnnotation = {
      page:    this.form.page,
      x_pct:  0,
      y_pct:  0,
      texte:  this.form.texte.trim(),
      couleur: this.form.couleur,
    };
    this.isSaving.set(true);
    this.annSvc.ajouter(this.docId(), payload).subscribe({
      next: (ann) => {
        this.annotations.update(list => [...list, ann]);
        this.form.texte = '';
        this.isSaving.set(false);
        this.toast.success('Annotation ajoutée.');
      },
      error: () => {
        this.toast.error('Erreur lors de l\'ajout de l\'annotation.');
        this.isSaving.set(false);
      },
    });
  }

  resoudre(ann: Annotation): void {
    this.annSvc.resoudre(ann.id).subscribe({
      next: (updated) => {
        this.annotations.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.toast.success('Annotation marquée comme résolue.');
      },
      error: () => this.toast.error('Erreur.'),
    });
  }

  supprimer(ann: Annotation): void {
    if (!confirm('Supprimer cette annotation ?')) return;
    this.annSvc.supprimer(ann.id).subscribe({
      next: () => {
        this.annotations.update(list => list.filter(a => a.id !== ann.id));
        this.toast.success('Annotation supprimée.');
      },
      error: () => this.toast.error('Erreur.'),
    });
  }

  filtrerPage(page: number | null): void {
    this.pageActive.set(page);
  }

  rechargerPdf(): void {
    const url = this.memoireUrl();
    if (url) {
      if (this.blobObjectUrl) {
        URL.revokeObjectURL(this.blobObjectUrl);
        this.blobObjectUrl = null;
      }
      this.blobSafeUrl.set(null);
      this.chargerPdfBlob(url);
    }
  }
}
