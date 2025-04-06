// Save this as assets/js/custom.js

document.addEventListener('DOMContentLoaded', function() {
    // Map publication type codes to human-readable names
    const pubTypeMap = {
      '1': 'Conference Paper',
      '2': 'Journal Article',
      '3': 'Preprint / Working Paper',
      '4': 'Report',
      '5': 'Book',
      '6': 'Book Chapter',
      '7': 'Thesis',
      '8': 'Patent'
    };
    
    // Find publication type filter dropdowns
    const typeDropdowns = document.querySelectorAll('select[data-filter="publication_type"], select.pub-filters-select, select.js-pub-type-filter');
    
    typeDropdowns.forEach(dropdown => {
      // Replace numeric options with text labels
      Array.from(dropdown.options).forEach(option => {
        const value = option.value;
        // Keep "All" option as is
        if (value !== '*' && pubTypeMap[value]) {
          // Change display text only, keep value the same
          option.textContent = pubTypeMap[value];
        }
      });
    });
    
    // Also update any publication type badges in the UI
    document.querySelectorAll('span.publication-type').forEach(span => {
      const typeCode = span.textContent.trim();
      if (pubTypeMap[typeCode]) {
        span.textContent = pubTypeMap[typeCode];
      }
    });
    
    // Update any links that might include publication types
    document.querySelectorAll('a[href*="publication_type"]').forEach(link => {
      for (const [code, name] of Object.entries(pubTypeMap)) {
        if (link.textContent.trim() === code) {
          link.textContent = name;
        }
      }
    });
  });