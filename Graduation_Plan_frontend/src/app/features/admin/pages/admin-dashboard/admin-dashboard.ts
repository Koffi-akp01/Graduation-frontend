import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

import { AuditLog, GlobalStats } from '../../../../core/models/admin.model';
import { AdminService } from '../../../../core/services/admin/admin';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<GlobalStats | null>(null);
  logs = signal<AuditLog[]>([]);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getGlobalStats().subscribe((data) => this.stats.set(data));
    this.adminService.getAuditLogs().subscribe((data) => this.logs.set(data));
  }

  exporterDonnees(): void {
    this.adminService.downloadReporting().subscribe();
  }
}
