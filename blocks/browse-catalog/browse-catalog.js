// API Configuration
const API_CONFIG = {
  baseUrl: 'https://learningmanager.adobe.com/primeapi/v2',
  headers: {
    'Accept': 'application/vnd.api+json',
    'Authorization': `oauth ${sessionStorage.getItem('alm_access_token')}`
  }
};

// Search API function
async function searchLearningObjects(searchTerm, limit = 9, cursor = null) {
  try {
    const params = new URLSearchParams({
      'filter.loTypes': 'course,learningProgram,certification,jobAid',
      'sort': 'relevance',
      'page[limit]': limit,
      'include': 'model.instances.loResources.resources,model.instances.badge,model.supplementaryResources,model.enrollment.loResourceGrades,model.skills.skillLevel.skill',
      'filter.ignoreEnhancedLP': 'false',
      'enforcedFields[learningObject]': 'extensionOverrides',
      'query': searchTerm,
      'snippetType': 'courseName,courseOverview,courseDescription,moduleName,certificationName,certificationOverview,certificationDescription,jobAidName,jobAidDescription,lpName,lpDescription,lpOverview,embedLpName,embedLpDesc,embedLpOverview,skillName,skillDescription,note,badgeName,courseTag,moduleTag,jobAidTag,lpTag,certificationTag,embedLpTag,discussion',
      'language': 'en-US'
    });

    if (cursor) {
      params.append('page[cursor]', cursor);
    }

    const url = `${API_CONFIG.baseUrl}/search?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching learning objects:', error);
    return { data: [], meta: { count: 0 }, links: {} };
  }
}

// Fetch learning objects from API
async function fetchLearningObjects(limit = 9, searchTerm = '', filters = {}, cursor = null) {
  try {
    const params = new URLSearchParams({
      'include': 'instances.enrollment.loResourceGrades,enrollment.loInstance.loResources.resources,subLOs.prerequisiteLOs,subLOs.subLOs.prerequisiteLOs,authors,subLOs.enrollment.loResourceGrades, subLOs.subLOs.enrollment.loResourceGrades, subLOs.subLOs.instances.loResources.resources, subLOs.instances.loResources.resources,instances.loResources.resources,supplementaryLOs.instances.loResources.resources,supplementaryResources,subLOs.supplementaryResources,subLOs.enrollment,instances.loResources.resources.room,subLOs.enrollment.loInstance.loResources.resources,prerequisiteLOs.enrollment,skills',
      'page[limit]': limit,
      'sort': 'name',
      'filter.ignoreEnhancedLP': 'true'
    });

    // Add cursor for pagination if provided
    if (cursor) {
      params.append('page[cursor]', cursor);
    }

    // Add search filter if provided
    if (searchTerm) {
      params.append('filter.search', searchTerm);
    }

    // Add type filters if provided
    if (filters.loTypes && filters.loTypes.length > 0) {
      params.append('filter.loTypes', filters.loTypes.join(','));
    }

    const url = `${API_CONFIG.baseUrl}/learningObjects?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching learning objects:', error);
    // Return fallback data in case of error
    return { data: [], meta: { count: 0 }, links: {} };
  }
}

