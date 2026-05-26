import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { TopNav } from '../../../../core/components/top-nav/top-nav';
import { AuditLog, GlobalStats, UserListItem } from '../../../../core/models/admin.model';
import { AdminService } from '../../../../core/services/admin/admin';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, TopNav],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<GlobalStats | null>(null);
  logs  = signal<AuditLog[]>([]);
  users = signal<UserListItem[]>([]);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getGlobalStats()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => { if (data) this.stats.set(data); });
    this.adminService.getAuditLogs()
      .pipe(catchError(() => of([])))
      .subscribe((data) => this.logs.set(data));
    this.adminService.getUsersList()
      .pipe(catchError(() => of([])))
      .subscribe((data) => this.users.set(data));
  }

  roleBadgeClass(roleCode: string): string {
    const map: Record<string, string> = {
      STUDENT:            'badge-info',
      INTERNAL_TRAINER:   'badge-pending',
      EXTERNAL_TRAINER:   'badge-pending',
      ADMIN_ACADEMIC:     'badge-gold',
      EXAMINER:           'badge-neutral',
      PRESIDENT_JURY:     'badge-neutral',
    };
    return map[roleCode] ?? 'badge-neutral';
  }

  creerUtilisateur(): void {
    // TODO: ouvrir modal création utilisateur
  }

  exporterDonnees(): void {
    this.adminService.downloadReporting().subscribe();
  }
}
