/**
 * Base Repository abstract class
 * Provides common CRUD operations for all repositories
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected db: T[] = [];
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  // Basic CRUD operations
  getAll(): T[] {
    return this.db;
  }

  getById(id: string): T | undefined {
    return this.db.find(item => item.id === id);
  }

  create(data: Omit<T, 'id'> & { id: string }): T {
    const newItem = data as T;
    this.db.push(newItem);
    return newItem;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const index = this.db.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    
    this.db[index] = { ...this.db[index], ...data };
    return this.db[index];
  }

  delete(id: string): boolean {
    const index = this.db.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.db.splice(index, 1);
    return true;
  }

  // Helper methods
  count(): number {
    return this.db.length;
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.db.filter(predicate);
  }
}
