import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TodoService } from '../../services/todo';
import { AuthService } from '../../services/auth';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo',
  imports: [FormsModule],
  templateUrl: './todo.html',
  styleUrl: './todo.css'
})
export class Todo {

  newTask = '';
  tasks: Task[] = [];
  username = '';

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private router: Router
  ) {
    this.username = this.authService.getUsername() || '';
  }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {

    this.todoService
      .getTasks()
      .subscribe({

        next: (tasks) => {
          this.tasks = tasks;
        },

        error: (error) => {
          console.error('Erreur chargement tâches :', error);
        }

      });
  }

  addTask() {

    if (this.newTask.trim() === '') {
      return;
    }

    this.todoService
      .addTask(this.newTask.trim())
      .subscribe({

        next: (task) => {
          this.tasks.push(task);
          this.newTask = '';
        },

        error: (error) => {
          console.error('Erreur ajout tâche :', error);
        }

      });
  }

  editTask(task: Task) {

    const newTitle = prompt(
      'Modifier la tâche :',
      task.title
    );

    if (
      newTitle === null ||
      newTitle.trim() === ''
    ) {
      return;
    }

    const updatedTask: Task = {
      id: task.id,
      title: newTitle.trim(),
      completed: task.completed
    };

    this.todoService
      .updateTask(updatedTask)
      .subscribe({

        next: (updatedTask) => {
          task.title = updatedTask.title;
        },

        error: (error) => {
          console.error('Erreur modification :', error);
        }

      });
  }

  toggleTask(task: Task) {

    this.todoService
      .updateTask(task)
      .subscribe({

        next: (updatedTask) => {
          task.completed = updatedTask.completed;
        },

        error: (error) => {
          console.error('Erreur modification état :', error);
        }

      });
  }

  deleteTask(task: Task) {

  const confirmed = confirm(
    `Supprimer la tâche "${task.title}" ?`
  );

  if (!confirmed) {
    return;
  }

  this.todoService
    .deleteTask(task.id)
    .subscribe({

      next: () => {
        this.tasks =
          this.tasks.filter(t => t.id !== task.id);
      },

      error: (error) => {
        console.error(
          'Erreur suppression :',
          error
        );
      }

    });
}

  logout() {

    this.authService.logout();

    this.router.navigate(['/login']);
  }
}