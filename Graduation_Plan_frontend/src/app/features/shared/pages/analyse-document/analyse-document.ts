import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuthService } from '../../../../core/services/auth/auth';
import { DocumentService, DocumentAnalysable, AnalyseResultat } from '../../../../core/services/document';

@Component({
  selector: 'app-analyse-document',
  imports: [CommonModule, FormsModule, RouterLink, TopNav],
  templateUrl: './analyse-document.html',
  styleUrl: './analyse-document.scss',
})
export class AnalyseDocumentComponent implements OnInit {
  private docService  = inject(DocumentService);
  private authService = inject(AuthService);

  documents  = signal<DocumentAnalysable[]>([]);
  resultat   = signal<AnalyseResultat | null>(null);
  analysing  = signal<number | null>(null);
  loading    = signal(true);
  error      = signal('');

  // Décision
  decisioning    = signal(false);
  decisionMsg    = signal('');
  decisionErr    = signal('');
  showRejetForm  = signal(false);
  motifRejet     = '';
  docStatut      = signal<'valide' | 'rejete' | 'en_attente' | null>(null);

  isDirecteur = false;

  ngOnInit(): void {
    const role = this.authService.currentUser()?.role ?? '';
    this.isDirecteur = (role === 'INTERNAL_TRAINER' || role === 'EXTERNAL_TRAINER');

    this.docService.getDocumentsAnalysables().subscribe({
      next:  (docs) => { this.documents.set(docs); this.loading.set(false); },
      error: ()     => { this.error.set('Impossible de charger les documents.'); this.loading.set(false); },
    });
  }

  analyser(doc: DocumentAnalysable): void {
    this.analysing.set(doc.id);
    this.resultat.set(null);
    this.decisionMsg.set('');
    this.decisionErr.set('');
    this.showRejetForm.set(false);
    this.motifRejet = '';
    this.docStatut.set(doc.statut);
    this.error.set('');

    this.docService.analyserDocument(doc.id).subscribe({
      next: (res) => {
        this.resultat.set(res);
        this.analysing.set(null);
        // Plagiat détecté automatiquement → on déclenche le rejet
        if (this.isPlagiatDetecte(res)) {
          this.autoRejeterPlagiat(res.document_id);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Erreur lors de l\'analyse.');
        this.analysing.set(null);
      },
    });
  }

  // ── Décision manuelle ─────────────────────────────────────────────────

  validerDocument(): void {
    const r = this.resultat();
    if (!r) return;
    this.decisioning.set(true);
    this.decisionErr.set('');
    this.docService.decisionDocument(r.document_id, 'valider', '').subscribe({
      next: () => {
        this.docStatut.set('valide');
        this.decisionMsg.set('✓ Document validé. L\'étudiant a été notifié.');
        this.decisioning.set(false);
        this.majStatutTable(r.document_id, 'valide');
      },
      error: (err) => {
        this.decisionErr.set(err?.error?.detail ?? 'Erreur lors de la validation.');
        this.decisioning.set(false);
      },
    });
  }

  ouvrirRejet(): void {
    this.showRejetForm.set(true);
  }

  annulerRejet(): void {
    this.showRejetForm.set(false);
    this.motifRejet = '';
  }

  confirmerRejet(): void {
    const r = this.resultat();
    if (!r) return;
    if (!this.motifRejet.trim()) {
      this.decisionErr.set('Le motif de rejet est obligatoire.');
      return;
    }
    this.decisioning.set(true);
    this.decisionErr.set('');
    this.docService.decisionDocument(r.document_id, 'rejeter', this.motifRejet.trim()).subscribe({
      next: () => {
        this.docStatut.set('rejete');
        this.decisionMsg.set('✗ Document rejeté. L\'étudiant a été notifié.');
        this.showRejetForm.set(false);
        this.decisioning.set(false);
        this.majStatutTable(r.document_id, 'rejete');
      },
      error: (err) => {
        this.decisionErr.set(err?.error?.detail ?? 'Erreur lors du rejet.');
        this.decisioning.set(false);
      },
    });
  }

  // ── Auto-rejet plagiat ────────────────────────────────────────────────

  autoRejeterPlagiat(docId: number): void {
    const motif = `Plagiat détecté (score : ${this.resultat()?.plagiat?.score ?? '—'}%). Document rejeté automatiquement.`;
    this.decisionErr.set('');
    this.docService.decisionDocument(docId, 'rejeter', motif).subscribe({
      next: () => {
        this.docStatut.set('rejete');
        this.decisionMsg.set('');
        this.majStatutTable(docId, 'rejete');
      },
      error: () => { /* silencieux côté UI — le bandeau plagiat suffit */ },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  isPlagiatDetecte(r: AnalyseResultat): boolean {
    return r.plagiat.score >= 30;
  }

  plagiatClass(score: number): string {
    if (score < 20)  return 'safe';
    if (score < 30)  return 'warn';
    return 'danger';
  }

  // Seuils IA : 0-20 vert, 21-59 orange, 60+ rouge
  iaClass(score: number): string {
    if (score <= 20) return 'safe';
    if (score <= 59) return 'warn';
    return 'danger';
  }

  private majStatutTable(docId: number, statut: 'valide' | 'rejete'): void {
    this.documents.update(list =>
      list.map(d => d.id === docId ? { ...d, statut } : d)
    );
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)       return `${bytes} o`;
    if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(0)} Ko`;
    return `${(bytes/1024/1024).toFixed(1)} Mo`;
  }

  statutLabel(s: string): string {
    return s === 'valide' ? 'Validé' : s === 'rejete' ? 'Rejeté' : 'En attente';
  }
  statutClass(s: string): string {
    return s === 'valide' ? 'badge-ok' : s === 'rejete' ? 'badge-rejected' : 'badge-pending';
  }
}
