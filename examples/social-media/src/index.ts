import { Component, State } from '@onedot/core';
import { render, Route, Router } from '@onedot/web';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio: string;
}

interface Post {
  id: number;
  userId: number;
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  liked: boolean;
}

interface Comment {
  id: number;
  userId: number;
  postId: number;
  content: string;
  timestamp: string;
}

@Component({
  selector: 'social-media-app',
  template: `
    <div class="social-media-app">
      <header class="app-header">
        <div class="logo">ONEDOT-Social</div>
        <nav class="main-nav">
          <a href="#/">Home</a>
          <a href="#/profile">Profile</a>
          <a href="#/explore">Explore</a>
          <a href="#/notifications">Notifications</a>
        </nav>
      </header>

      <main class="app-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <p>&copy; 2023 ONEDOT-JS Social Media Example. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: `
    .social-media-app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
      background-color: #f0f2f5;
    }

    .app-header {
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1877f2;
    }

    .main-nav {
      display: flex;
      gap: 1rem;
    }

    .main-nav a {
      color: #050505;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .main-nav a:hover {
      background: #f0f2f5;
    }

    .app-content {
      flex: 1;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      padding: 2rem 1rem;
    }

    .app-footer {
      background: #ffffff;
      text-align: center;
      padding: 1rem;
      border-top: 1px solid #dddfe2;
    }
  `
})
export class SocialMediaApp {
  @State() currentUser: User = {
    id: 1,
    name: "John Doe",
    username: "johndoe",
    avatar: "https://example.com/avatar1.jpg",
    bio: "Software developer and tech enthusiast"
  };

  @State() users: User[] = [
    {
      id: 1,
      name: "John Doe",
      username: "johndoe",
      avatar: "https://example.com/avatar1.jpg",
      bio: "Software developer and tech enthusiast"
    },
    {
      id: 2,
      name: "Jane Smith",
      username: "janesmith",
      avatar: "https://example.com/avatar2.jpg",
      bio: "Designer and photographer"
    },
    {
      id: 3,
      name: "Bob Johnson",
      username: "bobjohnson",
      avatar: "https://example.com/avatar3.jpg",
      bio: "Travel blogger and adventurer"
    }
  ];

  @State() posts: Post[] = [
    {
      id: 1,
      userId: 2,
      content: "Just finished working on a new design project! So excited to share it with you all soon.",
      timestamp: "2 hours ago",
      likes: 24,
      comments: [],
      liked: false
    },
    {
      id: 2,
      userId: 3,
      content: "Hiking in the mountains today. The view from the top was absolutely breathtaking!",
      timestamp: "5 hours ago",
      likes: 42,
      comments: [],
      liked: true
    },
    {
      id: 3,
      userId: 1,
      content: "Just pushed a new update to my open-source project. Check it out and let me know what you think!",
      timestamp: "1 day ago",
      likes: 18,
      comments: [],
      liked: false
    }
  ];

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  createPost(content: string) {
    const newPost: Post = {
      id: this.posts.length + 1,
      userId: this.currentUser.id,
      content,
      timestamp: "Just now",
      likes: 0,
      comments: [],
      liked: false
    };

    this.posts = [newPost, ...this.posts];
  }

  toggleLike(postId: number) {
    this.posts = this.posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    });
  }

  addComment(postId: number, content: string) {
    const newComment: Comment = {
      id: Date.now(),
      userId: this.currentUser.id,
      postId,
      content,
      timestamp: "Just now"
    };

    this.posts = this.posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    });
  }
}

// Home Page Component
@Component({
  selector: 'home-page',
  template: `
    <div class="home-page">
      <div class="create-post">
        <div class="user-avatar">
          <img src="{{currentUser.avatar}}" alt="{{currentUser.name}}" />
        </div>
        <div class="post-input">
          <textarea
            placeholder="What's on your mind?"
            value="{{newPostContent}}"
            @input="updatePostContent"
          ></textarea>
          <button @click="submitPost" class="post-btn">Post</button>
        </div>
      </div>

      <div class="posts-feed">
        {{#each posts as post}}
          <div class="post">
            <div class="post-header">
              <div class="user-info">
                <img src="{{post.user.avatar}}" alt="{{post.user.name}}" />
                <div>
                  <div class="user-name">{{post.user.name}}</div>
                  <div class="post-time">{{post.timestamp}}</div>
                </div>
              </div>
            </div>

            <div class="post-content">
              {{post.content}}
            </div>

            <div class="post-actions">
              <button class="action-btn {{#if post.liked}}liked{{/if}}" @click="toggleLike(post.id)">
                <span class="icon">👍</span> Like ({{post.likes}})
              </button>
              <button class="action-btn" @click="toggleComments(post.id)">
                <span class="icon">💬</span> Comment ({{post.comments.length}})
              </button>
              <button class="action-btn">
                <span class="icon">🔗</span> Share
              </button>
            </div>

            {{#if post.showComments}}
              <div class="comments-section">
                <div class="add-comment">
                  <img src="{{currentUser.avatar}}" alt="{{currentUser.name}}" />
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value="{{post.newComment}}"
                    @input="updateComment(post.id, $event)"
                    @keyup.enter="submitComment(post.id)"
                  />
                </div>

                {{#each post.comments as comment}}
                  <div class="comment">
                    <img src="{{comment.user.avatar}}" alt="{{comment.user.name}}" />
                    <div class="comment-content">
                      <div class="comment-user">{{comment.user.name}}</div>
                      <div class="comment-text">{{comment.content}}</div>
                      <div class="comment-time">{{comment.timestamp}}</div>
                    </div>
                  </div>
                {{/each}}
              </div>
            {{/if}}
          </div>
        {{/each}}
      </div>
    </div>
  `,
  styles: `
    .home-page {
      max-width: 600px;
      margin: 0 auto;
    }

    .create-post {
      display: flex;
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .user-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 1rem;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post-input {
      flex: 1;
    }

    .post-input textarea {
      width: 100%;
      min-height: 80px;
      padding: 0.8rem;
      border: 1px solid #dddfe2;
      border-radius: 4px;
      resize: none;
      font-family: inherit;
      margin-bottom: 0.5rem;
    }

    .post-btn {
      padding: 0.5rem 1.5rem;
      background: #1877f2;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }

    .posts-feed {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .post {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .post-header {
      padding: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
    }

    .user-info img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 0.8rem;
    }

    .user-name {
      font-weight: bold;
    }

    .post-time {
      font-size: 0.8rem;
      color: #65676b;
    }

    .post-content {
      padding: 0 1rem 1rem;
      font-size: 1rem;
      line-height: 1.5;
    }

    .post-actions {
      display: flex;
      border-top: 1px solid #e4e6eb;
      padding: 0.5rem 0;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      color: #65676b;
    }

    .action-btn:hover {
      background: #f0f2f5;
    }

    .action-btn.liked {
      color: #1877f2;
    }

    .action-btn .icon {
      margin-right: 0.5rem;
    }

    .comments-section {
      border-top: 1px solid #e4e6eb;
      padding: 1rem;
    }

    .add-comment {
      display: flex;
      margin-bottom: 1rem;
    }

    .add-comment img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 0.8rem;
    }

    .add-comment input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #dddfe2;
      border-radius: 18px;
      background: #f0f2f5;
    }

    .comment {
      display: flex;
      margin-bottom: 1rem;
    }

    .comment img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 0.8rem;
    }

    .comment-content {
      flex: 1;
      background: #f0f2f5;
      padding: 0.8rem;
      border-radius: 18px;
    }

    .comment-user {
      font-weight: 600;
      margin-bottom: 0.2rem;
    }

    .comment-text {
      margin-bottom: 0.2rem;
    }

    .comment-time {
      font-size: 0.75rem;
      color: #65676b;
    }
  `
})
export class HomePage {
  @State() newPostContent: string = '';

  constructor(private app: SocialMediaApp) {
    // Prepare posts with user data and comment data
    this.posts = this.app.posts.map(post => ({
      ...post,
      user: this.app.getUserById(post.userId) || this.app.currentUser,
      showComments: false,
      newComment: '',
      comments: post.comments.map(comment => ({
        ...comment,
        user: this.app.getUserById(comment.userId) || this.app.currentUser
      }))
    }));
  }

  @State() posts: any[] = [];

  updatePostContent(event: Event) {
    this.newPostContent = (event.target as HTMLTextAreaElement).value;
  }

  submitPost() {
    if (this.newPostContent.trim() === '') return;

    this.app.createPost(this.newPostContent);
    this.newPostContent = '';

    // Refresh posts
    this.posts = this.app.posts.map(post => ({
      ...post,
      user: this.app.getUserById(post.userId) || this.app.currentUser,
      showComments: false,
      newComment: '',
      comments: post.comments.map(comment => ({
        ...comment,
        user: this.app.getUserById(comment.userId) || this.app.currentUser
      }))
    }));
  }

  toggleLike(postId: number) {
    this.app.toggleLike(postId);

    // Update posts
    this.posts = this.posts.map(post => {
      if (post.id === postId) {
        const updatedPost = this.app.posts.find(p => p.id === postId);
        if (updatedPost) {
          return {
            ...post,
            liked: updatedPost.liked,
            likes: updatedPost.likes
          };
        }
      }
      return post;
    });
  }

  toggleComments(postId: number) {
    this.posts = this.posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          showComments: !post.showComments
        };
      }
      return post;
    });
  }

  updateComment(postId: number, event: Event) {
    const content = (event.target as HTMLInputElement).value;
    this.posts = this.posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          newComment: content
        };
      }
      return post;
    });
  }

  submitComment(postId: number) {
    const post = this.posts.find(p => p.id === postId);
    if (!post || post.newComment.trim() === '') return;

    this.app.addComment(postId, post.newComment);

    // Update posts
    this.posts = this.posts.map(p => {
      if (p.id === postId) {
        const updatedPost = this.app.posts.find(post => post.id === postId);
        if (updatedPost) {
          return {
            ...p,
            comments: updatedPost.comments.map(comment => ({
              ...comment,
              user: this.app.getUserById(comment.userId) || this.app.currentUser
            })),
            newComment: ''
          };
        }
      }
      return p;
    });
  }
}

// Profile Page Component
@Component({
  selector: 'profile-page',
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <div class="profile-cover">
          <div class="profile-avatar">
            <img src="{{currentUser.avatar}}" alt="{{currentUser.name}}" />
          </div>
        </div>

        <div class="profile-info">
          <h1>{{currentUser.name}}</h1>
          <p class="username">@{{currentUser.username}}</p>
          <p class="bio">{{currentUser.bio}}</p>

          <div class="profile-stats">
            <div class="stat">
              <div class="stat-value">42</div>
              <div class="stat-label">Posts</div>
            </div>
            <div class="stat">
              <div class="stat-value">128</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat">
              <div class="stat-value">86</div>
              <div class="stat-label">Following</div>
            </div>
          </div>

          <button class="edit-profile-btn">Edit Profile</button>
        </div>
      </div>

      <div class="profile-tabs">
        <button class="tab-btn active">Posts</button>
        <button class="tab-btn">Photos</button>
        <button class="tab-btn">About</button>
      </div>

      <div class="profile-content">
        <div class="posts-feed">
          {{#each userPosts as post}}
            <div class="post">
              <div class="post-header">
                <div class="user-info">
                  <img src="{{post.user.avatar}}" alt="{{post.user.name}}" />
                  <div>
                    <div class="user-name">{{post.user.name}}</div>
                    <div class="post-time">{{post.timestamp}}</div>
                  </div>
                </div>
              </div>

              <div class="post-content">
                {{post.content}}
              </div>

              <div class="post-actions">
                <button class="action-btn {{#if post.liked}}liked{{/if}}" @click="toggleLike(post.id)">
                  <span class="icon">👍</span> Like ({{post.likes}})
                </button>
                <button class="action-btn" @click="toggleComments(post.id)">
                  <span class="icon">💬</span> Comment ({{post.comments.length}})
                </button>
                <button class="action-btn">
                  <span class="icon">🔗</span> Share
                </button>
              </div>

              {{#if post.showComments}}
                <div class="comments-section">
                  <div class="add-comment">
                    <img src="{{currentUser.avatar}}" alt="{{currentUser.name}}" />
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value="{{post.newComment}}"
                      @input="updateComment(post.id, $event)"
                      @keyup.enter="submitComment(post.id)"
                    />
                  </div>

                  {{#each post.comments as comment}}
                    <div class="comment">
                      <img src="{{comment.user.avatar}}" alt="{{comment.user.name}}" />
                      <div class="comment-content">
                        <div class="comment-user">{{comment.user.name}}</div>
                        <div class="comment-text">{{comment.content}}</div>
                        <div class="comment-time">{{comment.timestamp}}</div>
                      </div>
                    </div>
                  {{/each}}
                </div>
              {{/if}}
            </div>
          {{/each}}
        </div>
      </div>
    </div>
  `,
  styles: `
    .profile-page {
      max-width: 800px;
      margin: 0 auto;
    }

    .profile-header {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .profile-cover {
      height: 200px;
      background: linear-gradient(to right, #1877f2, #8b9dc3);
      position: relative;
    }

    .profile-avatar {
      position: absolute;
      bottom: -50px;
      left: 20px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid white;
      overflow: hidden;
    }

    .profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-info {
      padding: 60px 20px 20px;
    }

    .profile-info h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
    }

    .username {
      color: #65676b;
      margin: 0 0 1rem 0;
    }

    .bio {
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .profile-stats {
      display: flex;
      margin-bottom: 1.5rem;
    }

    .stat {
      margin-right: 2rem;
      text-align: center;
    }

    .stat-value {
      font-weight: bold;
      font-size: 1.2rem;
    }

    .stat-label {
      color: #65676b;
      font-size: 0.9rem;
    }

    .edit-profile-btn {
      padding: 0.6rem 1.5rem;
      background: #e4e6eb;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    }

    .profile-tabs {
      display: flex;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      flex: 1;
      padding: 1rem;
      background: none;
      border: none;
      font-weight: 600;
      color: #65676b;
      cursor: pointer;
      border-bottom: 3px solid transparent;
    }

    .tab-btn.active {
      color: #1877f2;
      border-bottom-color: #1877f2;
    }

    .profile-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      padding: 1rem;
    }

    .posts-feed {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .post {
      border-bottom: 1px solid #e4e6eb;
      padding-bottom: 1.5rem;
    }

    .post:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .post-header {
      padding: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
    }

    .user-info img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 0.8rem;
    }

    .user-name {
      font-weight: bold;
    }

    .post-time {
      font-size: 0.8rem;
      color: #65676b;
    }

    .post-content {
      padding: 0.5rem 0;
      font-size: 1rem;
      line-height: 1.5;
    }

    .post-actions {
      display: flex;
      border-top: 1px solid #e4e6eb;
      padding: 0.5rem 0;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      color: #65676b;
    }

    .action-btn:hover {
      background: #f0f2f5;
    }

    .action-btn.liked {
      color: #1877f2;
    }

    .action-btn .icon {
      margin-right: 0.5rem;
    }

    .comments-section {
      border-top: 1px solid #e4e6eb;
      padding: 1rem 0;
    }

    .add-comment {
      display: flex;
      margin-bottom: 1rem;
    }

    .add-comment img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 0.8rem;
    }

    .add-comment input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #dddfe2;
      border-radius: 18px;
      background: #f0f2f5;
    }

    .comment {
      display: flex;
      margin-bottom: 1rem;
    }

    .comment img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 0.8rem;
    }

    .comment-content {
      flex: 1;
      background: #f0f2f5;
      padding: 0.8rem;
      border-radius: 18px;
    }

    .comment-user {
      font-weight: 600;
      margin-bottom: 0.2rem;
    }

    .comment-text {
      margin-bottom: 0.2rem;
    }

    .comment-time {
      font-size: 0.75rem;
      color: #65676b;
    }
  `
})
export class ProfilePage {
  @State() userPosts: any[] = [];

  constructor(private app: SocialMediaApp) {
    // Filter posts by current user
    this.userPosts = this.app.posts
      .filter(post => post.userId === this.app.currentUser.id)
      .map(post => ({
        ...post,
        user: this.app.getUserById(post.userId) || this.app.currentUser,
        showComments: false,
        newComment: '',
        comments: post.comments.map(comment => ({
          ...comment,
          user: this.app.getUserById(comment.userId) || this.app.currentUser
        }))
      }));
  }

  toggleLike(postId: number) {
    this.app.toggleLike(postId);

    // Update posts
    this.userPosts = this.userPosts.map(post => {
      if (post.id === postId) {
        const updatedPost = this.app.posts.find(p => p.id === postId);
        if (updatedPost) {
          return {
            ...post,
            liked: updatedPost.liked,
            likes: updatedPost.likes
          };
        }
      }
      return post;
    });
  }

  toggleComments(postId: number) {
    this.userPosts = this.userPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          showComments: !post.showComments
        };
      }
      return post;
    });
  }

  updateComment(postId: number, event: Event) {
    const content = (event.target as HTMLInputElement).value;
    this.userPosts = this.userPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          newComment: content
        };
      }
      return post;
    });
  }

  submitComment(postId: number) {
    const post = this.userPosts.find(p => p.id === postId);
    if (!post || post.newComment.trim() === '') return;

    this.app.addComment(postId, post.newComment);

    // Update posts
    this.userPosts = this.userPosts.map(p => {
      if (p.id === postId) {
        const updatedPost = this.app.posts.find(post => post.id === postId);
        if (updatedPost) {
          return {
            ...p,
            comments: updatedPost.comments.map(comment => ({
              ...comment,
              user: this.app.getUserById(comment.userId) || this.app.currentUser
            })),
            newComment: ''
          };
        }
      }
      return p;
    });
  }
}

