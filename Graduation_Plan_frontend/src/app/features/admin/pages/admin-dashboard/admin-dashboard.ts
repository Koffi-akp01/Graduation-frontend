import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuditLog, GlobalStats, UserListItem, CreateUserForm } from '../../../../core/models/admin.model';
import { AdminService } from '../../../../core/services/admin/admin';

export type AdminVue = 'dashboard' | 'utilisateurs' | 'audit';

const ROLES_CHOICES = [
  { code: 'STUDENT',             label: 'Étudiant' },
  { code: 'INTERNAL_TRAINER',    label: 'Directeur interne' },
  { code: 'EXTERNAL_TRAINER',    label: 'Directeur externe' },
  { code: 'ADMIN_ACADEMIC',      label: 'Direction Académique' },
  { code: 'CHEF_SERVICE_EXAM',   label: 'Chef Service Examen' },
  { code: 'SERVICE_RECOUVREMENT', label: 'Service Recouvrement' },
  { code: 'CHARGE_ORGANISATION', label: 'Chargé Organisation' },
  { code: 'EXAMINER',            label: 'Examinateur' },
  { code: 'PRESIDENT_JURY',      label: 'Président du jury' },
];

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, RouterLinkActive, TopNav],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  // ── Navigation ────────────────────────────────────────────────────────
  vue = signal<AdminVue>('dashboard');

  // ── Données ───────────────────────────────────────────────────────────
  stats   = signal<GlobalStats | null>(null);
  logs    = signal<AuditLog[]>([]);
  users   = signal<UserListItem[]>([]);
  loading = signal(false);

  // ── Filtres utilisateurs ──────────────────────────────────────────────
  searchUser  = signal('');
  filtreRole  = signal('');
  readonly roles = ROLES_CHOICES;

  filteredUsers = computed(() => {
    const q = this.searchUser().toLowerCase();
    const r = this.filtreRole();
    return this.users().filter(u => {
      const matchQ = !q || u.nom.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchR = !r || u.role_code === r;
      return matchQ && matchR;
    });
  });

  // ── Création utilisateur ──────────────────────────────────────────────
  showCreateModal = signal(false);
  createForm: CreateUserForm = this.emptyForm();
  createLoading  = signal(false);
  createError    = signal('');
  createSuccess  = signal('');

  // ── Toggle actif ──────────────────────────────────────────────────────
  toggleInProg = signal<number | null>(null);

  // ── Messages globaux ──────────────────────────────────────────────────
  successMsg = signal('');
  errorMsg   = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.adminService.getGlobalStats()
      .pipe(catchError(() => of(null)))
      .subscribe(d => { if (d) this.stats.set(d); });

    this.adminService.getAuditLogs()
      .pipe(catchError(() => of([])))
      .subscribe(d => this.logs.set(d));

    this.adminService.getUsersList()
      .pipe(catchError(() => of([])))
      .subscribe(d => { this.users.set(d); this.loading.set(false); });
  }

  setVue(v: AdminVue): void {
    this.vue.set(v);
    this.successMsg.set('');
    this.errorMsg.set('');
  }

  // ── Création utilisateur ──────────────────────────────────────────────
  ouvrirModal(): void {
    this.createForm = this.emptyForm();
    this.createError.set('');
    this.createSuccess.set('');
    this.showCreateModal.set(true);
  }

  fermerModal(): void {
    this.showCreateModal.set(false);
  }

  soumettre(): void {
    const f = this.createForm;
    if (!f.first_name || !f.last_name || !f.email || !f.password) {
      this.createError.set('Tous les champs marqués * sont obligatoires.');
      return;
    }
    this.createLoading.set(true);
    this.createError.set('');
    this.adminService.createUser(f).subscribe({
      next: (user) => {
        this.createSuccess.set(`✅ ${user.nom} créé avec succès (${user.role}).`);
        this.createLoading.set(false);
        this.users.update(list => [user, ...list]);
        setTimeout(() => this.fermerModal(), 1800);
      },
      error: (err) => {
        this.createError.set(err?.error?.detail ?? 'Erreur lors de la création.');
        this.createLoading.set(false);
      },
    });
  }

  // ── Toggle actif/inactif ──────────────────────────────────────────────
  toggleActif(user: UserListItem): void {
    const action = user.actif ? 'désactiver' : 'activer';
    if (!confirm(`Voulez-vous ${action} le compte de ${user.nom} ?`)) return;
    this.toggleInProg.set(user.id);
    this.adminService.toggleUser(user.id).subscribe({
      next: (res) => {
        this.successMsg.set(res.message);
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, actif: res.actif } : u)
        );
        this.toggleInProg.set(null);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.detail ?? 'Erreur.');
        this.toggleInProg.set(null);
      },
    });
  }

  // ── Export ────────────────────────────────────────────────────────────
  exporterDonnees(): void {
    this.adminService.downloadReporting().subscribe();
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  roleBadgeClass(roleCode: string): string {
    const map: Record<string, string> = {
      STUDENT:              'badge-info',
      INTERNAL_TRAINER:     'badge-pending',
      EXTERNAL_TRAINER:     'badge-pending',
      ADMIN_ACADEMIC:       'badge-gold',
      CHEF_SERVICE_EXAM:    'badge-warn',
      SERVICE_RECOUVREMENT: 'badge-neutral',
      CHARGE_ORGANISATION:  'badge-neutral',
      EXAMINER:             'badge-neutral',
      PRESIDENT_JURY:       'badge-neutral',
    };
    return map[roleCode] ?? 'badge-neutral';
  }

  private emptyForm(): CreateUserForm {
    return { first_name: '', last_name: '', email: '', role: 'STUDENT', password: '' };
  }
}
