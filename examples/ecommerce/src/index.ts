import { Component, State, useEffect, computed } from '@onedot/core';
import { render, Router, Route } from '@onedot/web';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'ecommerce-app',
  template: `
    <div class="ecommerce-app">
      <header class="app-header">
        <div class="logo">ONEDOT-Shop</div>
        <nav class="main-nav">
          <a href="#/">Home</a>
          <a href="#/products">Products</a>
          <a href="#/cart">Cart ({{cartItemCount}})</a>
        </nav>
      </header>

      <main class="app-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <p>&copy; 2023 ONEDOT-JS E-commerce Example. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: `
    .ecommerce-app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
    }

    .app-header {
      background: #2c3e50;
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .main-nav a {
      color: white;
      text-decoration: none;
      margin-left: 1rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .main-nav a:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .app-content {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .app-footer {
      background: #34495e;
      color: white;
      text-align: center;
      padding: 1rem;
    }
  `
})
export class EcommerceApp {
  @State() cart: CartItem[] = [];

  @computed get cartItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  constructor() {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }
  }

  addToCart(product: Product, quantity: number = 1) {
    const existingItem = this.cart.find(item => item.product.id === product.id);

    if (existingItem) {
      this.cart = this.cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      this.cart = [...this.cart, { product, quantity }];
    }

    this.saveCart();
  }

  removeFromCart(productId: number) {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this.saveCart();
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cart = this.cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    );

    this.saveCart();
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
}

// Home Page Component
@Component({
  selector: 'home-page',
  template: `
    <div class="home-page">
      <h1>Welcome to ONEDOT-Shop</h1>
      <p>Your one-stop shop for all your needs</p>

      <div class="featured-products">
        <h2>Featured Products</h2>
        <div class="product-grid">
          {{#each featuredProducts as product}}
            <div class="product-card">
              <img src="{{product.image}}" alt="{{product.name}}" />
              <h3>{{product.name}}</h3>
              <p class="price">${{product.price.toFixed(2)}}</p>
              <button @click="addToCart(product)">Add to Cart</button>
            </div>
          {{/each}}
        </div>
      </div>
    </div>
  `,
  styles: `
    .home-page h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .featured-products {
      margin-top: 3rem;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 1.5rem;
    }

    .product-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

    .product-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .product-card h3 {
      padding: 1rem;
      margin: 0;
      font-size: 1.2rem;
    }

    .product-card .price {
      padding: 0 1rem;
      font-weight: bold;
      color: #e74c3c;
    }

    .product-card button {
      width: 100%;
      padding: 0.8rem;
      border: none;
      background: #3498db;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;
    }

    .product-card button:hover {
      background: #2980b9;
    }
  `
})
export class HomePage {
  @State() featuredProducts: Product[] = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 99.99,
      description: "High-quality wireless headphones with noise cancellation",
      image: "https://example.com/headphones.jpg",
      category: "Electronics"
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 199.99,
      description: "Feature-rich smartwatch with health tracking",
      image: "https://example.com/smartwatch.jpg",
      category: "Electronics"
    },
    {
      id: 3,
      name: "Running Shoes",
      price: 79.99,
      description: "Comfortable running shoes for all terrains",
      image: "https://example.com/shoes.jpg",
      category: "Clothing"
    },
    {
      id: 4,
      name: "Coffee Maker",
      price: 129.99,
      description: "Programmable coffee maker with thermal carafe",
      image: "https://example.com/coffee.jpg",
      category: "Home"
    }
  ];

  constructor(private app: EcommerceApp) {}

  addToCart(product: Product) {
    this.app.addToCart(product);
  }
}

// Products Page Component
@Component({
  selector: 'products-page',
  template: `
    <div class="products-page">
      <h1>All Products</h1>

      <div class="filters">
        <div class="filter-group">
          <label>Category:</label>
          <select @change="filterByCategory">
            <option value="">All Categories</option>
            {{#each categories as category}}
              <option value="{{category}}">{{category}}</option>
            {{/each}}
          </select>
        </div>

        <div class="filter-group">
          <label>Sort By:</label>
          <select @change="sortProducts">
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div class="product-grid">
        {{#each filteredProducts as product}}
          <div class="product-card">
            <img src="{{product.image}}" alt="{{product.name}}" />
            <h3>{{product.name}}</h3>
            <p class="price">${{product.price.toFixed(2)}}</p>
            <button @click="addToCart(product)">Add to Cart</button>
          </div>
        {{/each}}
      </div>
    </div>
  `,
  styles: `
    .products-page h1 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
      color: #2c3e50;
    }

    .filters {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: bold;
    }

    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 2rem;
    }

    .product-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

    .product-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .product-card h3 {
      padding: 1rem;
      margin: 0;
      font-size: 1.2rem;
    }

    .product-card .price {
      padding: 0 1rem;
      font-weight: bold;
      color: #e74c3c;
    }

    .product-card button {
      width: 100%;
      padding: 0.8rem;
      border: none;
      background: #3498db;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;
    }

    .product-card button:hover {
      background: #2980b9;
    }
  `
})
export class ProductsPage {
  @State() products: Product[] = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 99.99,
      description: "High-quality wireless headphones with noise cancellation",
      image: "https://example.com/headphones.jpg",
      category: "Electronics"
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 199.99,
      description: "Feature-rich smartwatch with health tracking",
      image: "https://example.com/smartwatch.jpg",
      category: "Electronics"
    },
    {
      id: 3,
      name: "Running Shoes",
      price: 79.99,
      description: "Comfortable running shoes for all terrains",
      image: "https://example.com/shoes.jpg",
      category: "Clothing"
    },
    {
      id: 4,
      name: "Coffee Maker",
      price: 129.99,
      description: "Programmable coffee maker with thermal carafe",
      image: "https://example.com/coffee.jpg",
      category: "Home"
    },
    {
      id: 5,
      name: "Laptop Backpack",
      price: 49.99,
      description: "Durable backpack with laptop compartment",
      image: "https://example.com/backpack.jpg",
      category: "Accessories"
    },
    {
      id: 6,
      name: "Bluetooth Speaker",
      price: 59.99,
      description: "Portable speaker with rich sound",
      image: "https://example.com/speaker.jpg",
      category: "Electronics"
    }
  ];

  @State() filteredProducts: Product[] = [];
  @State() selectedCategory: string = '';
  @State() sortBy: string = 'name';

  @computed get categories(): string[] {
    const cats = this.products.map(p => p.category);
    return [...new Set(cats)];
  }

  constructor(private app: EcommerceApp) {
    this.filteredProducts = [...this.products];
  }

  filterByCategory(event: Event) {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  sortProducts(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.products];

    // Apply category filter
    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    this.filteredProducts = result;
  }

  addToCart(product: Product) {
    this.app.addToCart(product);
  }
}

// Cart Page Component
@Component({
  selector: 'cart-page',
  template: `
    <div class="cart-page">
      <h1>Shopping Cart</h1>

      {{#if cartItems.length}}
        <div class="cart-items">
          {{#each cartItems as item}}
            <div class="cart-item">
              <img src="{{item.product.image}}" alt="{{item.product.name}}" />
              <div class="item-details">
                <h3>{{item.product.name}}</h3>
                <p class="price">${{item.product.price.toFixed(2)}} each</p>
              </div>
              <div class="item-quantity">
                <button @click="decreaseQuantity(item.product.id)">-</button>
                <span>{{item.quantity}}</span>
                <button @click="increaseQuantity(item.product.id)">+</button>
              </div>
              <div class="item-total">
                ${{(item.product.price * item.quantity).toFixed(2)}}
              </div>
              <button class="remove-btn" @click="removeItem(item.product.id)">Remove</button>
            </div>
          {{/each}}
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${{subtotal.toFixed(2)}}</span>
          </div>
          <div class="summary-row">
            <span>Shipping:</span>
            <span>${{shipping.toFixed(2)}}</span>
          </div>
          <div class="summary-row">
            <span>Tax:</span>
            <span>${{tax.toFixed(2)}}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>${{total.toFixed(2)}}</span>
          </div>

          <button class="checkout-btn" @click="checkout">Proceed to Checkout</button>
        </div>
      {{else}}
        <div class="empty-cart">
          <p>Your cart is empty</p>
          <a href="#/products">Continue Shopping</a>
        </div>
      {{/if}}
    </div>
  `,
  styles: `
    .cart-page h1 {
      font-size: 2rem;
      margin-bottom: 1.5rem;
      color: #2c3e50;
    }

    .cart-items {
      margin-bottom: 2rem;
    }

    .cart-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    .cart-item img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      margin-right: 1rem;
    }

    .item-details {
      flex: 1;
    }

    .item-details h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
    }

    .item-details .price {
      color: #666;
    }

    .item-quantity {
      display: flex;
      align-items: center;
      margin: 0 1rem;
    }

    .item-quantity button {
      width: 30px;
      height: 30px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
    }

    .item-quantity span {
      margin: 0 0.5rem;
      min-width: 20px;
      text-align: center;
    }

    .item-total {
      font-weight: bold;
      margin-right: 1rem;
      min-width: 80px;
      text-align: right;
    }

    .remove-btn {
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .cart-summary {
      max-width: 400px;
      margin-left: auto;
      padding: 1.5rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.8rem;
    }

    .summary-row.total {
      font-weight: bold;
      font-size: 1.2rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .checkout-btn {
      width: 100%;
      padding: 1rem;
      background: #2ecc71;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      font-size: 1.1rem;
      cursor: pointer;
      margin-top: 1rem;
      transition: background 0.3s;
    }

    .checkout-btn:hover {
      background: #27ae60;
    }

    .empty-cart {
      text-align: center;
      padding: 3rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .empty-cart p {
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .empty-cart a {
      display: inline-block;
      padding: 0.8rem 1.5rem;
      background: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
    }
  `
})
export class CartPage {
  @State() cartItems: CartItem[] = [];

  @computed get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  @computed get shipping(): number {
    return this.subtotal > 50 ? 0 : 5.99;
  }

  @computed get tax(): number {
    return this.subtotal * 0.08;
  }

  @computed get total(): number {
    return this.subtotal + this.shipping + this.tax;
  }

  constructor(private app: EcommerceApp) {
    this.cartItems = [...this.app.cart];
  }

  increaseQuantity(productId: number) {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      this.app.updateQuantity(productId, item.quantity + 1);
      this.cartItems = [...this.app.cart];
    }
  }

  decreaseQuantity(productId: number) {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      this.app.updateQuantity(productId, item.quantity - 1);
      this.cartItems = [...this.app.cart];
    }
  }

  removeItem(productId: number) {
    this.app.removeFromCart(productId);
    this.cartItems = [...this.app.cart];
  }

  checkout() {
    alert('Checkout functionality would be implemented here. This is just an example.');
  }
}

// Initialize and render the app
const app = new EcommerceApp();

// Set up routing
const router = new Router([
  new Route('', HomePage, { app }),
  new Route('products', ProductsPage, { app }),
  new Route('cart', CartPage, { app })
]);

// Render the app
render(app, document.getElementById('app'));
