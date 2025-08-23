import { Component, State } from '@onedot/core';
import { render } from '@onedot/web';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'todo-app',
  template: `
    <div class="todo-app">
      <h1>ONEDOT-JS Todo App</h1>
      <form class="todo-form" @submit="addTodo">
        <input
          type="text"
          placeholder="Add a new task..."
          value="{{newTodoText}}"
          @input="updateNewTodoText"
        />
        <button type="submit">Add</button>
      </form>

      <div class="todo-list">
        {{#each todos as todo}}
          <div class="todo-item {{#if todo.completed}}completed{{/if}}">
            <input
              type="checkbox"
              checked="{{todo.completed}}"
              @change="toggleTodo(todo.id)"
            />
            <span>{{todo.text}}</span>
            <button @click="deleteTodo(todo.id)">Delete</button>
          </div>
        {{/each}}
      </div>

      <div class="todo-stats">
        <span>{{todos.length}} tasks total</span>
        <span>{{activeTodosCount}} active</span>
        <span>{{completedTodosCount}} completed</span>
      </div>

      <div class="todo-filters">
        <button @click="setFilter('all')" class="{{#if filter === 'all'}}active{{/if}}">All</button>
        <button @click="setFilter('active')" class="{{#if filter === 'active'}}active{{/if}}">Active</button>
        <button @click="setFilter('completed')" class="{{#if filter === 'completed'}}active{{/if}}">Completed</button>
      </div>
    </div>
  `,
  styles: `
    .todo-app {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .todo-form {
      display: flex;
      margin-bottom: 20px;
    }

    .todo-form input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 10px;
    }

    .todo-form button {
      padding: 10px 15px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .todo-item {
      display: flex;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }

    .todo-item.completed {
      text-decoration: line-through;
      color: #888;
    }

    .todo-item span {
      flex: 1;
      margin: 0 10px;
    }

    .todo-item button {
      padding: 5px 10px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .todo-stats {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      font-size: 14px;
      color: #666;
    }

    .todo-filters {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    .todo-filters button {
      padding: 8px 15px;
      margin: 0 5px;
      background: #f0f0f0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .todo-filters button.active {
      background: #2196F3;
      color: white;
    }
  `
})
export class TodoApp {
  @State() todos: Todo[] = [];
  @State() newTodoText: string = '';
  @State() filter: 'all' | 'active' | 'completed' = 'all';

  get filteredTodos(): Todo[] {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(todo => !todo.completed);
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      default:
        return this.todos;
    }
  }

  get activeTodosCount(): number {
    return this.todos.filter(todo => !todo.completed).length;
  }

  get completedTodosCount(): number {
    return this.todos.filter(todo => todo.completed).length;
  }

  constructor() {
    // Load todos from localStorage
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      this.todos = JSON.parse(savedTodos);
    }
  }

  addTodo(event: Event) {
    event.preventDefault();

    if (this.newTodoText.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now(),
      text: this.newTodoText,
      completed: false
    };

    this.todos = [...this.todos, newTodo];
    this.newTodoText = '';
    this.saveTodos();
  }

  updateNewTodoText(event: Event) {
    this.newTodoText = (event.target as HTMLInputElement).value;
  }

  toggleTodo(id: number) {
    this.todos = this.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.saveTodos();
  }

  deleteTodo(id: number) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.saveTodos();
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    this.filter = filter;
  }

  saveTodos() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }
}

// Initialize and render the app
const app = new TodoApp();
render(app, document.getElementById('app'));
