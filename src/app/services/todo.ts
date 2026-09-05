import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  // Récupérer les tâches
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  // Ajouter une tâche
  addTask(title: string): Observable<Task> {
    return this.http.post<Task>(
      this.apiUrl,
      {
        title: title
      }
    );
  }

  // Modifier une tâche
  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(
      `${this.apiUrl}/${task.id}`,
      task
    );
  }

  // Supprimer une tâche
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}