// datastore.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NewDatastore {
  name: string;
  description: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  schema: string;
}

@Component({
  selector: 'app-datastore',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datastore.html',
  styleUrls: ['./datastore.css']
})
export class DatastoreComponent {
  @Input() selectedWorkspace: string = '';
  
  @Output() datastoreCreated = new EventEmitter<NewDatastore>();

  newDatastore: NewDatastore = {
    name: '',
    description: '',
    host: '192.168.20.69',
    port: '5432',
    database: 'Anusha',
    username: 'postgres',
    password: 'postgres',
    schema: 'public'
  };

  onCreateDatastore(): void {
    if (!this.newDatastore.name.trim()) {
      alert('Please enter datastore name');
      return;
    }

    if (!this.newDatastore.database.trim()) {
      alert('Please enter database name');
      return;
    }

    this.datastoreCreated.emit({ ...this.newDatastore });
    
    // Reset form
    this.newDatastore = {
      name: '',
      description: '',
      host: '192.168.20.69',
      port: '5432',
      database: '',
      username: 'postgres',
      password: 'postgres',
      schema: 'public'
    };
  }
}