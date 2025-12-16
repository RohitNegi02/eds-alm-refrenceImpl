# Browse Catalog Block

A comprehensive catalog browsing interface for displaying learning objects (courses, certifications, learning paths, job aids) with filtering and search capabilities.

## Features

- **Grid Layout**: Responsive card-based layout showing learning objects
- **Search Functionality**: Real-time search across course names, descriptions, and tags
- **Sidebar Filters**: Filter by catalog categories and content types
- **Course Cards**: Rich cards showing course information, format, duration, and enrollment status
- **Responsive Design**: Mobile-friendly layout that adapts to different screen sizes
- **Interactive Elements**: Clickable cards with hover effects

## Usage

### Block Structure

The browse catalog block is self-contained and doesn't require specific content structure. It generates its own layout and populates with data.

```html
<div class="browse-catalog">
  <!-- Content is dynamically generated -->
</div>
```

### Data Integration

The block currently uses sample data embedded in the JavaScript file. In a production environment, you would:

1. Replace the `sampleData` object with an API call
2. Update the data structure to match your learning management system's API
3. Implement proper error handling and loading states

### Customization

#### Course Card Types

The block supports different course formats with color-coded headers:

- **Self Paced**: Gold gradient background
- **Virtual Classroom**: Blue gradient background  
- **Certification**: Brown gradient background
- **Learning Path**: Green gradient background

#### Filter Categories

Current filter categories include:

**Catalogs:**
- LSK Consulting
- Learning Support
- ALM Enablement
- CIO TPT
- CISO Cyber Defense

**Types:**
- Courses
- Learning Paths
- Job aids
- Certifications

### API Integration

To integrate with a real API, modify the `decorate` function:

```javascript
export default async function decorate(block) {
  // Replace sample data with API call
  try {
    const response = await fetch('/api/learning-objects');
    const data = await response.json();
    // Use data.data instead of sampleData.data
  } catch (error) {
    console.error('Failed to load catalog data:', error);
  }
}
```

### Event Handling

The block includes event handlers for:

- **Search Input**: Filters courses based on text input
- **Filter Checkboxes**: Can be extended to filter by category/type
- **Course Cards**: Click events for navigation to course details

### Responsive Behavior

- **Desktop**: Full layout with sidebar and grid
- **Tablet**: Responsive grid with adjusted sidebar
- **Mobile**: Stacked layout with sidebar below content

### Styling

The block uses CSS custom properties from the global styles:

- `--heading-font-size-xl`: Main title size
- `--text-color`: Primary text color
- Various responsive breakpoints

### Browser Support

- Modern browsers with ES6 module support
- CSS Grid and Flexbox support required
- Responsive design for mobile devices

## Example Implementation

See `browse-catalog-demo.html` for a complete working example.

## Data Structure

The block expects data in the following format:

```json
{
  "data": [
    {
      "id": "course:123",
      "type": "learningObject",
      "attributes": {
        "authorNames": ["Author Name"],
        "duration": 3600,
        "loFormat": "Self Paced",
        "loType": "course",
        "state": "Published",
        "tags": ["tag1", "tag2"],
        "localizedMetadata": [
          {
            "locale": "en-US",
            "name": "Course Title",
            "description": "Course description",
            "overview": "Detailed overview"
          }
        ]
      },
      "relationships": {
        "enrollment": {
          "data": {
            "id": "enrollment_id",
            "type": "learningObjectInstanceEnrollment"
          }
        }
      }
    }
  ]
}
