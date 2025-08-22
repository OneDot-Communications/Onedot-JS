import { test } from '../index.js';
import { Container, createToken } from '@onedot/core';

test('DI Container should register and resolve dependencies', () => {
  const container = new Container();
  const service = { getName: () => 'TestService' };
  
  container.register('testService', service);
  const resolved = container.resolve('testService');
  
  if (resolved !== service) {
    throw new Error('Failed to resolve registered service');
  }
});

test('DI Container should create typed tokens', () => {
  interface ILogger { log(msg: string): void; }
  const LoggerToken = createToken<ILogger>('Logger');
  
  const container = new Container();
  const logger: ILogger = { log: (msg: string) => console.log(msg) };
  
  container.register(LoggerToken, logger);
  const resolved = container.resolve(LoggerToken);
  
  if (resolved !== logger) {
    throw new Error('Failed to resolve typed token');
  }
});

test('DI Container should handle singleton lifecycle', () => {
  const container = new Container();
  
  class Service {
    public instanceId = Math.random();
  }
  
  container.registerSingleton('service', () => new Service());
  
  const instance1 = container.resolve('service');
  const instance2 = container.resolve('service');
  
  if (instance1 !== instance2) {
    throw new Error('Singleton should return same instance');
  }
});

test('DI Container should handle transient lifecycle', () => {
  const container = new Container();
  
  class Service {
    public instanceId = Math.random();
  }
  
  container.registerTransient('service', () => new Service());
  
  const instance1 = container.resolve('service');
  const instance2 = container.resolve('service');
  
  if (instance1 === instance2) {
    throw new Error('Transient should return different instances');
  }
});

test('DI Container should resolve nested dependencies', () => {
  const container = new Container();
  
  interface IDatabase { query(sql: string): any[]; }
  interface IUserService { getUser(id: string): any; }
  
  const DatabaseToken = createToken<IDatabase>('Database');
  const UserServiceToken = createToken<IUserService>('UserService');
  
  const database: IDatabase = {
    query: (sql: string) => [{ id: '1', name: 'Test' }]
  };
  
  class UserService implements IUserService {
    constructor(private db: IDatabase) {}
    
    getUser(id: string) {
      return this.db.query(`SELECT * FROM users WHERE id = ${id}`)[0];
    }
  }
  
  container.register(DatabaseToken, database);
  container.register(UserServiceToken, new UserService(container.resolve(DatabaseToken)));
  
  const userService = container.resolve(UserServiceToken);
  const user = userService.getUser('1');
  
  if (!user || user.name !== 'Test') {
    throw new Error('Failed to resolve nested dependencies');
  }
});

test('DI Container should throw on unregistered dependency', () => {
  const container = new Container();
  
  let errorThrown = false;
  try {
    container.resolve('nonExistent');
  } catch (error) {
    errorThrown = true;
  }
  
  if (!errorThrown) {
    throw new Error('Should throw error for unregistered dependency');
  }
});

test('DI Container should support conditional registration', () => {
  const container = new Container();
  
  const devService = { env: 'development' };
  const prodService = { env: 'production' };
  
  const isDev = true; // Simulated environment check
  
  if (isDev) {
    container.register('envService', devService);
  } else {
    container.register('envService', prodService);
  }
  
  const resolved = container.resolve('envService');
  
  if (resolved.env !== 'development') {
    throw new Error('Failed conditional registration');
  }
});
