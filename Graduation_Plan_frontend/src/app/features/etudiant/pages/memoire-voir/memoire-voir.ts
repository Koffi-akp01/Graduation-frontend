import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { EtudiantService } from '../../../../core/services/etudiant/etudiant';
import { AnnotationService, Annotation } from '../../../../core/services/annotation/annotation';

@Component({
  selector: 'app-memoire-voir',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNav],
  templateUrl: './memoire-voir.html',
  styleUrls: ['./memoire-voir.scss'],
})
export class EtudiantMemoireVoirComponent implements OnInit, OnDestroy {
  private etudiantSvc = inject(EtudiantService);
  private annSvc      = inject(AnnotationService);
  private sanitizer   = inject(DomSanitizer);
  private http        = inject(HttpClient);

  // Infos mémoire
  titre      = signal('—');
  directeur  = signal('—');
  version    = signal('—');
  commentaire = signal('');
  statut     = signal('');
  docId      = signal<number>(0);
  fichierUrl = signal('');

  // PDF blob
  blobSafeUrl  = signal<SafeResourceUrl | null>(null);
  isPdfLoading = signal(false);
  pdfError     = signal(false);
  private blobObjectUrl: string | null = null;

  // Annotations (lecture seule)
  annotations  = signal<Annotation[]>([]);
  isLoadingAnn = signal(false);
  pageActive   = signal<number | null>(null);

  annotationsFiltrees = computed(() => {
    const p = this.pageActive();
    const a = this.annotations();
    return p === null ? a : a.filter(x => x.page === p);
  });

  pagesDisponibles = computed(() =>
    [...new Set(this.annotations().map(a => a.page))].sort((a, b) => a - b)
  );

  nbOuvertes = computed(() => this.annotations().filter(a => !a.est_resolu).length);

  isLoading = signal(true);
  errorMsg  = signal('');

  ngOnInit(): void {
    forkJoin({
      memoire: this.etudiantSvc.getMemoire().pipe(catchError(() => of(null))),
    }).subscribe(({ memoire }) => {
      this.isLoading.set(false);
      if (!memoire) {
        this.errorMsg.set('Aucun mémoire déposé pour le moment.');
        return;
      }
      this.titre.set(memoire.titre);
      this.directeur.set(memoire.directeur);
      this.version.set(memoire.version);
      this.commentaire.set(memoire.commentaire);
      this.statut.set(memoire.statut);
      this.docId.set(memoire.id);
      this.fichierUrl.set(memoire.fichier_url ?? '');

      if (memoire.fichier_url) {
        this.chargerPdfBlob(memoire.fichier_url);
      }
      this.chargerAnnotations(memoire.id);
    });
  }

  ngOnDestroy(): void {
    if (this.blobObjectUrl) URL.revokeObjectURL(this.blobObjectUrl);
  }

  private chargerPdfBlob(url: string): void {
    this.isPdfLoading.set(true);
    this.pdfError.set(false);
    this.http.get(url, { responseType: 'blob' }).pipe(catchError(() => of(null))).subscribe(blob => {
      this.isPdfLoading.set(false);
      if (!blob) { this.pdfError.set(true); return; }
      const objUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      this.blobObjectUrl = objUrl;
      this.blobSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objUrl));
    });
  }

  private chargerAnnotations(docId: number): void {
    this.isLoadingAnn.set(true);
    this.annSvc.getAnnotations(docId).pipe(catchError(() => of([]))).subscribe(data => {
      this.annotations.set(data);
      this.isLoadingAnn.set(false);
    });
  }

  filtrerPage(page: number | null): void { this.pageActive.set(page); }

  recharger(): void {
    const url = this.fichierUrl();
    if (!url) return;
    if (this.blobObjectUrl) { URL.revokeObjectURL(this.blobObjectUrl); this.blobObjectUrl = null; }
    this.blobSafeUrl.set(null);
    this.chargerPdfBlob(url);
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      en_attente: 'En attente', en_revision: 'En révision', valide: 'Validé', rejete: 'Rejeté',
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    const m: Record<string, string> = {
      en_attente: 'badge-neutral', en_revision: 'badge-warn', valide: 'badge-success', rejete: 'badge-danger',
    };
    return m[s] ?? 'badge-neutral';
  }
}
