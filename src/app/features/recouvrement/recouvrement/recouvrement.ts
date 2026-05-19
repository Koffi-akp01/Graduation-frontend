import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared-module';
import { TopNav } from '../../../core/components/top-nav/top-nav';
import { ToastService } from '../../../shared/services/toast';
import { RecouvrementService } from '../../../core/services/recouvrement';

interface Paiement {
  etudiant: string;
  matricule: string;
  niveau: string;
  montant: number;
  mode: string;
  date: string;
  statut: 'Validé' | 'Impayé' | 'En vérification';
  statutVariant: 'success' | 'danger' | 'warning';
}

@Component({
  selector: 'app-recouvrement',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, TopNav],
  template: `
    <app-top-nav></app-top-nav>
    <div class="recouvrement-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-avatar">
          <div class="avatar-circle">SR</div>
          <div>
            <div class="avatar-name">Service Recouvrement</div>
            <div class="avatar-role">Gestion financière</div>
          </div>
        </div>

        <div class="sidebar-section">PAIEMENTS</div>
        <a class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Tableau de bord</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">💳</span>
          <span class="nav-label">Vérifier paiements</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">🧾</span>
          <span class="nav-label">Émettre un reçu</span>
        </a>
        <a class="nav-item">
          <span class="nav-icon">⚠️</span>
          <span class="nav-label">Alertes impayés</span>
        </a>

        <div class="sidebar-section">RAPPORTS</div>
        <a class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Rapport financier</span>
        </a>
      </aside>

      <!-- Contenu principal -->
      <main class="main-content">
        <div class="page-header">
          <div>
            <div class="page-title">Service Recouvrement</div>
            <div class="page-subtitle">Gestion des frais de soutenance — Session Juillet 2025</div>
          </div>
          <button class="btn btn-primary" (click)="genererRapport()">📊 Rapport financier</button>
        </div>

        <!-- Statistiques -->
        <div class="stats-grid">
          <app-stat-card label="Total frais attendus" value="1 740 000" icon="💰" color="#0F2237" sub="FCFA — 87 étudiants"></app-stat-card>
          <app-stat-card label="Frais encaissés" value="1 450 000" icon="✅" color="#276749" sub="FCFA — 72 réglés"></app-stat-card>
          <app-stat-card label="Impayés" value="290 000" icon="⚠️" color="#9B2226" sub="FCFA — 15 étudiants"></app-stat-card>
          <app-stat-card label="Reçus émis" value="72" icon="🧾" color="#C8963E" sub="Ce mois"></app-stat-card>
        </div>

        <!-- Tableau -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">💳 Suivi des paiements</span>
          </div>
          <div class="table-wrapper">
            <table class="paiement-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Niveau</th>
                  <th>Montant (FCFA)</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (p of paiements(); track p.etudiant) {
                <tr>
                  <td>
                    <div class="etudiant-nom">{{ p.etudiant }}</div>
                    <div class="etudiant-matricule">{{ p.matricule }}</div>
                  </td>
                  <td>{{ p.niveau }}</td>
                  <td>{{ p.montant | number:'1.0-0' }}</td>
                  <td>{{ p.mode }}</td>
                  <td>{{ p.date }}</td>
                  <td>
                    <app-badge [text]="p.statut" [variant]="p.statutVariant"></app-badge>
                  </td>
                  <td class="actions-cell">
                    @if (p.statut !== 'Validé') {
                      <button class="btn-valider" (click)="validerPaiement(p)">Valider</button>
                    }
                    <button class="btn-recu" (click)="telechargerRecu(p)">🧾 Reçu</button>
                  </td>
                </tr>
                } @empty {
                <tr>
                  <td colspan="7" class="empty-row">Aucun paiement trouvé</td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .recouvrement-layout {
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
      transition: background 0.2s;
    }
    .btn-primary:hover {
      background: #2B6CB0;
    }

    /* Grille des statistiques */
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .card-header {
      padding: 20px 24px;
      background: #FAF8F3;
      border-bottom: 1px solid #E2DDD4;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #1A3C5E;
    }

    /* Tableau */
    .table-wrapper {
      overflow-x: auto;
    }
    .paiement-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .paiement-table th {
      background: #F9F8F5;
      padding: 16px 20px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #E2DDD4;
    }
    .paiement-table td {
      padding: 16px 20px;
      border-bottom: 1px solid #E2DDD4;
      vertical-align: middle;
    }
    .etudiant-nom {
      font-weight: 700;
      color: #2D3748;
      margin-bottom: 4px;
    }
    .etudiant-matricule {
      font-size: 12px;
      color: #718096;
    }

    /* Boutons d'action */
    .actions-cell {
      white-space: nowrap;
    }
    .btn-valider {
      background: #276749;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      margin-right: 8px;
      transition: background 0.2s;
    }
    .btn-valider:hover {
      background: #1F5842;
    }
    .btn-recu {
      background: #C8963E;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-recu:hover {
      background: #B07F30;
    }
    .empty-row {
      text-align: center;
      padding: 48px;
      color: #718096;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
      .main-content {
        padding: 20px;
      }
    }
  `]
})
export class RecouvrementComponent {
  private recouvrementService = inject(RecouvrementService);
  private toast = inject(ToastService);

  paiements = signal<Paiement[]>([
    { etudiant: 'Ama Koffi', matricule: 'M2-INFO-2025', niveau: 'Master 2', montant: 20000, mode: 'Mobile Money', date: '28/05/2025', statut: 'Validé', statutVariant: 'success' },
    { etudiant: 'Abena Mensah', matricule: 'L3-MATH-2025', niveau: 'Licence 3', montant: 15000, mode: '—', date: '—', statut: 'Impayé', statutVariant: 'danger' },
    { etudiant: 'Yaw Boateng', matricule: 'M1-GESTION-2025', niveau: 'Master 1', montant: 20000, mode: 'Virement', date: '02/06/2025', statut: 'En vérification', statutVariant: 'warning' }
  ]);

  validerPaiement(p: Paiement) {
    this.toast.success(`Paiement de ${p.etudiant} validé`);
    p.statut = 'Validé';
    p.statutVariant = 'success';
  }

  telechargerRecu(p: Paiement) {
    this.toast.info(`Téléchargement du reçu pour ${p.etudiant} (simulé)`);
  }

  genererRapport() {
    this.toast.info('Génération du rapport financier (simulée)');
  }
}