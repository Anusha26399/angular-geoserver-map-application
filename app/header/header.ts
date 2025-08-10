import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Workspace {
  name: string;
  description?: string;
}

interface NewWorkspace {
  name: string;
  description: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @Input() workspaces: Workspace[] = [];
  @Input() selectedWorkspace: string = '';
  @Input() isPanelOpen: boolean = false;

  @Output() togglePanel = new EventEmitter<void>();
  @Output() workspaceChanged = new EventEmitter<string>();
  @Output() createWorkspace = new EventEmitter<NewWorkspace>();

  showAddWorkspace = false;
  newWorkspace: NewWorkspace = {
    name: '',
    description: ''
  };

  onTogglePanel(): void {
    this.togglePanel.emit();
  }

  onWorkspaceChange(): void {
    this.workspaceChanged.emit(this.selectedWorkspace);
  }

  onCreateWorkspace(): void {
    if (!this.newWorkspace.name.trim()) {
      alert('Please enter a workspace name');
      return;
    }

    this.createWorkspace.emit({ ...this.newWorkspace });
    this.newWorkspace = { name: '', description: '' };
    this.showAddWorkspace = false;
  }

  toggleAddWorkspace(): void {
    this.showAddWorkspace = !this.showAddWorkspace;
  }
}