// Explore Page Component
@Component({
  selector: 'explore-page',
  template: `
    <div class="explore-page">
      <h1>Explore</h1>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Search for people, posts, or topics..."
          value="{{searchQuery}}"
          @input="updateSearchQuery"
        />
        <button class="search-btn">Search</button>
      </div>

      <div class="trending-topics">
        <h2>Trending Topics</h2>
        <div class="topics-list">
          {{#each trendingTopics as topic}}
            <div class="topic">
              <div class="topic-name">#{{topic.name}}</div>
              <div class="topic-posts">{{topic.posts}} posts</div>
            </div>
          {{/each}}
        </div>
      </div>

      <div class="suggested-users">
        <h2>Suggested Users</h2>
        <div class="users-list">
          {{#each suggestedUsers as user}}
            <div class="user-card">
              <img src="{{user.avatar}}" alt="{{user.name}}" />
              <div class="user-info">
                <div class="user-name">{{user.name}}</div>
                <div class="user-username">@{{user.username}}</div>
              </div>
              <button class="follow-btn">Follow</button>
            </div>
          {{/each}}
        </div>
      </div>
    </div>
  `,
  styles: `
    .explore-page h1 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      color: #050505;
    }

    .search-bar {
      display: flex;
      margin-bottom: 2rem;
    }

    .search-bar input {
      flex: 1;
      padding: 0.8rem;
      border: 1px solid #dddfe2;
      border-radius: 4px 0 0 4px;
      font-size: 1rem;
    }

    .search-btn {
      padding: 0.8rem 1.5rem;
      background: #1877f2;
      color: white;
      border: none;
      border-radius: 0 4px 4px 0;
      font-weight: 600;
      cursor: pointer;
    }

    .trending-topics {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .trending-topics h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #050505;
    }

    .topics-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .topic {
      padding: 1rem;
      background: #f0f2f5;
      border-radius: 8px;
      transition: background 0.3s;
    }

    .topic:hover {
      background: #e4e6eb;
    }

    .topic-name {
      font-weight: 600;
      margin-bottom: 0.3rem;
    }

    .topic-posts {
      font-size: 0.9rem;
      color: #65676b;
    }

    .suggested-users {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      padding: 1.5rem;
    }

    .suggested-users h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #050505;
    }

    .users-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .user-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: #f0f2f5;
      border-radius: 8px;
    }

    .user-card img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 1rem;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      margin-bottom: 0.2rem;
    }

    .user-username {
      font-size: 0.9rem;
      color: #65676b;
    }

    .follow-btn {
      padding: 0.5rem 1rem;
      background: #1877f2;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    }
  `
})
export class ExplorePage {
  @State() searchQuery: string = '';
  @State() trendingTopics: any[] = [
    { name: "WebDevelopment", posts: 1242 },
    { name: "JavaScript", posts: 3421 },
    { name: "TypeScript", posts: 1876 },
    { name: "Frontend", posts: 2156 },
    { name: "React", posts: 3210 },
    { name: "VueJS", posts: 1543 }
  ];

