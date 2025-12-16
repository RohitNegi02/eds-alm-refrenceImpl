# Training Carousel Block

A responsive carousel block for displaying training courses or services with images, titles, descriptions, and call-to-action buttons.

## Features

- Responsive design (3 cards on desktop, 2 on tablet, 1 on mobile)
- Navigation arrows for desktop/tablet
- Touch/swipe support for mobile devices
- Smooth transitions and hover effects
- Accessible navigation with ARIA labels
- Customizable content structure

## Usage

### Block Structure

The training carousel block expects the following structure:

```html
<div class="training-carousel">
  <div>
    <div>Main Title</div>
    <div>Main Description</div>
  </div>
  <div>
    <div><img src="image1.jpg" alt="Card 1"></div>
    <div>Card Title 1</div>
    <div>Card Description 1</div>
    <div>Button Text 1</div>
  </div>
  <div>
    <div><img src="image2.jpg" alt="Card 2"></div>
    <div>Card Title 2</div>
    <div>Card Description 2</div>
    <div>Button Text 2</div>
  </div>
  <!-- Add more cards as needed -->
</div>
```

### Content Guidelines

1. **Header Row (First Row)**:
   - Column 1: Main title for the carousel
   - Column 2: Main description text

2. **Card Rows (Subsequent Rows)**:
   - Column 1: Image (preferably square, will be displayed as circular)
   - Column 2: Card title
   - Column 3: Card description
   - Column 4: Button text (defaults to "Explore" if empty)

### Responsive Behavior

- **Desktop (>1024px)**: Shows 3 cards at a time
- **Tablet (768px-1024px)**: Shows 2 cards at a time
- **Mobile (<768px)**: Shows 1 card at a time, navigation arrows hidden

### Customization

#### CSS Variables

The block uses the following CSS custom properties from the global styles:

- `--heading-font-size-xl`: Main title size
- `--heading-font-size-s`: Card title size
- `--body-font-size-m`: Main description size
- `--body-font-size-s`: Card description size
- `--text-color`: Text color
- `--dark-color`: Secondary text color

#### Button Styling

The explore buttons use a blue color scheme (`#4a6cf7`) that can be customized by modifying the `.card-button` styles in the CSS file.

### Example Implementation

See `training-carousel-demo.html` for a complete working example.

### Accessibility

- Navigation buttons include ARIA labels
- Images should include descriptive alt text
- Keyboard navigation is supported
- Focus management for screen readers

### Browser Support

- Modern browsers with ES6 module support
- Touch events for mobile devices
- CSS Grid and Flexbox support required