// Fetch skill details from API
async function fetchSkillDetails(skillId) {
  try {
    const url = `${API_CONFIG.baseUrl}/skills/${skillId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching skill details:', error);
    return null;
  }
}

// Cache for skill names to avoid repeated API calls
const skillCache = new Map();

// Get skill names for a learning object
async function getSkillNames(item) {
  if (!item.relationships || !item.relationships.skills || !item.relationships.skills.data) {
    return ['General'];
  }

  const skillPromises = item.relationships.skills.data.map(async (skillRef) => {
    // Extract skill ID from the learningObjectSkill ID
    // Format is usually "course:id_skillId" or similar
    const skillIdMatch = skillRef.id.match(/_(\d+)$/);
    if (!skillIdMatch) return 'General';
    
    const skillId = skillIdMatch[1];
    
    // Check cache first
    if (skillCache.has(skillId)) {
      return skillCache.get(skillId);
    }

    // Fetch skill details
    const skillData = await fetchSkillDetails(skillId);
    if (skillData && skillData.attributes && skillData.attributes.name) {
      const skillName = skillData.attributes.name;
      skillCache.set(skillId, skillName);
      return skillName;
    }
    
    return 'General';
  });

  try {
    const skillNames = await Promise.all(skillPromises);
    return skillNames.filter(name => name !== 'General').slice(0, 2); // Show max 2 skills
  } catch (error) {
    console.error('Error getting skill names:', error);
    return ['General'];
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return 'Self-paced';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getCardIcon(loFormat, loType) {
  const icons = {
    'Self Paced': '📚',
    'Virtual Classroom': '🎓',
    'certification': '🏆',
    'learningProgram': '📋',
    'jobAid': '🔧'
  };
  
  return icons[loFormat] || icons[loType] || '📖';
}

function getCardClass(loFormat) {
  const formatMap = {
    'Self Paced': 'self-paced',
    'Virtual Classroom': 'virtual-classroom',
    'Blended': 'self-paced'
  };
  
  return formatMap[loFormat] || 'self-paced';
}

function getEnrollmentStatus(item) {
  if (item.relationships && item.relationships.enrollment) {
  }
  return 'Complete';
  return '';
}

async function createCourseCard(item, includedData = []) {
  let attributes = item.attributes;
  
  // Handle search API response structure
  if (item.type === 'searchResult' && item.relationships?.model?.data) {
    // Find the actual learning object in the included data
    const modelId = item.relationships.model.data.id;
    const actualLearningObject = includedData.find(included => 
      included.id === modelId && included.type === 'learningObject'
    );
    
    if (actualLearningObject) {
      attributes = actualLearningObject.attributes;
      // Update item to use the actual learning object for other processing
      item = actualLearningObject;
    }
  }
  
  // Handle both regular API and search API response structures
  const metadata = attributes.localizedMetadata && attributes.localizedMetadata[0] 
    ? attributes.localizedMetadata[0] 
    : { name: attributes.name || 'Untitled Course', description: '', overview: '' };
  const cardClass = getCardClass(attributes.loFormat);
  const icon = getCardIcon(attributes.loFormat, attributes.loType);
  const duration = formatDuration(attributes.duration);
  const status = getEnrollmentStatus(item);
  
  // Get actual skill names
  const skillNames = await getSkillNames(item);
  const skillsText = skillNames.length > 0 ? skillNames.join(', ') : 'General';
  
  const card = document.createElement('div');
  card.className = 'course-card';
  card.dataset.courseId = item.id;
  
  // Check if course has an image
  const hasImage = attributes.imageUrl && attributes.imageUrl.trim() !== '';
  
  card.innerHTML = `
    ${hasImage ? `<div class="card-image">
      <img src="${attributes.imageUrl}" alt="${metadata.name}" loading="lazy" onerror="this.style.display='none'">
      <div class="card-overlay">
        <div class="card-type-badge">${attributes.loFormat || 'Self Paced'}</div>
      </div>
    </div>` : `<div class="card-header ${cardClass}">
      <div class="card-type-badge">${attributes.loFormat || 'Self Paced'}</div>
      <div class="card-icon">${icon}</div>
    </div>`}
    <div class="card-body">
      <h4 class="card-title">${metadata.name}</h4>
      <div class="card-type">${attributes.loType}</div>
      <div class="card-footer">
        <div class="card-skills">
          <span>🎯</span>
          <span>Skills: ${skillsText}</span>
        </div>
        ${status ? `<div class="card-status status-complete">${status}</div>` : ''}
      </div>
      <div class="card-duration">${duration}</div>
    </div>
  `;
  
  // Add click handler
  card.addEventListener('click', () => {
    console.log('Course clicked:', item.id);
    
    // Navigate to course overview page
    const courseId = item.id;
    // For now, use the first instance ID if available, otherwise use the course ID
    let instanceId = courseId;
    
    // Try to get the first instance ID from the course data
    if (item.relationships && item.relationships.instances && item.relationships.instances.data && item.relationships.instances.data.length > 0) {
      instanceId = item.relationships.instances.data[0].id;
    }
    
    // Construct the overview URL with proper parameters
    const overviewUrl = `/overview?trainingId=${courseId}&trainingInstanceId=${instanceId}`;
    
    // Navigate to the overview page
    window.location.href = overviewUrl;
  });
  
  return card;
}

function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.className = 'catalog-sidebar';
  
  sidebar.innerHTML = `
    <div class="sidebar-section">
      <h3>Catalogs</h3>
      <div class="filter-group">
        <div class="filter-item">
          <input type="checkbox" id="lsk-consulting" checked>
          <label for="lsk-consulting">LSK Consulting</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="learning-support">
          <label for="learning-support">Learning Support</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="alm-enablement">
          <label for="alm-enablement">ALM Enablement</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="cio-tpt">
          <label for="cio-tpt">CIO TPT</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="ciso-cyber">
          <label for="ciso-cyber">CISO Cyber Defense</label>
        </div>
      </div>
    </div>
    
    <div class="sidebar-section">
      <h3>Type</h3>
      <div class="filter-group">
        <div class="filter-item">
          <input type="checkbox" id="courses" checked>
          <label for="courses">Courses</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="learning-paths">
          <label for="learning-paths">Learning Paths</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="job-aids">
          <label for="job-aids">Job aids</label>
        </div>
        <div class="filter-item">
          <input type="checkbox" id="certifications">
          <label for="certifications">Certifications</label>
        </div>
      </div>
    </div>
  `;
  
  return sidebar;
}

function createHeader() {
  const header = document.createElement('div');
  header.className = 'catalog-header';
  
  header.innerHTML = `
    <h1 class="catalog-title">Repository of Courses, Certifications and Learning Paths</h1>
    <div class="catalog-search">
      <input type="text" class="search-input" placeholder="Search">
      <button class="filters-toggle">
        <span>⚙️</span>
        <span>Filters</span>
      </button>
    </div>
  `;
  
  return header;
}

function filterCourses(courses, searchTerm) {
  if (!searchTerm) return courses;
  
  return courses.filter(course => {
    const metadata = course.attributes.localizedMetadata[0];
    const name = metadata.name.toLowerCase();
    const description = metadata.description?.toLowerCase() || '';
    const overview = metadata.overview?.toLowerCase() || '';
    const tags = course.attributes.tags?.join(' ').toLowerCase() || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return name.includes(searchLower) || 
           description.includes(searchLower) || 
           overview.includes(searchLower) ||
           tags.includes(searchLower);
  });
}

export default async function decorate(block) {
  // Clear the block
  block.innerHTML = '';
  
  // Show loading state
  block.innerHTML = '<div style="text-align: center; padding: 40px;">Loading courses...</div>';
  
  // Create header
  const header = createHeader();
  
  // Create main content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'catalog-content';
  
  // Create sidebar
  const sidebar = createSidebar();
  contentContainer.appendChild(sidebar);
  
  // Create main content area
  const mainContent = document.createElement('div');
  mainContent.className = 'catalog-main';
  
  // Create course grid
  const courseGrid = document.createElement('div');
  courseGrid.className = 'catalog-grid';
  
  // Create load more container
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.className = 'load-more-container';
  
  // Store current data and pagination state
  let allCourses = [];
  let nextCursor = null;
  let hasMoreData = false;
  let isLoading = false;
  let currentFilters = {
    searchTerm: '',
    loTypes: ['course', 'learningProgram', 'certification', 'jobAid']
  };
  
  async function renderCourses(courses, append = false, includedData = []) {
    if (!append) {
      courseGrid.innerHTML = '';
    }
    
    if (courses.length === 0 && !append) {
      courseGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No courses found matching your criteria.</div>';
      return;
    }
    
    // Create cards with skill names loaded asynchronously
    const cardPromises = courses.map(course => createCourseCard(course, includedData));
    const cards = await Promise.all(cardPromises);
    
    cards.forEach(card => {
      courseGrid.appendChild(card);
    });
  }
  
  function showError(message) {
    courseGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #d32f2f;">${message}</div>`;
  }
  
  function updateLoadMoreButton() {
    loadMoreContainer.innerHTML = '';
    
    if (isLoading) {
      loadMoreContainer.innerHTML = '<div class="loading-text">Loading more courses...</div>';
    } else if (hasMoreData) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'load-more-btn';
      loadMoreBtn.textContent = 'Load More';
      loadMoreBtn.addEventListener('click', loadMoreCourses);
      loadMoreContainer.appendChild(loadMoreBtn);
    }
  }
  
  async function loadCourses(resetData = true) {
    try {
      isLoading = true;
      updateLoadMoreButton();
      
      const cursor = resetData ? null : nextCursor;
      const data = await fetchLearningObjects(9, currentFilters.searchTerm, {
        loTypes: getActiveTypeFilters()
      }, cursor);
      
      const newCourses = data.data || [];
      
      if (resetData) {
        allCourses = newCourses;
        renderCourses(allCourses, false);
      } else {
        allCourses = [...allCourses, ...newCourses];
        renderCourses(newCourses, true);
      }
      
      // Extract cursor from next link if available
      nextCursor = null;
      hasMoreData = false;
      
      if (data.links && data.links.next) {
        const nextUrl = new URL(data.links.next);
        nextCursor = nextUrl.searchParams.get('page[cursor]');
        hasMoreData = true;
      }
      
      // Update course count if available
      if (data.meta && data.meta.count) {
        console.log(`Loaded ${allCourses.length} of ${data.meta.count} total courses`);
      }
      
      isLoading = false;
      updateLoadMoreButton();
      
    } catch (error) {
      console.error('Failed to load courses:', error);
      isLoading = false;
      if (resetData) {
        showError('Failed to load courses. Please try again later.');
      }
      updateLoadMoreButton();
    }
  }
  
  async function loadMoreCourses() {
    if (!hasMoreData || isLoading) return;
    await loadCourses(false);
  }
  
  function getActiveTypeFilters() {
    const typeCheckboxes = sidebar.querySelectorAll('#courses, #learning-paths, #job-aids, #certifications');
    const activeTypes = [];
    
    typeCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        switch (checkbox.id) {
          case 'courses':
            activeTypes.push('course');
            break;
          case 'learning-paths':
            activeTypes.push('learningProgram');
            break;
          case 'job-aids':
            activeTypes.push('jobAid');
            break;
          case 'certifications':
            activeTypes.push('certification');
            break;
        }
      }
    });
    
    return activeTypes.length > 0 ? activeTypes : ['course', 'learningProgram', 'certification', 'jobAid'];
  }
  
  // Initial load
  await loadCourses(true);
  
  // Clear loading and add content
  block.innerHTML = '';
  block.appendChild(header);
  
  mainContent.appendChild(courseGrid);
  mainContent.appendChild(loadMoreContainer);
  contentContainer.appendChild(mainContent);
  block.appendChild(contentContainer);
  
  // Add search functionality with debouncing
  let searchTimeout;
  const searchInput = header.querySelector('.search-input');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      currentFilters.searchTerm = e.target.value;
      
      // Use search API if there's a search term, otherwise use regular API
      if (currentFilters.searchTerm.trim()) {
        try {
          isLoading = true;
          updateLoadMoreButton();
          
          const data = await searchLearningObjects(currentFilters.searchTerm, 9);
          const newCourses = data.data || [];
          
          allCourses = newCourses;
          await renderCourses(allCourses, false, data.included || []);
          
          // Handle pagination for search results
          nextCursor = null;
          hasMoreData = false;
          if (data.links && data.links.next) {
            const nextUrl = new URL(data.links.next);
            nextCursor = nextUrl.searchParams.get('page[cursor]');
            hasMoreData = true;
          }
          
          isLoading = false;
          updateLoadMoreButton();
        } catch (error) {
          console.error('Search failed:', error);
          isLoading = false;
          showError('Search failed. Please try again.');
        }
      } else {
        await loadCourses(true); // Reset data for new search
      }
    }, 500); // 500ms debounce
  });
  
  // Add filter functionality
  const filterCheckboxes = sidebar.querySelectorAll('input[type="checkbox"]');
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      console.log('Filter changed:', checkbox.id, checkbox.checked);
      
      // If it's a type filter, reload courses
      if (['courses', 'learning-paths', 'job-aids', 'certifications'].includes(checkbox.id)) {
        await loadCourses(true); // Reset data for new filter
      }
    });
  });
}
