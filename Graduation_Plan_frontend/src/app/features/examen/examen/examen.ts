import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { ToastService } from '../../../shared/services/toast';
import { ExamenService } from '../../../core/services/examen/examen';

interface Dossier {
  id: number;
  etudiant: string;
  matricule: string;
  niveau: string;
  titre: string;
  ue: string;
  ueStatus: 'success' | 'warning' | 'danger' | 'neutral';
  paiement: string;
  paiementStatus: 'success' | 'warning' | 'danger' | 'neutral';
  antiIa: string;
  antiIaStatus: 'success' | 'warning' | 'danger' | 'neutral';
  tauxPlagiat: number;
  tauxIa: number;
  nbPages: number;
}

@Component({
  selector: 'app-examen',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="examen-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-avatar">
          <div class="avatar-circle">SE</div>
          <div>
            <div class="avatar-name">Service Examen</div>
            <div class="avatar-role">Vérification & Contrôle</div>
          </div>
        </div>

        <div class="sidebar-section">VÉRIFICATIONS</div>
        <a class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Tableau de bord</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">🔍</span>
          <span class="nav-label">Vérifier les mémoires</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">🤖</span>
          <span class="nav-label">Détection IA / plagiat</span>
        </a>

        <div class="sidebar-section">DOSSIERS</div>
        <a class="nav-item">
          <span class="nav-icon">📋</span>
          <span class="nav-label">Dossiers en attente</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">✅</span>
          <span class="nav-label">Dossiers validés</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">❌</span>
          <span class="nav-label">Dossiers rejetés</span>
        </a>

        <div class="sidebar-section">RAPPORTS</div>
        <a class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Statistiques</span>
        </a>
      </aside>

      <!-- Contenu principal -->
      <main class="main-content">
        <div class="page-header">
          <div>
            <div class="page-title">Service Examen</div>
            <div class="page-subtitle">Vérification des dossiers — Session Juillet 2025</div>
          </div>
          <button class="btn btn-primary" (click)="exporterRapport()">📤 Exporter rapport</button>
        </div>

        <!-- Cartes statistiques -->
        <div class="stats-grid">
          <app-stat-card label="TOTAL DOSSIERS" value="87" icon="📁" color="#2B6CB0" sub="Session Juillet 2025"></app-stat-card>
          <app-stat-card label="EN ATTENTE" value="24" icon="⏳" color="#C8963E" sub="À vérifier"></app-stat-card>
          <app-stat-card label="VALIDÉS" value="58" icon="✅" color="#276749" sub="Éligibles à soutenir"></app-stat-card>
          <app-stat-card label="REJETÉS" value="5" icon="❌" color="#9B2226" sub="Non conformes"></app-stat-card>
        </div>

        <!-- Tableau des dossiers -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 Dossiers en attente de vérification</span>
            <div class="filters">
              <input type="text" placeholder="Rechercher un étudiant..." class="search-input" [(ngModel)]="searchTerm" />
              <select class="filter-select" [(ngModel)]="niveauFiltre">
                <option value="">Tous niveaux</option>
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
              </select>
            </div>
          </div>
          <div class="table-wrapper">
            <table class="dossier-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Niveau</th>
                  <th>Titre du mémoire</th>
                  <th>UE</th>
                  <th>Paiement</th>
                  <th>Anti-IA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of dossiersFiltres">
                  <td class="cell-etudiant">
                    <div class="etudiant-nom">{{ d.etudiant }}</div>
                    <div class="etudiant-matricule">{{ d.matricule }}</div>
                  </td>
                  <td>{{ d.niveau }}</td>
                  <td class="cell-titre">{{ d.titre }}</td>
                  <td><app-badge [text]="d.ue" [variant]="d.ueStatus"></app-badge></td>
                  <td><app-badge [text]="d.paiement" [variant]="d.paiementStatus"></app-badge></td>
                  <td><app-badge [text]="d.antiIa" [variant]="d.antiIaStatus"></app-badge></td>
                  <td>
                    <button class="btn-verifier" (click)="ouvrirModal(d)">Vérifier</button>
                  </td>
                </tr>
                <tr *ngIf="dossiersFiltres.length === 0">
                  <td colspan="7" class="empty-row">Aucun dossier trouvé</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal de vérification -->
    <div class="modal-overlay" *ngIf="dossierSelectionne" (click)="fermerModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>🤖 Vérification anti-plagiat / anti-IA — {{ dossierSelectionne.etudiant }}</h3>
          <button class="modal-close" (click)="fermerModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="verif-grid">
            <!-- Taux de plagiat -->
            <div class="verif-card">
              <div class="verif-value" [class.alert]="dossierSelectionne.tauxPlagiat > 20">
                {{ dossierSelectionne.tauxPlagiat }}%
              </div>
              <div class="verif-label">Taux de plagiat</div>
              <app-badge 
                [text]="dossierSelectionne.tauxPlagiat <= 20 ? 'Acceptable (< 20%)' : 'Dépasse le seuil'"
                [variant]="dossierSelectionne.tauxPlagiat <= 20 ? 'success' : 'danger'">
              </app-badge>
            </div>

            <!-- Contenu IA -->
            <div class="verif-card">
              <div class="verif-value" [class.alert]="dossierSelectionne.tauxIa > 25">
                {{ dossierSelectionne.tauxIa }}%
              </div>
              <div class="verif-label">Contenu IA détecté</div>
              <app-badge 
                [text]="dossierSelectionne.tauxIa <= 25 ? 'Acceptable (< 25%)' : 'Dépasse le seuil'"
                [variant]="dossierSelectionne.tauxIa <= 25 ? 'success' : 'danger'">
              </app-badge>
            </div>

            <!-- Pages analysées -->
            <div class="verif-card">
              <div class="verif-value">{{ dossierSelectionne.nbPages }}</div>
              <div class="verif-label">Pages analysées</div>
              <app-badge text="Max Master: 120 pages" variant="info"></app-badge>
            </div>
          </div>

          <!-- Boutons d'action -->
          <div class="modal-actions">
            <button class="btn-modal valider" (click)="validerDossier()">✅ Valider malgré tout</button>
            <button class="btn-modal rejeter" (click)="rejeterDossier()">❌ Rejeter le mémoire</button>
            <button class="btn-modal correction" (click)="demanderCorrection()">💬 Demander correction</button>
          </div>

          <!-- Retour à la liste -->
          <div class="modal-retour">
            <button class="btn-retour" (click)="fermerModal()">← Retour à la liste</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .examen-layout {
      display: flex;
      min-height: 100vh;
      background: #F7F5F0;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #E2DDD4;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-avatar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid #E2DDD4;
      background: #FAF8F3;
    }
    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #9B2226;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
    }
    .avatar-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F2237;
    }
    .avatar-role {
      font-size: 11px;
      color: #718096;
      margin-top: 2px;
    }
    .sidebar-section {
      padding: 20px 20px 8px;
      font-size: 10px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      font-size: 13px;
      color: #4A5568;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
      text-decoration: none;
    }
    .nav-item:hover {
      background: #FAF8F3;
      color: #1A3C5E;
    }
    .nav-item.active {
      background: #FDF3E0;
      color: #C8963E;
      border-left-color: #C8963E;
      font-weight: 600;
    }
    .nav-icon {
      font-size: 18px;
      width: 24px;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      flex: 1;
      padding: 32px 40px;
      overflow-y: auto;
    }

    /* En-tête */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 800;
      color: #1A3C5E;
      margin-bottom: 8px;
    }
    .page-subtitle {
      font-size: 13px;
      color: #718096;
    }
    .btn-primary {
      background: #1A3C5E;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover {
      background: #2B6CB0;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 1000px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
    }

    /* Carte */
    .card {
      background: white;
      border-radius: 16px;
      border: 1px solid #E2DDD4;
      overflow: hidden;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: #FAF8F3;
      border-bottom: 1px solid #E2DDD4;
      flex-wrap: wrap;
      gap: 12px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #1A3C5E;
    }
    .filters {
      display: flex;
      gap: 12px;
    }
    .search-input, .filter-select {
      padding: 8px 12px;
      font-size: 12px;
      border: 1px solid #E2DDD4;
      border-radius: 6px;
      background: white;
    }

    /* Tableau */
    .table-wrapper {
      overflow-x: auto;
    }
    .dossier-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .dossier-table th {
      background: #F9F8F5;
      padding: 14px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      border-bottom: 1px solid #E2DDD4;
    }
    .dossier-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #E2DDD4;
      vertical-align: middle;
    }
    .cell-etudiant {
      min-width: 140px;
    }
    .etudiant-nom {
      font-weight: 700;
      color: #2D3748;
    }
    .etudiant-matricule {
      font-size: 11px;
      color: #718096;
      margin-top: 2px;
    }
    .cell-titre {
      min-width: 200px;
    }
    .btn-verifier {
      background: #1A3C5E;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-verifier:hover {
      background: #2B6CB0;
    }
    .empty-row {
      text-align: center;
      padding: 48px;
      color: #718096;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-container {
      background: white;
      border-radius: 20px;
      width: 90%;
      max-width: 750px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: #FAF8F3;
      border-bottom: 1px solid #E2DDD4;
    }
    .modal-header h3 {
      font-size: 16px;
      font-weight: 700;
      color: #1A3C5E;
      margin: 0;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #718096;
    }
    .modal-body {
      padding: 28px;
    }
    .verif-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }
    @media (max-width: 600px) {
      .verif-grid { grid-template-columns: 1fr; }
    }
    .verif-card {
      border: 1px solid #E2DDD4;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .verif-value {
      font-size: 40px;
      font-weight: 800;
      font-family: 'DM Mono', monospace;
      color: #1A3C5E;
    }
    .verif-value.alert {
      color: #9B2226;
    }
    .verif-label {
      font-size: 12px;
      color: #718096;
      margin: 12px 0;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .btn-modal {
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }
    .btn-modal.valider {
      background: #276749;
      color: white;
    }
    .btn-modal.rejeter {
      background: #9B2226;
      color: white;
    }
    .btn-modal.correction {
      background: #C8963E;
      color: white;
    }
    .modal-retour {
      border-top: 1px solid #E2DDD4;
      padding-top: 16px;
      text-align: left;
    }
    .btn-retour {
      background: none;
      border: none;
      color: #2B6CB0;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-retour:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { padding: 20px; }
    }
  `]
})
export class ExamenComponent {
  private examenService = inject(ExamenService);
  private toast = inject(ToastService);

  searchTerm = '';
  niveauFiltre = '';
  dossierSelectionne: Dossier | null = null;

  dossiers = signal<Dossier[]>([
    { id: 1, etudiant: 'Ama Koffi', matricule: 'M2-INFO-2025', niveau: 'Master 2', titre: 'Détection d\'intrusions ML', ue: '14/15', ueStatus: 'warning', paiement: 'Payé', paiementStatus: 'success', antiIa: 'En cours', antiIaStatus: 'warning', tauxPlagiat: 4, tauxIa: 31, nbPages: 98 },
    { id: 2, etudiant: 'Kofi Asante', matricule: 'M2-INFO-2025', niveau: 'Master 2', titre: 'Blockchain & sécurité des données', ue: '15/15', ueStatus: 'success', paiement: 'Payé', paiementStatus: 'success', antiIa: 'Validé', antiIaStatus: 'success', tauxPlagiat: 12, tauxIa: 8, nbPages: 112 },
    { id: 3, etudiant: 'Abena Mensah', matricule: 'L3-MATH-2025', niveau: 'Licence 3', titre: 'Optimisation des réseaux de transport', ue: '14/14', ueStatus: 'success', paiement: 'Non payé', paiementStatus: 'danger', antiIa: '—', antiIaStatus: 'neutral', tauxPlagiat: 2, tauxIa: 1, nbPages: 72 }
  ]);

  get dossiersFiltres(): Dossier[] {
    return this.dossiers().filter(d =>
      (this.searchTerm === '' || d.etudiant.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.niveauFiltre === '' || d.niveau.includes(this.niveauFiltre))
    );
  }

  ouvrirModal(dossier: Dossier) {
    this.dossierSelectionne = dossier;
  }

  fermerModal() {
    this.dossierSelectionne = null;
  }

  validerDossier() {
    if (this.dossierSelectionne) {
      this.toast.success(`Mémoire de ${this.dossierSelectionne.etudiant} validé`);
      this.fermerModal();
    }
  }

  rejeterDossier() {
    if (this.dossierSelectionne) {
      this.toast.error(`Mémoire de ${this.dossierSelectionne.etudiant} rejeté`);
      this.fermerModal();
    }
  }

  demanderCorrection() {
    if (this.dossierSelectionne) {
      this.toast.warning(`Demande de correction envoyée à ${this.dossierSelectionne.etudiant}`);
      this.fermerModal();
    }
  }

  exporterRapport() {
    this.toast.info('Export du rapport (simulé)');
  }
}
