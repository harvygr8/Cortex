import { Database } from 'sqlite3';
import { open } from 'sqlite';
import { ensureDir } from 'fs-extra';
import path from 'path';

class ProjectStore {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.db) return;
    
    await ensureDir('./data');
    
    this.db = await open({
      filename: './data/cortex.db',
      driver: Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        position_x REAL DEFAULT NULL,
        position_y REAL DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        order_index INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        sources TEXT,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        source_handle TEXT,
        target_handle TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );

      CREATE TABLE IF NOT EXISTS task_lists (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        source_handle TEXT,
        target_handle TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        task_list_id TEXT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_list_id) REFERENCES task_lists (id)
      );

      CREATE TABLE IF NOT EXISTS canvas_state (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        nodes_data TEXT,
        edges_data TEXT,
        viewport_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );
    `);

    // Add position columns to existing projects table if they don't exist
    try {
      await this.db.exec('ALTER TABLE projects ADD COLUMN position_x REAL DEFAULT NULL');
      console.log('[ProjectStore] Added position_x column to projects table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('[ProjectStore] Error adding position_x column:', error);
      }
    }

    try {
      await this.db.exec('ALTER TABLE projects ADD COLUMN position_y REAL DEFAULT NULL');
      console.log('[ProjectStore] Added position_y column to projects table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('[ProjectStore] Error adding position_y column:', error);
      }
    }

    // Add new columns to existing tables (migration)
    try {
      await this.db.exec(`
        ALTER TABLE chat_messages ADD COLUMN source_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db.exec(`
        ALTER TABLE chat_messages ADD COLUMN target_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db.exec(`
        ALTER TABLE task_lists ADD COLUMN source_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db.exec(`
        ALTER TABLE task_lists ADD COLUMN target_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
  }

  async addProject(title, description = '') {
    await this.initialize();
    const id = Date.now().toString();
    await this.db.run(
      'INSERT INTO projects (id, title, description) VALUES (?, ?, ?)',
      [id, title, description]
    );
    return this.getProject(id);
  }

  async addChapter(projectId, title) {
    await this.initialize();
    const maxOrder = await this.db.get(
      'SELECT MAX(order_index) as maxOrder FROM chapters WHERE project_id = ?',
      projectId
    );
    const orderIndex = (maxOrder?.maxOrder || -1) + 1;
    const id = Date.now().toString();
    
    await this.db.run(
      'INSERT INTO chapters (id, project_id, title, order_index) VALUES (?, ?, ?, ?)',
      [id, projectId, title, orderIndex]
    );
    
    const chapter = await this.db.get('SELECT * FROM chapters WHERE id = ?', id);
    chapter.pages = [];
    return chapter;
  }

  async addPage(projectId, title, content = '') {
    const maxOrder = await this.db.get(
      'SELECT MAX(order_index) as maxOrder FROM pages WHERE project_id = ?',
      projectId
    );
    const orderIndex = (maxOrder?.maxOrder || -1) + 1;
    const id = Date.now().toString();
    
    await this.db.run(
      'INSERT INTO pages (id, project_id, title, content, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, projectId, title, content, orderIndex]
    );
    return this.getPage(id);
  }

  async getProjectPages(projectId) {
    return this.db.all(
      'SELECT * FROM pages WHERE project_id = ? ORDER BY order_index',
      projectId
    );
  }

  async getProject(id) {
    const project = await this.db.get('SELECT * FROM projects WHERE id = ?', id);
    if (project) {
      project.pages = await this.getProjectPages(id);
    }
    return project;
  }


  async getAllProjects() {
    await this.initialize();
    const projects = await this.db.all('SELECT * FROM projects ORDER BY id DESC');
    for (const project of projects) {
      project.pages = await this.getProjectPages(project.id);
    }
    return projects;
  }

  async getChapter(id) {
    const chapter = await this.db.get('SELECT * FROM chapters WHERE id = ?', id);
    if (chapter) {
      chapter.pages = await this.getChapterPages(id);
    }
    return chapter;
  }

  async getPage(id) {
    await this.initialize();
    return this.db.get('SELECT * FROM pages WHERE id = ?', id);
  }

  async updatePage(id, title, content) {
    await this.db.run(
      'UPDATE pages SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );
    return this.getPage(id);
  }

  async deletePage(id) {
    await this.db.run('DELETE FROM pages WHERE id = ?', id);
  }

  async reorderPages(projectId, pageOrders) {
    const updates = pageOrders.map(({ id, order_index }) =>
      this.db.run(
        'UPDATE pages SET order_index = ? WHERE id = ? AND project_id = ?',
        [order_index, id, projectId]
      )
    );
    await Promise.all(updates);
  }

  async deleteProject(id) {
    await this.db.run('DELETE FROM pages WHERE project_id = ?', id);
    await this.db.run('DELETE FROM chat_messages WHERE project_id = ?', id);
    await this.db.run('DELETE FROM task_lists WHERE project_id = ?', id);
    await this.db.run('DELETE FROM canvas_state WHERE project_id = ?', id);
    await this.db.run('DELETE FROM projects WHERE id = ?', id);
  }

  async updateProject(id, title, description) {
    await this.db.run(
      'UPDATE projects SET title = ?, description = ? WHERE id = ?',
      [title, description, id]
    );
    return this.getProject(id);
  }

  // Chat Messages methods
  async addChatMessage(projectId, query, response, sources = null, positionX = 0, positionY = 0, sourceHandle = null, targetHandle = null) {
    await this.initialize();
    const id = Date.now().toString();
    const sourcesJson = sources ? JSON.stringify(sources) : null;
    
    await this.db.run(
      'INSERT INTO chat_messages (id, project_id, query, response, sources, position_x, position_y, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, query, response, sourcesJson, positionX, positionY, sourceHandle, targetHandle]
    );
    
    return this.getChatMessage(id);
  }

  async getChatMessage(id) {
    await this.initialize();
    const message = await this.db.get('SELECT * FROM chat_messages WHERE id = ?', id);
    if (message && message.sources) {
      message.sources = JSON.parse(message.sources);
    }
    return message;
  }

  async getChatMessagesByProject(projectId) {
    await this.initialize();
    const messages = await this.db.all(
      'SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at',
      projectId
    );
    
    return messages.map(message => {
      if (message.sources) {
        message.sources = JSON.parse(message.sources);
      }
      return message;
    });
  }

  async updateChatMessagePosition(id, positionX, positionY) {
    await this.initialize();
    await this.db.run(
      'UPDATE chat_messages SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getChatMessage(id);
  }

  async updateChatMessageHandles(id, sourceHandle, targetHandle) {
    await this.initialize();
    await this.db.run(
      'UPDATE chat_messages SET source_handle = ?, target_handle = ? WHERE id = ?',
      [sourceHandle, targetHandle, id]
    );
    return this.getChatMessage(id);
  }

  async updateChatMessageProject(id, projectId) {
    await this.initialize();
    await this.db.run(
      'UPDATE chat_messages SET project_id = ? WHERE id = ?',
      [projectId, id]
    );
    return this.getChatMessage(id);
  }

  async deleteChatMessage(id) {
    await this.initialize();
    await this.db.run('DELETE FROM chat_messages WHERE id = ?', id);
  }

  // Task Lists methods
  async addTaskList(projectId, title, positionX = 0, positionY = 0, sourceHandle = null, targetHandle = null) {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db.run(
      'INSERT INTO task_lists (id, project_id, title, position_x, position_y, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, title, positionX, positionY, sourceHandle, targetHandle]
    );
    
    return this.getTaskList(id);
  }

  async getTaskList(id) {
    await this.initialize();
    const taskList = await this.db.get('SELECT * FROM task_lists WHERE id = ?', id);
    if (taskList) {
      taskList.tasks = await this.getTasksByList(id);
    }
    return taskList;
  }

  async getTaskListsByProject(projectId) {
    await this.initialize();
    const taskLists = await this.db.all(
      'SELECT * FROM task_lists WHERE project_id = ? ORDER BY created_at',
      projectId
    );
    
    for (const taskList of taskLists) {
      taskList.tasks = await this.getTasksByList(taskList.id);
    }
    
    return taskLists;
  }

  async updateTaskListPosition(id, positionX, positionY) {
    await this.initialize();
    await this.db.run(
      'UPDATE task_lists SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getTaskList(id);
  }

  async updateTaskListHandles(id, sourceHandle, targetHandle) {
    await this.initialize();
    await this.db.run(
      'UPDATE task_lists SET source_handle = ?, target_handle = ? WHERE id = ?',
      [sourceHandle, targetHandle, id]
    );
    return this.getTaskList(id);
  }

  async updateTaskListProject(id, projectId) {
    await this.initialize();
    await this.db.run(
      'UPDATE task_lists SET project_id = ? WHERE id = ?',
      [projectId, id]
    );
    return this.getTaskList(id);
  }

  async deleteTaskList(id) {
    await this.initialize();
    await this.db.run('DELETE FROM tasks WHERE task_list_id = ?', id);
    await this.db.run('DELETE FROM task_lists WHERE id = ?', id);
  }

  // Tasks methods
  async addTask(taskListId, text, orderIndex = 0) {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db.run(
      'INSERT INTO tasks (id, task_list_id, text, completed, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, taskListId, text, false, orderIndex]
    );
    
    return this.getTask(id);
  }

  async getTask(id) {
    await this.initialize();
    const task = await this.db.get('SELECT * FROM tasks WHERE id = ?', id);
    if (task) {
      // Convert SQLite integer boolean to JavaScript boolean
      task.completed = Boolean(task.completed);
    }
    return task;
  }

  async getTasksByList(taskListId) {
    await this.initialize();
    const tasks = await this.db.all(
      'SELECT * FROM tasks WHERE task_list_id = ? ORDER BY order_index, created_at',
      taskListId
    );
    // Convert SQLite integer booleans to JavaScript booleans
    return tasks.map(task => ({
      ...task,
      completed: Boolean(task.completed)
    }));
  }

  async updateTask(id, updates) {
    await this.initialize();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    
    values.push(id);
    
    await this.db.run(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getTask(id);
  }

  async toggleTask(id) {
    await this.initialize();
    const task = await this.getTask(id);
    if (task) {
      await this.updateTask(id, { completed: !task.completed });
    }
    return this.getTask(id);
  }

  async deleteTask(id) {
    await this.initialize();
    await this.db.run('DELETE FROM tasks WHERE id = ?', id);
  }

  // Canvas State methods
  async saveCanvasState(projectId, nodesData, edgesData, viewportData) {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db.run(
      'DELETE FROM canvas_state WHERE project_id = ?',
      projectId
    );
    
    await this.db.run(
      'INSERT INTO canvas_state (id, project_id, nodes_data, edges_data, viewport_data) VALUES (?, ?, ?, ?, ?)',
      [id, projectId, JSON.stringify(nodesData), JSON.stringify(edgesData), JSON.stringify(viewportData)]
    );
    
    return this.getCanvasState(projectId);
  }

  async getCanvasState(projectId) {
    await this.initialize();
    const state = await this.db.get('SELECT * FROM canvas_state WHERE project_id = ?', projectId);
    if (state) {
      state.nodes_data = JSON.parse(state.nodes_data);
      state.edges_data = JSON.parse(state.edges_data);
      state.viewport_data = JSON.parse(state.viewport_data);
    }
    return state;
  }

  async deleteCanvasState(projectId) {
    await this.initialize();
    await this.db.run('DELETE FROM canvas_state WHERE project_id = ?', projectId);
  }

  // Project position methods
  async updateProjectPosition(projectId, x, y) {
    await this.initialize();
    await this.db.run(
      'UPDATE projects SET position_x = ?, position_y = ? WHERE id = ?',
      [x, y, projectId]
    );
  }
}

const projectStore = new ProjectStore();
export default projectStore; 