  @State() suggestedUsers: User[] = [];

  constructor(private app: SocialMediaApp) {
    // Get suggested users (excluding current user)
    this.suggestedUsers = this.app.users.filter(user => user.id !== this.app.currentUser.id);
  }

  updateSearchQuery(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }
}

// Notifications Page Component
@Component({
  selector: 'notifications-page',
  template: `
    <div class="notifications-page">
      <h1>Notifications</h1>

      <div class="notifications-tabs">
        <button class="tab-btn active">All</button>
        <button class="tab-btn">Mentions</button>
        <button class="tab-btn">Likes</button>
        <button class="tab-btn">Comments</button>
        <button class="tab-btn">Followers</button>
      </div>

      <div class="notifications-list">
        {{#each notifications as notification}}
          <div class="notification {{#if !notification.read}}unread{{/if}}">
            <div class="notification-icon">
              {{#if notification.type === 'like'}}
                <span class="icon">👍</span>
              {{else if notification.type === 'comment'}}
                <span class="icon">💬</span>
              {{else if notification.type === 'follow'}}
                <span class="icon">👤</span>
              {{else if notification.type === 'mention'}}
                <span class="icon">📢</span>
              {{/if}}
            </div>

            <div class="notification-content">
              <div class="notification-text">
                <strong>{{notification.user.name}}</strong> {{notification.message}}
              </div>
              <div class="notification-time">{{notification.timestamp}}</div>
            </div>

            <div class="notification-action">
              {{#if notification.type === 'follow'}}
                <button class="follow-back-btn">Follow Back</button>
              {{/if}}
            </div>
          </div>
        {{/each}}
      </div>
    </div>
  `,
  styles: `
    .notifications-page h1 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      color: #050505;
    }

    .notifications-tabs {
      display: flex;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e4e6eb;
    }

    .tab-btn {
      padding: 0.8rem 1.5rem;
      background: none;
      border: none;
      font-weight: 600;
      color: #65676b;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -1px;
    }

    .tab-btn.active {
      color: #1877f2;
      border-bottom-color: #1877f2;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .notification {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .notification.unread {
      background: #f0f2f5;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e4e6eb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
    }

    .notification-icon .icon {
      font-size: 1.2rem;
    }

    .notification-content {
      flex: 1;
    }

    .notification-text {
      margin-bottom: 0.2rem;
    }

    .notification-time {
      font-size: 0.8rem;
      color: #65676b;
    }

    .notification-action {
      margin-left: 1rem;
    }

    .follow-back-btn {
      padding: 0.5rem 1rem;
      background: #1877f2;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    }
  `
})
export class NotificationsPage {
  @State() notifications: any[] = [
    {
      id: 1,
      type: 'like',
      user: {
        id: 2,
        name: "Jane Smith",
        avatar: "https://example.com/avatar2.jpg"
      },
      message: "liked your post",
      timestamp: "2 hours ago",
      read: false
    },
    {
      id: 2,
      type: 'comment',
      user: {
        id: 3,
        name: "Bob Johnson",
        avatar: "https://example.com/avatar3.jpg"
      },
      message: "commented on your post",
      timestamp: "5 hours ago",
      read: false
    },
    {
      id: 3,
      type: 'follow',
      user: {
        id: 4,
        name: "Alice Williams",
        avatar: "https://example.com/avatar4.jpg"
      },
      message: "started following you",
      timestamp: "1 day ago",
      read: true
    },
    {
      id: 4,
      type: 'mention',
      user: {
        id: 2,
        name: "Jane Smith",
        avatar: "https://example.com/avatar2.jpg"
      },
      message: "mentioned you in a post",
      timestamp: "2 days ago",
      read: true
    }
  ];
}

// Initialize and render the app
const app = new SocialMediaApp();

// Set up routing
const router = new Router([
  new Route('', HomePage, { app }),
  new Route('profile', ProfilePage, { app }),
  new Route('explore', ExplorePage, { app }),
  new Route('notifications', NotificationsPage, { app })
]);

// Render the app
render(app, document.getElementById('app'));
