// upload.component.ts
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UploadState {
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadMessage: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent {
  @Input() selectedWorkspace: string = '';
  @Input() selectedDatastore: string = '';
  
  @Output() fileUploaded = new EventEmitter<File>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  uploadState: UploadState = {
    selectedFile: null,
    isUploading: false,
    uploadProgress: 0,
    uploadMessage: ''
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Please select a ZIP file containing shapefile components');
        return;
      }

      this.uploadState.selectedFile = file;
      this.uploadState.uploadMessage = `Selected: ${file.name}`;
    }
  }

  onUploadShapefile(): void {
    if (!this.uploadState.selectedFile || !this.selectedWorkspace || !this.selectedDatastore) {
      alert('Please select a file, workspace, and datastore');
      return;
    }

    this.fileUploaded.emit(this.uploadState.selectedFile);
  }

  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  // Method to update upload state from parent component
  updateUploadState(state: Partial<UploadState>): void {
    this.uploadState = { ...this.uploadState, ...state };
  }

  // Method to clear upload state
  clearUpload(): void {
    this.uploadState = {
      selectedFile: null,
      isUploading: false,
      uploadProgress: 0,
      uploadMessage: ''
    };
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}