import { Database } from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import { ensureDir } from 'fs-extra';
import path from 'path';

interface PageOrder {
  id: string;
  order_index: number;
}

interface TaskUpdates {
  text?: string;
  completed?: boolean;
  order_index?: number;
}

class ProjectStore {
  private db: SqliteDatabase | null = null;
  private initialized: boolean = false;

  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    if (this.db) return;
    
    await ensureDir('./data');
    
    this.db = await open({
      filename: './data/cortex.db',
      driver: Database
    });

    await this.db!.exec(`
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

      CREATE TABLE IF NOT EXISTS scratchpads (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        text TEXT DEFAULT '',
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        source_handle TEXT,
        target_handle TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );

      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        image_alt TEXT DEFAULT '',
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        source_handle TEXT,
        target_handle TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );

      CREATE TABLE IF NOT EXISTS containers (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        label TEXT DEFAULT 'Container',
        color TEXT DEFAULT '#3b82f6',
        position_x REAL DEFAULT 0,
        position_y REAL DEFAULT 0,
        width REAL DEFAULT 300,
        height REAL DEFAULT 200,
        z_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );
    `);

    // Add position columns to existing projects table if they don't exist
    try {
      await this.db!.exec('ALTER TABLE projects ADD COLUMN position_x REAL DEFAULT NULL');
      console.log('[ProjectStore] Added position_x column to projects table');
    } catch (error) {
      if (!(error as Error).message.includes('duplicate column name')) {
        console.error('[ProjectStore] Error adding position_x column:', error);
      }
    }

    try {
      await this.db!.exec('ALTER TABLE projects ADD COLUMN position_y REAL DEFAULT NULL');
      console.log('[ProjectStore] Added position_y column to projects table');
    } catch (error) {
      if (!(error as Error).message.includes('duplicate column name')) {
        console.error('[ProjectStore] Error adding position_y column:', error);
      }
    }

    // Add new columns to existing tables (migration)
    try {
      await this.db!.exec(`
        ALTER TABLE chat_messages ADD COLUMN source_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db!.exec(`
        ALTER TABLE chat_messages ADD COLUMN target_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db!.exec(`
        ALTER TABLE task_lists ADD COLUMN source_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }

    try {
      await this.db!.exec(`
        ALTER TABLE task_lists ADD COLUMN target_handle TEXT;
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
  }

  async addProject(title: string, description: string = ''): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    await this.db!.run(
      'INSERT INTO projects (id, title, description) VALUES (?, ?, ?)',
      [id, title, description]
    );
    return this.getProject(id);
  }

  async addChapter(projectId: string, title: string): Promise<any> {
    await this.initialize();
    const maxOrder = await this.db!.get(
      'SELECT MAX(order_index) as maxOrder FROM chapters WHERE project_id = ?',
      projectId
    );
    const orderIndex = (maxOrder?.maxOrder || -1) + 1;
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO chapters (id, project_id, title, order_index) VALUES (?, ?, ?, ?)',
      [id, projectId, title, orderIndex]
    );
    
    const chapter = await this.db!.get('SELECT * FROM chapters WHERE id = ?', id);
    chapter.pages = [];
    return chapter;
  }

