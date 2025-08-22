import { test } from '../index.js';
import { Router } from '../../core/src/router.js';

test('Router should match static routes', () => {
  const router = new Router();
  router.addRoute('/home', () => 'Home');
  router.addRoute('/about', () => 'About');
  
  const homeMatch = router.match('/home');
  if (!homeMatch || homeMatch.handler() !== 'Home') {
    throw new Error('Failed to match /home route');
  }
  
  const aboutMatch = router.match('/about');
  if (!aboutMatch || aboutMatch.handler() !== 'About') {
    throw new Error('Failed to match /about route');
  }
});

test('Router should match dynamic routes with parameters', () => {
  const router = new Router();
  router.addRoute('/user/:id', ({ id }) => `User ${id}`);
  router.addRoute('/post/:slug/comment/:commentId', ({ slug, commentId }) => `Comment ${commentId} on ${slug}`);
  
  const userMatch = router.match('/user/123');
  if (!userMatch || userMatch.params.id !== '123') {
    throw new Error('Failed to extract user ID parameter');
  }
  
  const commentMatch = router.match('/post/hello-world/comment/456');
  if (!commentMatch || commentMatch.params.slug !== 'hello-world' || commentMatch.params.commentId !== '456') {
    throw new Error('Failed to extract multiple parameters');
  }
});

test('Router should handle navigation', () => {
  const router = new Router();
  let currentPath = '/';
  
  router.onNavigate((path) => {
    currentPath = path;
  });
  
  router.navigate('/test');
  if (currentPath !== '/test') {
    throw new Error('Navigation callback not triggered');
  }
});

test('Router should not match invalid routes', () => {
  const router = new Router();
  router.addRoute('/exact', () => 'Exact');
  
  const noMatch = router.match('/exact/extra');
  if (noMatch !== null) {
    throw new Error('Should not match route with extra segments');
  }
  
  const noMatch2 = router.match('/different');
  if (noMatch2 !== null) {
    throw new Error('Should not match completely different route');
  }
});

test('Router should support wildcard routes', () => {
  const router = new Router();
  router.addRoute('/api/*', ({ wildcard }) => `API call: ${wildcard}`);
  
  const match = router.match('/api/users/123/posts');
  if (!match || match.params.wildcard !== 'users/123/posts') {
    throw new Error('Failed to capture wildcard parameter');
  }
});

test('Router should handle query parameters', () => {
  const router = new Router();
  router.addRoute('/search', ({ query }) => `Search: ${query?.q || 'none'}`);
  
  const match = router.match('/search?q=test&sort=date');
  if (!match) {
    throw new Error('Failed to match route with query parameters');
  }
  
  // Note: Query parsing would need to be implemented in the router
  // This test assumes the router parses query parameters
});

test('Router should maintain route order priority', () => {
  const router = new Router();
  router.addRoute('/admin', () => 'Admin');
  router.addRoute('/:page', ({ page }) => `Page: ${page}`);
  
  const adminMatch = router.match('/admin');
  if (!adminMatch || adminMatch.handler() !== 'Admin') {
    throw new Error('Specific route should take priority over dynamic route');
  }
});
