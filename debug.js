// Application debugging utilities

// Function for safely logging objects
function safeLog(label, obj) {
    try {
        console.log(`${label}:`, JSON.stringify(obj));
    } catch (e) {
        console.log(`${label} (cannot serialize):`, obj);
    }
}

// Function for displaying error information
function displayError(error, message = "An error occurred") {
    console.error(message, error);
    
    // Create element for error display
    const errorDiv = document.createElement('div');
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.color = '#c62828';
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.fontFamily = 'monospace';
    
    errorDiv.textContent = `${message}: ${error.message || 'Unknown error'}`;
    
    // Add to body or other container
    document.body.appendChild(errorDiv);
    
    // Automatically hide after 10 seconds
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 1s';
        setTimeout(() => errorDiv.remove(), 1000);
    }, 10000);
}

// Function to check and restore base64 image structure
function fixBase64Image(base64String) {
    if (!base64String) return null;
    
    // Check if string contains data:image/ prefix
    if (!base64String.includes('data:image/')) {
        // Try to determine image type from first bytes
        // For simplicity, assume it's JPEG
        return `data:image/jpeg;base64,${base64String.replace(/^[^a-zA-Z0-9+/=]*/g, '')}`;
    }
    
    // If prefix exists but string is truncated, try to restore structure
    const parts = base64String.split(',');
    if (parts.length === 2) {
        const prefix = parts[0];
        const data = parts[1].replace(/^[^a-zA-Z0-9+/=]*/g, '');
        return `${prefix},${data}`;
    }
    
    return base64String;
}

// Function to load and display image with error handling
function loadAndDisplayImage(imageElement, base64String, fallbackText = 'Image unavailable') {
    if (!base64String) {
        imageElement.alt = fallbackText;
        return false;
    }
    
    try {
        const fixedBase64 = fixBase64Image(base64String);
        if (fixedBase64) {
            imageElement.src = fixedBase64;
            
            // Add error handler for loading
            imageElement.onerror = () => {
                console.error('Error loading image');
                imageElement.alt = fallbackText;
                imageElement.style.display = 'none';
            };
            
            return true;
        }
    } catch (e) {
        console.error('Error processing base64 image:', e);
    }
    
    imageElement.alt = fallbackText;
    return false;
}

// Export utilities
window.debug = {
    safeLog,
    displayError,
    fixBase64Image,
    loadAndDisplayImage
};

console.log('Debug utilities loaded');
