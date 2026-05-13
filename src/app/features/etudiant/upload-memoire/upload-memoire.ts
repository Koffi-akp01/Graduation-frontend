import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { ToastService } from '../../../shared/services/toast';
import { StudentService } from '../../../core/services/student.service';

@Component({
  selector: 'app-upload-memoire',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="etudiant-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-avatar">
          <div class="avatar-circle">AK</div>
          <div>
            <div class="avatar-name">Ama Koffi</div>
            <div class="avatar-role">Étudiant · Master 2</div>
          </div>
        </div>

        <div class="sidebar-section">MON ESPACE</div>
        <a class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Tableau de bord</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">📄</span>
          <span class="nav-label">Mon mémoire</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">📁</span>
          <span class="nav-label">Déposer un document</span>
        </a>

        <div class="sidebar-section">SOUTENANCE</div>
        <a class="nav-item">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Ma soutenance</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">✅</span>
          <span class="nav-label">Éligibilité</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">💳</span>
          <span class="nav-label">Paiement des frais</span>
        </a>

        <div class="sidebar-section">RÉSULTATS</div>
        <a class="nav-item">
          <span class="nav-icon">🏆</span>
          <span class="nav-label">Mes résultats</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">🔔</span>
          <span class="nav-label">Notifications</span>
        </a>
      </aside>

      <!-- Contenu principal -->
      <main class="main-content">
        <div class="page-header">
          <div>
            <div class="page-title">Bonjour, Ama 👋</div>
            <div class="page-subtitle">Master 2 Informatique — Session de soutenance : Juillet 2025</div>
          </div>
          <button class="btn btn-gold" (click)="deposerMemoire()">📄 Déposer mon mémoire</button>
        </div>

        <!-- Stepper -->
        <div class="card stepper-card">
          <div class="stepper-title">Progression de mon dossier de soutenance</div>
          <div class="stepper">
            <div class="step" [ngClass]="{ done: etapes.themeValide }">
              <div class="step-circle">{{ etapes.themeValide ? '✓' : '1' }}</div>
              <div class="step-label">Thème validé</div>
            </div>
            <div class="step-line" [ngClass]="{ done: etapes.themeValide }"></div>
            <div class="step" [ngClass]="{ done: etapes.directeurAffecte }">
              <div class="step-circle">{{ etapes.directeurAffecte ? '✓' : '2' }}</div>
              <div class="step-label">Directeur affecté</div>
            </div>
            <div class="step-line" [ngClass]="{ done: etapes.directeurAffecte }"></div>
            <div class="step" [ngClass]="{ active: etapes.memoireDepose && !etapes.memoireValide, done: etapes.memoireValide }">
              <div class="step-circle">{{ etapes.memoireValide ? '✓' : '3' }}</div>
              <div class="step-label">Mémoire déposé</div>
            </div>
            <div class="step-line" [ngClass]="{ done: etapes.memoireValide }"></div>
            <div class="step" [ngClass]="{ active: etapes.eligible, done: etapes.soutenancePlanifiee }">
              <div class="step-circle">{{ etapes.soutenancePlanifiee ? '✓' : '4' }}</div>
              <div class="step-label">Validation mémoire</div>
            </div>
            <div class="step-line" [ngClass]="{ done: etapes.soutenancePlanifiee }"></div>
            <div class="step" [ngClass]="{ active: etapes.soutenancePlanifiee && !etapes.resultatsPubli, done: etapes.resultatsPubli }">
              <div class="step-circle">{{ etapes.resultatsPubli ? '✓' : '5' }}</div>
              <div class="step-label">Soutenance planifiée</div>
            </div>
            <div class="step-line" [ngClass]="{ done: etapes.resultatsPubli }"></div>
            <div class="step" [ngClass]="{ active: etapes.resultatsPubli }">
              <div class="step-circle">{{ etapes.resultatsPubli ? '✓' : '6' }}</div>
              <div class="step-label">Résultats publiés</div>
            </div>
          </div>
        </div>

        <!-- Cartes statistiques -->
        <div class="stats-grid">
          <app-stat-card label="Statut dossier" value="En cours" icon="📁" color="#2B6CB0" sub="Mémoire en attente de validation"></app-stat-card>
          <app-stat-card label="UE validées" value="14/15" icon="📚" color="#C8963E" sub="1 UE en attente de note"></app-stat-card>
          <app-stat-card label="Frais de soutenance" value="Payé ✓" icon="💳" color="#276749" sub="Reçu N° REC-2025-0418"></app-stat-card>
          <app-stat-card label="Délai restant" value="18j" icon="⏳" color="#9B2226" sub="Avant clôture des dépôts"></app-stat-card>
        </div>

        <!-- Deux colonnes -->
        <div class="two-col">
          <!-- Carte Mémoire -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">📄 Mon mémoire</span>
              <app-badge text="En révision" variant="warning"></app-badge>
            </div>
            <div class="card-body">
              <div class="info-row">
                <div class="info-label">TITRE</div>
                <div class="info-value">Système de détection d'intrusions basé sur le Machine Learning</div>
              </div>
              <div class="info-row-small">
                <div><span class="info-label-small">Directeur</span><br/><span class="info-value-small">Dr. Kofi Mensah</span></div>
                <div><span class="info-label-small">Niveau</span><br/><span class="info-value-small">Master 2</span></div>
                <div><span class="info-label-small">Version</span><br/><span class="info-value-small">v2.1</span></div>
              </div>
              <div class="progress-section">
                <div class="info-label">Progression du mémoire (98 / 120 pages)</div>
                <div class="progress"><div class="progress-bar blue" style="width:82%"></div></div>
              </div>
              <div class="alert alert-warning">
                ⚠ Commentaire du directeur : Merci de revoir la section 4.2 — bibliographie incomplète
              </div>
              <div class="action-buttons">
                <button class="btn btn-primary btn-sm" (click)="nouvelleVersion()">📤 Nouvelle version</button>
                <button class="btn btn-secondary btn-sm" (click)="consulterMemoire()">👁 Consulter</button>
              </div>
            </div>
          </div>

          <!-- Checklist éligibilité -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">✅ Checklist d'éligibilité</span>
            </div>
            <div class="checklist">
              <div class="check-item">
                <div class="check-icon ok">✓</div>
                <span>Toutes les UE obligatoires validées</span>
              </div>
              <div class="check-item">
                <div class="check-icon ok">✓</div>
                <span>Frais de soutenance payés</span>
              </div>
              <div class="check-item">
                <div class="check-icon ok">✓</div>
                <span>Thème de mémoire validé</span>
              </div>
              <div class="check-item">
                <div class="check-icon ok">✓</div>
                <span>Directeur de mémoire désigné</span>
              </div>
              <div class="check-item">
                <div class="check-icon pending">⋯</div>
                <span>Mémoire validé par le directeur</span>
              </div>
              <div class="check-item">
                <div class="check-icon nok">✗</div>
                <span>1 UE en attente (note non saisie)</span>
              </div>
              <div class="check-item">
                <div class="check-icon pending">⋯</div>
                <span>Vérification anti-plagiat / anti-IA</span>
              </div>
            </div>
            <div class="eligibility-footer">
              <div class="eligibility-label">Éligibilité globale</div>
              <div class="eligibility-value">5/7 critères</div>
              <div class="progress"><div class="progress-bar gold" style="width:71%"></div></div>
            </div>
          </div>
        </div>

        <!-- Soutenance planifiée -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📅 Ma soutenance planifiée</span>
          </div>
          <div class="soutenance-grid">
            <div>
              <div class="info-label">DATE & HEURE</div>
              <div class="soutenance-date">15 Juil. 2025</div>
              <div class="soutenance-time">09h30 — 10h30</div>
            </div>
            <div>
              <div class="info-label">SALLE</div>
              <div class="soutenance-value">Salle B204</div>
              <div class="soutenance-sub">Bâtiment B — 2ème étage</div>
            </div>
            <div>
              <div class="info-label">PRÉSIDENT DU JURY</div>
              <div class="soutenance-value">Pr. Jean Asante</div>
              <div class="soutenance-sub">Docteur d'État</div>
            </div>
            <div>
              <div class="info-label">EXAMINATEUR</div>
              <div class="soutenance-value">Dr. Afia Boateng</div>
              <div class="soutenance-sub">Docteur</div>
            </div>
          </div>
          <div class="convocation-btn">
            <button class="btn btn-secondary btn-sm">📥 Télécharger la convocation</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .etudiant-layout {
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
      background: #1A3C5E;
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
      margin-bottom: 24px;
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
    .btn-gold {
      background: #C8963E;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-gold:hover {
      background: #B07F30;
    }

    /* Stepper */
    .stepper-card {
      padding: 24px;
      margin-bottom: 24px;
    }
    .stepper-title {
      font-size: 13px;
      font-weight: 600;
      color: #1A3C5E;
      margin-bottom: 16px;
    }
    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .step:last-child {
      flex: none;
    }
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
      background: #E2DDD4;
      color: #718096;
    }
    .step.done .step-circle {
      background: #276749;
      color: white;
    }
    .step.active .step-circle {
      background: #C8963E;
      color: white;
      box-shadow: 0 0 0 4px rgba(200,150,62,0.2);
    }
    .step-label {
      font-size: 11px;
      font-weight: 600;
      color: #2D3748;
      white-space: nowrap;
    }
    .step-line {
      flex: 1;
      height: 2px;
      background: #E2DDD4;
      margin: 0 8px;
    }
    .step-line.done {
      background: #276749;
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

    /* Deux colonnes */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    @media (max-width: 800px) {
      .two-col { grid-template-columns: 1fr; }
    }

    /* Cartes */
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
      padding: 16px 20px;
      background: #FAF8F3;
      border-bottom: 1px solid #E2DDD4;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #1A3C5E;
    }
    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Info mémoire */
    .info-row {
      border-bottom: 1px solid #E2DDD4;
      padding-bottom: 12px;
    }
    .info-label {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #2D3748;
    }
    .info-row-small {
      display: flex;
      gap: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid #E2DDD4;
    }
    .info-label-small {
      font-size: 11px;
      color: #718096;
      text-transform: uppercase;
      font-weight: 600;
    }
    .info-value-small {
      font-size: 13px;
      font-weight: 500;
      color: #2D3748;
      margin-top: 4px;
    }
    .progress-section {
      margin-top: 4px;
    }
    .progress {
      height: 6px;
      background: #E2DDD4;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 6px;
    }
    .progress-bar {
      height: 100%;
      border-radius: 4px;
    }
    .progress-bar.blue { background: #2B6CB0; }
    .progress-bar.gold { background: #C8963E; }
    .alert-warning {
      background: #FFF3CD;
      border: 1px solid #FFE69C;
      color: #7B4F00;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .btn-sm {
      padding: 6px 14px;
      font-size: 12px;
    }
    .btn-primary {
      background: #1A3C5E;
      color: white;
    }
    .btn-secondary {
      background: white;
      color: #4A5568;
      border: 1px solid #E2DDD4;
    }

    /* Checklist */
    .checklist {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .check-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #2D3748;
    }
    .check-icon {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      flex-shrink: 0;
    }
    .check-icon.ok {
      background: #D8F3DC;
      color: #276749;
    }
    .check-icon.nok {
      background: #FFE8E8;
      color: #9B2226;
    }
    .check-icon.pending {
      background: #FFF3CD;
      color: #7B4F00;
    }
    .eligibility-footer {
      padding: 12px 20px;
      border-top: 1px solid #E2DDD4;
    }
    .eligibility-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #718096;
      margin-bottom: 6px;
    }
    .eligibility-value {
      font-weight: 700;
      color: #7B4F00;
    }

    /* Soutenance */
    .soutenance-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 20px;
    }
    @media (max-width: 800px) {
      .soutenance-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .soutenance-date {
      font-size: 18px;
      font-weight: 700;
      color: #1A3C5E;
      font-family: 'DM Mono', monospace;
    }
    .soutenance-time {
      font-size: 14px;
      color: #718096;
      font-family: 'DM Mono', monospace;
      margin-top: 4px;
    }
    .soutenance-value {
      font-size: 18px;
      font-weight: 700;
      color: #1A3C5E;
    }
    .soutenance-sub {
      font-size: 12px;
      color: #718096;
      margin-top: 4px;
    }
    .convocation-btn {
      padding: 0 20px 16px;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { padding: 20px; }
      .step-label { display: none; }
    }
  `]
  })
export class UploadMemoireComponent {
  private studentService = inject(StudentService);
  private toast = inject(ToastService);

  etapes = {
    themeValide: true,
    directeurAffecte: true,
    memoireDepose: true,
    memoireValide: false,
    eligible: false,
    soutenancePlanifiee: false,
    resultatsPubli: false
  };

  deposerMemoire() {
    this.toast.info('Redirection vers le dépôt de mémoire');
  }

  nouvelleVersion() {
    this.toast.info('Nouvelle version du mémoire');
  }

  consulterMemoire() {
    this.toast.info('Consultation du mémoire (PDF)');
  }
}