  async addPage(projectId: string, title: string, content: string = ''): Promise<any> {
    const maxOrder = await this.db!.get(
      'SELECT MAX(order_index) as maxOrder FROM pages WHERE project_id = ?',
      projectId
    );
    const orderIndex = (maxOrder?.maxOrder || -1) + 1;
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO pages (id, project_id, title, content, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, projectId, title, content, orderIndex]
    );
    return this.getPage(id);
  }

  async getProjectPages(projectId: string): Promise<any[]> {
    return this.db!.all(
      'SELECT * FROM pages WHERE project_id = ? ORDER BY order_index',
      projectId
    );
  }

  async getProject(id: string): Promise<any> {
    const project = await this.db!.get('SELECT * FROM projects WHERE id = ?', id);
    if (project) {
      project.pages = await this.getProjectPages(id);
    }
    return project;
  }


  async getAllProjects(): Promise<any[]> {
    await this.initialize();
    const projects = await this.db!.all('SELECT * FROM projects ORDER BY id DESC');
    for (const project of projects) {
      project.pages = await this.getProjectPages(project.id);
    }
    return projects;
  }

  async getChapter(id: string): Promise<any> {
    const chapter = await this.db!.get('SELECT * FROM chapters WHERE id = ?', id);
    if (chapter) {
      chapter.pages = await this.getChapterPages(id);
    }
    return chapter;
  }

  async getChapterPages(id: string): Promise<any[]> {
    await this.initialize();
    return this.db!.all(
      'SELECT * FROM pages WHERE chapter_id = ? ORDER BY order_index',
      id
    );
  }

  async getPage(id: string): Promise<any> {
    await this.initialize();
    return this.db!.get('SELECT * FROM pages WHERE id = ?', id);
  }

  async updatePage(id: string, title: string, content: string): Promise<any> {
    await this.db!.run(
      'UPDATE pages SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );
    return this.getPage(id);
  }

  async deletePage(id: string): Promise<void> {
    await this.db!.run('DELETE FROM pages WHERE id = ?', id);
  }

  async reorderPages(projectId: string, pageOrders: PageOrder[]): Promise<void> {
    const updates = pageOrders.map(({ id, order_index }) =>
      this.db!.run(
        'UPDATE pages SET order_index = ? WHERE id = ? AND project_id = ?',
        [order_index, id, projectId]
      )
    );
    await Promise.all(updates);
  }


  async updateProject(id: string, title: string, description: string): Promise<any> {
    await this.db!.run(
      'UPDATE projects SET title = ?, description = ? WHERE id = ?',
      [title, description, id]
    );
    return this.getProject(id);
  }

  // Chat Messages methods
  async addChatMessage(projectId: string, query: string, response: string, sources: any = null, positionX: number = 0, positionY: number = 0, sourceHandle: string | null = null, targetHandle: string | null = null): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    const sourcesJson = sources ? JSON.stringify(sources) : null;
    
    await this.db!.run(
      'INSERT INTO chat_messages (id, project_id, query, response, sources, position_x, position_y, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, query, response, sourcesJson, positionX, positionY, sourceHandle, targetHandle]
    );
    
    return this.getChatMessage(id);
  }

  async getChatMessage(id: string): Promise<any> {
    await this.initialize();
    const message = await this.db!.get('SELECT * FROM chat_messages WHERE id = ?', id);
    if (message && message.sources) {
      message.sources = JSON.parse(message.sources);
    }
    return message;
  }

  async getChatMessagesByProject(projectId: string): Promise<any[]> {
    await this.initialize();
    const messages = await this.db!.all(
      'SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at',
      projectId
    );
    
    return messages.map((message: any) => {
      if (message.sources) {
        message.sources = JSON.parse(message.sources);
      }
      return message;
    });
  }

  async updateChatMessagePosition(id: string, positionX: number, positionY: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE chat_messages SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getChatMessage(id);
  }

  async updateChatMessageHandles(id: string, sourceHandle: string | null, targetHandle: string | null): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE chat_messages SET source_handle = ?, target_handle = ? WHERE id = ?',
      [sourceHandle, targetHandle, id]
    );
    return this.getChatMessage(id);
  }

  async updateChatMessageProject(id: string, projectId: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE chat_messages SET project_id = ? WHERE id = ?',
      [projectId, id]
    );
    return this.getChatMessage(id);
  }

  async deleteChatMessage(id: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM chat_messages WHERE id = ?', id);
  }

  // Task Lists methods
  async addTaskList(projectId: string, title: string, positionX: number = 0, positionY: number = 0, sourceHandle: string | null = null, targetHandle: string | null = null): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO task_lists (id, project_id, title, position_x, position_y, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, title, positionX, positionY, sourceHandle, targetHandle]
    );
    
    return this.getTaskList(id);
  }

  async getTaskList(id: string): Promise<any> {
    await this.initialize();
    const taskList = await this.db!.get('SELECT * FROM task_lists WHERE id = ?', id);
    if (taskList) {
      taskList.tasks = await this.getTasksByList(id);
    }
    return taskList;
  }

  async getTaskListsByProject(projectId: string): Promise<any[]> {
    await this.initialize();
    const taskLists = await this.db!.all(
      'SELECT * FROM task_lists WHERE project_id = ? ORDER BY created_at',
      projectId
    );
    
    for (const taskList of taskLists) {
      taskList.tasks = await this.getTasksByList(taskList.id);
    }
    
    return taskLists;
  }

  async updateTaskListPosition(id: string, positionX: number, positionY: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE task_lists SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getTaskList(id);
  }

  async updateTaskListHandles(id: string, sourceHandle: string | null, targetHandle: string | null): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE task_lists SET source_handle = ?, target_handle = ? WHERE id = ?',
      [sourceHandle, targetHandle, id]
    );
    return this.getTaskList(id);
  }

  async updateTaskListProject(id: string, projectId: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE task_lists SET project_id = ? WHERE id = ?',
      [projectId, id]
    );
    return this.getTaskList(id);
  }

  async deleteTaskList(id: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM tasks WHERE task_list_id = ?', id);
    await this.db!.run('DELETE FROM task_lists WHERE id = ?', id);
  }

  // Tasks methods
  async addTask(taskListId: string, text: string, orderIndex: number = 0): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO tasks (id, task_list_id, text, completed, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, taskListId, text, false, orderIndex]
    );
    
    return this.getTask(id);
  }

  async getTask(id: string): Promise<any> {
    await this.initialize();
    const task = await this.db!.get('SELECT * FROM tasks WHERE id = ?', id);
    if (task) {
      // Convert SQLite integer boolean to JavaScript boolean
      task.completed = Boolean(task.completed);
    }
    return task;
  }

  async getTasksByList(taskListId: string): Promise<any[]> {
    await this.initialize();
    const tasks = await this.db!.all(
      'SELECT * FROM tasks WHERE task_list_id = ? ORDER BY order_index, created_at',
      taskListId
    );
    // Convert SQLite integer booleans to JavaScript booleans
    return tasks.map((task: any) => ({
      ...task,
      completed: Boolean(task.completed)
    }));
  }

  async updateTask(id: string, updates: TaskUpdates): Promise<any> {
    await this.initialize();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    
    values.push(id);
    
    await this.db!.run(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getTask(id);
  }

  async toggleTask(id: string): Promise<any> {
    await this.initialize();
    const task = await this.getTask(id);
    if (task) {
      await this.updateTask(id, { completed: !task.completed });
    }
    return this.getTask(id);
  }

  async deleteTask(id: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM tasks WHERE id = ?', id);
  }

  // Canvas State methods
  async saveCanvasState(projectId: string, nodesData: any, edgesData: any, viewportData: any): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db!.run(
      'DELETE FROM canvas_state WHERE project_id = ?',
      projectId
    );
    
    await this.db!.run(
      'INSERT INTO canvas_state (id, project_id, nodes_data, edges_data, viewport_data) VALUES (?, ?, ?, ?, ?)',
      [id, projectId, JSON.stringify(nodesData), JSON.stringify(edgesData), JSON.stringify(viewportData)]
    );
    
    return this.getCanvasState(projectId);
  }

  async getCanvasState(projectId: string): Promise<any> {
    await this.initialize();
    const state = await this.db!.get('SELECT * FROM canvas_state WHERE project_id = ?', projectId);
    if (state) {
      state.nodes_data = JSON.parse(state.nodes_data);
      state.edges_data = JSON.parse(state.edges_data);
      state.viewport_data = JSON.parse(state.viewport_data);
    }
    return state;
  }

  async deleteCanvasState(projectId: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM canvas_state WHERE project_id = ?', projectId);
  }

  // Project position methods
  async updateProjectPosition(projectId: string, x: number, y: number): Promise<void> {
    await this.initialize();
    await this.db!.run(
      'UPDATE projects SET position_x = ?, position_y = ? WHERE id = ?',
      [x, y, projectId]
    );
  }

  // Scratchpads methods
  async addScratchpad(projectId: string, text: string = '', positionX: number = 0, positionY: number = 0, sourceHandle: string | null = null, targetHandle: string | null = null): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO scratchpads (id, project_id, text, position_x, position_y, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, text, positionX, positionY, sourceHandle, targetHandle]
    );
    
    return this.getScratchpad(id);
  }

  async getScratchpad(id: string): Promise<any> {
    await this.initialize();
    return await this.db!.get('SELECT * FROM scratchpads WHERE id = ?', id);
  }

  async getScratchpadsByProject(projectId: string): Promise<any[]> {
    await this.initialize();
    return await this.db!.all(
      'SELECT * FROM scratchpads WHERE project_id = ? ORDER BY created_at',
      projectId
    );
  }

  async updateScratchpadText(id: string, text: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE scratchpads SET text = ? WHERE id = ?',
      [text, id]
    );
    return this.getScratchpad(id);
  }

  async updateScratchpadPosition(id: string, positionX: number, positionY: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE scratchpads SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getScratchpad(id);
  }

  async updateScratchpadHandles(id: string, sourceHandle: string | null, targetHandle: string | null): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE scratchpads SET source_handle = ?, target_handle = ? WHERE id = ?',
      [sourceHandle, targetHandle, id]
    );
    return this.getScratchpad(id);
  }

  async updateScratchpadProject(id: string, projectId: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE scratchpads SET project_id = ? WHERE id = ?',
      [projectId, id]
    );
    return this.getScratchpad(id);
  }

  async deleteScratchpad(id: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM scratchpads WHERE id = ?', id);
  }

  // Images methods
  async addImage(projectId: string, imageUrl: string = '', imageAlt: string = '', positionX: number = 0, positionY: number = 0, sourceHandle: string | null = null, targetHandle: string | null = null): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO images (id, project_id, image_url, image_alt, position_x, position_y, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, imageUrl, imageAlt, positionX, positionY, sourceHandle, targetHandle]
    );
    
    return this.getImage(id);
  }

  async getImage(id: string): Promise<any> {
    await this.initialize();
    return await this.db!.get('SELECT * FROM images WHERE id = ?', id);
  }

  async getImagesByProject(projectId: string): Promise<any[]> {
    await this.initialize();
    return await this.db!.all(
      'SELECT * FROM images WHERE project_id = ? ORDER BY created_at',
      projectId
    );
  }

  async updateImageData(id: string, imageUrl: string, imageAlt: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE images SET image_url = ?, image_alt = ? WHERE id = ?',
      [imageUrl, imageAlt, id]
    );
    return this.getImage(id);
  }

  async updateImagePosition(id: string, positionX: number, positionY: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE images SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getImage(id);
  }

  async updateImageHandles(id: string, sourceHandle: string | null, targetHandle: string | null): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE images SET source_handle = ?, target_handle = ? WHERE id = ?',
      [sourceHandle, targetHandle, id]
    );
    return this.getImage(id);
  }

  async updateImageProject(id: string, projectId: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE images SET project_id = ? WHERE id = ?',
      [projectId, id]
    );
    return this.getImage(id);
  }

  async deleteImage(id: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM images WHERE id = ?', id);
  }

  // Project deletion with cascading cleanup
  async deleteProject(projectId: string): Promise<void> {
    await this.initialize();
    
    console.log(`[ProjectStore] Deleting project ${projectId} and all associated data...`);
    
    // Delete all related data in order (due to foreign key constraints)
    // 1. Delete tasks (child of task_lists)
    await this.db!.run(`
      DELETE FROM tasks 
      WHERE task_list_id IN (
        SELECT id FROM task_lists WHERE project_id = ?
      )
    `, projectId);
    
    // 2. Delete task lists
    await this.db!.run('DELETE FROM task_lists WHERE project_id = ?', projectId);
    
    // 3. Delete chat messages
    await this.db!.run('DELETE FROM chat_messages WHERE project_id = ?', projectId);
    
    // 4. Delete scratchpads
    await this.db!.run('DELETE FROM scratchpads WHERE project_id = ?', projectId);
    
    // 5. Delete images
    await this.db!.run('DELETE FROM images WHERE project_id = ?', projectId);
    
    // 6. Delete containers
    await this.db!.run('DELETE FROM containers WHERE project_id = ?', projectId);
    
    // 7. Delete pages
    await this.db!.run('DELETE FROM pages WHERE project_id = ?', projectId);
    
    // 8. Delete canvas state
    await this.db!.run('DELETE FROM canvas_state WHERE project_id = ?', projectId);
    
    // 9. Finally delete the project itself
    await this.db!.run('DELETE FROM projects WHERE id = ?', projectId);
    
    console.log(`[ProjectStore] Successfully deleted project ${projectId} and all associated data`);
  }

  // Container methods
  async addContainer(projectId: string, label: string = 'Container', color: string = '#3b82f6', positionX: number = 0, positionY: number = 0, width: number = 300, height: number = 200, zIndex: number = 0): Promise<any> {
    await this.initialize();
    const id = Date.now().toString();
    
    await this.db!.run(
      'INSERT INTO containers (id, project_id, label, color, position_x, position_y, width, height, z_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, label, color, positionX, positionY, width, height, zIndex]
    );
    
    return this.getContainer(id);
  }

  async getContainer(id: string): Promise<any> {
    await this.initialize();
    return await this.db!.get('SELECT * FROM containers WHERE id = ?', id);
  }

  async getContainersByProject(projectId: string): Promise<any[]> {
    await this.initialize();
    return await this.db!.all(
      'SELECT * FROM containers WHERE project_id = ? ORDER BY z_index, created_at',
      projectId
    );
  }

  async updateContainerLabel(id: string, label: string): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE containers SET label = ? WHERE id = ?',
      [label, id]
    );
    return this.getContainer(id);
  }

  async updateContainerColor(id: string, color: string): Promise<any> {
    console.log('ProjectStore: updateContainerColor called with:', id, color);
    await this.initialize();
    console.log('ProjectStore: Executing SQL update...');
    await this.db!.run(
      'UPDATE containers SET color = ? WHERE id = ?',
      [color, id]
    );
    console.log('ProjectStore: SQL update completed, fetching updated container...');
    const result = this.getContainer(id);
    console.log('ProjectStore: Updated container:', result);
    return result;
  }

  async updateContainerPosition(id: string, positionX: number, positionY: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE containers SET position_x = ?, position_y = ? WHERE id = ?',
      [positionX, positionY, id]
    );
    return this.getContainer(id);
  }

  async updateContainerSize(id: string, width: number, height: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE containers SET width = ?, height = ? WHERE id = ?',
      [width, height, id]
    );
    return this.getContainer(id);
  }

  async updateContainerZIndex(id: string, zIndex: number): Promise<any> {
    await this.initialize();
    await this.db!.run(
      'UPDATE containers SET z_index = ? WHERE id = ?',
      [zIndex, id]
    );
    return this.getContainer(id);
  }

  async deleteContainer(id: string): Promise<void> {
    await this.initialize();
    await this.db!.run('DELETE FROM containers WHERE id = ?', id);
  }
}

const projectStore = new ProjectStore();
export default projectStore; 