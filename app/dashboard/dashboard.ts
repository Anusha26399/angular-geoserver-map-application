// dashboard.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DashboardStats {
  workspacesCount: number;
  datastoresCount: number;
  activeLayersCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {
  @Input() stats: DashboardStats = {
    workspacesCount: 0,
    datastoresCount: 0,
    activeLayersCount: 0
  };

  @Output() refreshData = new EventEmitter<void>();

  onRefreshData(): void {
    this.refreshData.emit();
  }
}