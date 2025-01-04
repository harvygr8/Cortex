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
    `);
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
    await this.db.run('DELETE FROM projects WHERE id = ?', id);
  }

  async updateProject(id, title, description) {
    await this.db.run(
      'UPDATE projects SET title = ?, description = ? WHERE id = ?',
      [title, description, id]
    );
    return this.getProject(id);
  }
}

const projectStore = new ProjectStore();
export default projectStore; 