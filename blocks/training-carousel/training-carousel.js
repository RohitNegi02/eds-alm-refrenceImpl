export default function decorate(block) {
  // Get all rows from the block
  const rows = [...block.children];
  
  // Create the carousel structure
  const carouselHeader = document.createElement('div');
  carouselHeader.className = 'carousel-header';
  
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-container';
  
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'carousel-wrapper';
  
  const carouselTrack = document.createElement('div');
  carouselTrack.className = 'carousel-track';
  
  // Process the first row as header content
  if (rows.length > 0) {
    const headerRow = rows[0];
    const headerCells = [...headerRow.children];
    
    if (headerCells.length >= 2) {
      const title = document.createElement('h2');
      title.textContent = headerCells[0].textContent.trim();
      
      const description = document.createElement('p');
      description.textContent = headerCells[1].textContent.trim();
      
      carouselHeader.appendChild(title);
      carouselHeader.appendChild(description);
    }
  }
  
  // Process remaining rows as carousel cards
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = [...row.children];
    
    if (cells.length >= 4) {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      
      // Card image
      const cardImage = document.createElement('div');
      cardImage.className = 'card-image';
      const img = cells[0].querySelector('img');
      if (img) {
        cardImage.appendChild(img.cloneNode(true));
      }
      
      // Card title
      const cardTitle = document.createElement('h3');
      cardTitle.className = 'card-title';
      cardTitle.textContent = cells[1].textContent.trim();
      
      // Card description
      const cardDescription = document.createElement('p');
      cardDescription.className = 'card-description';
      cardDescription.textContent = cells[2].textContent.trim();
      
      // Card button
      const cardButton = document.createElement('a');
      cardButton.className = 'card-button';
      cardButton.textContent = cells[3].textContent.trim() || 'Explore';
      cardButton.href = '#'; // You can modify this to use actual links from the content
      
      card.appendChild(cardImage);
      card.appendChild(cardTitle);
      card.appendChild(cardDescription);
      card.appendChild(cardButton);
      
      carouselTrack.appendChild(card);
    }
  }
  
  // Create navigation buttons
  const prevButton = document.createElement('button');
  prevButton.className = 'carousel-nav prev';
  prevButton.innerHTML = '&#8249;';
  prevButton.setAttribute('aria-label', 'Previous slide');
  
  const nextButton = document.createElement('button');
  nextButton.className = 'carousel-nav next';
  nextButton.innerHTML = '&#8250;';
  nextButton.setAttribute('aria-label', 'Next slide');
  
  // Assemble the carousel
  carouselWrapper.appendChild(carouselTrack);
  carouselContainer.appendChild(carouselWrapper);
  carouselContainer.appendChild(prevButton);
  carouselContainer.appendChild(nextButton);
  
  // Clear the original block content and add new structure
  block.innerHTML = '';
  block.appendChild(carouselHeader);
  block.appendChild(carouselContainer);
  
  // Carousel functionality
  let currentSlide = 0;
  const cards = carouselTrack.children;
  const totalCards = cards.length;
  
  function getCardsPerView() {
    const width = window.innerWidth;
    if (width <= 768) return 1;
    if (width <= 1024) return 2;
    return 3;
  }
  
  function updateCarousel() {
    const cardsPerView = getCardsPerView();
    const maxSlide = Math.max(0, totalCards - cardsPerView);
    
    // Ensure currentSlide is within bounds
    currentSlide = Math.min(currentSlide, maxSlide);
    
    const cardWidth = cards[0] ? cards[0].offsetWidth : 0;
    const gap = 10;
    const translateX = currentSlide * (cardWidth + gap);
    
    carouselTrack.style.transform = `translateX(-${translateX}px)`;
    
    // Update button states
    prevButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide >= maxSlide;
  }
  
  function nextSlide() {
    const cardsPerView = getCardsPerView();
    const maxSlide = Math.max(0, totalCards - cardsPerView);
    
    if (currentSlide < maxSlide) {
      currentSlide++;
      updateCarousel();
    }
  }
  
  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      updateCarousel();
    }
  }
  
  // Event listeners
  nextButton.addEventListener('click', nextSlide);
  prevButton.addEventListener('click', prevSlide);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    updateCarousel();
  });
  
  // Touch/swipe support for mobile
  let startX = 0;
  let isDragging = false;
  
  carouselTrack.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  
  carouselTrack.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });
  
  carouselTrack.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    isDragging = false;
  });
  
  // Initialize carousel
  setTimeout(() => {
    updateCarousel();
  }, 100);
}
