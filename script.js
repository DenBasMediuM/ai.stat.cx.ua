document.addEventListener('DOMContentLoaded', () => {
    const userMessage = document.getElementById('userMessage');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    
    // Global variable to store message history
    let conversationHistory = [];
    
    // User authentication flag
    let isUserAuthenticated = false;
    
    // UI elements
    const myProjectsButton = document.querySelector('.my-projects');
    
    // Check authentication status when page loads
    const checkAuthStatus = async () => {
        try {
            const response = await fetch('check_auth.php');
            const data = await response.json();
            
            isUserAuthenticated = data.authenticated;
            
            // Update "My Projects" button style based on authentication status
            if (isUserAuthenticated) {
                myProjectsButton.style.opacity = '1';
                myProjectsButton.style.cursor = 'pointer';
                myProjectsButton.title = 'View your saved projects';
            } else {
                myProjectsButton.style.opacity = '0.5';
                myProjectsButton.style.cursor = 'not-allowed';
                myProjectsButton.title = 'Login to access saved projects';
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
        }
    };

	const extractJson = (str) => {
		const start = str.indexOf('{');
		const end = str.lastIndexOf('}');
		
		if (start !== -1 && end !== -1 && end > start) {
			const jsonStr = str.substring(start, end + 1);
			try {
			return JSON.parse(jsonStr);
			} catch (e) {
			console.error("Error parsing JSON:", e);
			}
		}
		return null;
	};
    
    // Call authentication check
    checkAuthStatus();
    
    // Modified function to add message to chat and history
    const addMessageToChat = (text, isUser) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the last message
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save message to history
        conversationHistory.push({
            type: isUser ? 'user' : 'bot',
            text: text,
            timestamp: new Date().toISOString()
        });
    };
    
    // Function to send message to webhook and get response
    const sendMessage = async (text) => {
        if (!text.trim()) return;
        
        // Add user message to chat
        addMessageToChat(text, true);
        
        try {
            const response = await fetch('https://itsa777.app.n8n.cloud/webhook/5e1d9bad-433a-43b7-a406-1295aff6c7f0', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: text }) // Changed parameter from message to question
            });
            
            if (response.ok) {
                // Get response from webhook
                const result = await response.json();
                console.log("Received data from API:", result);
                
                if (result.output) {
					match = '';
                    // Check data type of result.output
					if (typeof result.output === 'object') {
						// If it's an object, serialize it to a string
  						result.output = JSON.stringify(result.output, null, 2);
						match = result.output;
					}
                    if (typeof result.output === 'string') {
                        // Check if the response contains a JSON block
                        //const match = result.output.match(/```json\s*([\s\S]*?)```/);

						if (result.output.includes('"user": "dreamsWizard"')) {
							match = extractJson(result.output);
						}
                        if (match) {
                            console.log(match);
                            
                            // Save JSON data for possible regeneration
                            const jsonData = match;
                            
                            // Save client_id for later use
                            let lastClientId;
                            
                            // Function to check image generation status
                            const checkImageStatus = async (imageId) => {
                                try {
                                    console.log('Requesting status for ID:', imageId);
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "id": imageId
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Error requesting image status:', response.status);
                                        return null;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Received status:', JSON.stringify(result));
                                    return result;
                                } catch (error) {
                                    console.error("Error checking image status:", error);
                                    return null;
                                }
                            };
                            
                            // Recursive function for periodic status checking
                            const pollImageStatus = async (imageId, attempt = 1) => {
                                if (attempt > 30) { // Increase attempts to 30 (5 minutes)
                                    addMessageToChat("Maximum time for image generation exceeded", false);
                                    return;
                                }
                                
                                console.log(`Image status check, attempt ${attempt}/30`);
                                const result = await checkImageStatus(imageId);
                                
                                if (result && result.completed === true && result.images && result.images.length > 0) {
                                    console.log(`Images ready! Count: ${result.images.length}`);
                                    // Images ready, display them with selection options
                                    displayImages(result.images, imageId);
                                } else {
                                    // Not ready yet, wait 10 seconds and check again
                                    addMessageToChat(`Images are generating... (${attempt}/30)`, false);
                                    
                                    // If received response but no ready images - show details
                                    if (result) {
                                        console.log(`Status: completed=${result.completed}, images=${result.images ? result.images.length : 'none'}`);
                                    }
                                    
                                    setTimeout(() => pollImageStatus(imageId, attempt + 1), 10000);
                                }
                            };
                            
                            // Function for generating images
                            const generateImages = async (jsonPayload) => {
                                try {
                                    // Send JSON to second webhook to get image
                                    const responseApi1 = await fetch("https://itsa777.app.n8n.cloud/webhook/654ca023-d8a1-47c7-ba21-c7d6d746ea51", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ response: jsonPayload })
                                    });
                                    
                                    if (!responseApi1.ok) {
                                        console.error('Error requesting image API:', responseApi1.status);
                                        addMessageToChat("Error generating images", false);
                                        return;
                                    }
                                    
                                    const resultApi1 = await responseApi1.json();
                                    console.log("Response from image API:", resultApi1);
                                    
                                    // Save client_id for use in selectImage
                                    lastClientId = resultApi1.client_id;
                                    console.log('Saved client_id:', lastClientId);
                                    
                                    addMessageToChat(`Image generation task submitted`, false);
                                    
                                    // Start process of checking and getting images
                                    checkAndDisplayImages(resultApi1.id);
                                } catch (err) {
                                    console.error("Error starting image generation:", err);
                                    addMessageToChat("An error occurred while generating images", false);
                                }
                            };
                            
                            // Function for displaying images with selection options
                            const displayImages = (images, imageId) => {
                                if (!images || !images.length) return;
                                
                                // Remove previous gallery if exists
                                const existingGallery = document.querySelector('.image-gallery');
                                if (existingGallery) existingGallery.remove();
                                
                                const existingActions = document.querySelector('.image-actions');
                                if (existingActions) existingActions.remove();
                                
                                // Create container for image gallery
                                const galleryContainer = document.createElement('div');
                                galleryContainer.className = 'message bot-message image-gallery';
                                galleryContainer.style.display = 'grid';
                                galleryContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
                                galleryContainer.style.gap = '10px';
                                
                                // Add all images to gallery with selection option
                                images.forEach((imageUrl, index) => {
                                    const imageCard = document.createElement('div');
                                    imageCard.style.position = 'relative';
                                    imageCard.style.border = '1px solid #ddd';
                                    imageCard.style.borderRadius = '5px';
                                    imageCard.style.padding = '5px';
                                    imageCard.style.cursor = 'pointer';
                                    imageCard.style.transition = 'transform 0.2s';
                                    
                                    const imgElement = document.createElement('img');
                                    imgElement.src = imageUrl;
                                    imgElement.alt = `AI image ${index + 1}`;
                                    imgElement.style.maxWidth = "100%";
                                    imgElement.style.borderRadius = "5px";
                                    
                                    // Image number
                                    const imageNumber = document.createElement('div');
                                    imageNumber.textContent = `${index + 1}`;
                                    imageNumber.style.position = 'absolute';
                                    imageNumber.style.top = '5px';
                                    imageNumber.style.left = '5px';
                                    imageNumber.style.backgroundColor = 'rgba(0,0,0,0.6)';
                                    imageNumber.style.color = 'white';
                                    imageNumber.style.borderRadius = '50%';
                                    imageNumber.style.width = '24px';
                                    imageNumber.style.height = '24px';
                                    imageNumber.style.display = 'flex';
                                    imageNumber.style.alignItems = 'center';
                                    imageNumber.style.justifyContent = 'center';
                                    
                                    imageCard.appendChild(imgElement);
                                    imageCard.appendChild(imageNumber);
                                    
                                    // Hover effect
                                    imageCard.addEventListener('mouseover', () => {
                                        imageCard.style.transform = 'scale(1.03)';
                                    });
                                    
                                    imageCard.addEventListener('mouseout', () => {
                                        imageCard.style.transform = 'scale(1)';
                                    });
                                    
                                    // Click handler for image selection
                                    imageCard.addEventListener('click', () => {
                                        selectImage(imageUrl, index, lastClientId);
                                    });
                                    
                                    galleryContainer.appendChild(imageCard);
                                });
                                
                                // Add gallery to chat
                                chatMessages.appendChild(galleryContainer);
                                
                                // Create regenerate button
                                const actionContainer = document.createElement('div');
                                actionContainer.className = 'message bot-message image-actions';
                                actionContainer.style.display = 'flex';
                                actionContainer.style.justifyContent = 'center';
                                actionContainer.style.gap = '10px';
                                actionContainer.style.marginTop = '10px';
                                
                                const regenerateButton = document.createElement('button');
                                regenerateButton.textContent = 'Regenerate All';
                                regenerateButton.className = 'action-button regenerate';
                                regenerateButton.style.padding = '8px 16px';
                                regenerateButton.style.backgroundColor = '#f0f0f0';
                                regenerateButton.style.border = '1px solid #ddd';
                                regenerateButton.style.borderRadius = '5px';
                                regenerateButton.style.cursor = 'pointer';
                                regenerateButton.style.fontWeight = 'bold';
                                
                                regenerateButton.addEventListener('click', () => {
                                    // Remove current gallery and action buttons
                                    galleryContainer.remove();
                                    actionContainer.remove();
                                    
                                    // Regenerate images
                                    addMessageToChat("Regenerating images...", false);
                                    generateImages(jsonData);
                                });
                                
                                actionContainer.appendChild(regenerateButton);
                                chatMessages.appendChild(actionContainer);
                                
                                // Scroll chat down
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
                                addMessageToChat("Select an image or regenerate all", false);
                            };
                            
                            // Function for handling image selection
                            const selectImage = async (imageUrl, index, clientId) => {
                                // Display selected image larger
                                const selectedImgContainer = document.createElement('div');
                                selectedImgContainer.className = 'message bot-message selected-image';
                                selectedImgContainer.style.textAlign = 'center';
                                
                                const selectedImg = document.createElement('img');
                                selectedImg.src = imageUrl;
                                selectedImg.alt = "Selected image";
                                selectedImg.style.maxWidth = "80%";
                                selectedImg.style.borderRadius = "5px";
                                selectedImg.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                                
                                selectedImgContainer.appendChild(selectedImg);
                                chatMessages.appendChild(selectedImgContainer);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
								addMessageToChat(`You selected image ${index + 1}`, true);
                                addMessageToChat("Creating highest resolution image...", false);

								// Display information about selected image and client_id
								//console.log('client_id:', clientId);
								//console.log('images:', imageUrl);
                                
                                // Logic for creating high-resolution image
                                // (Placeholder as per requirements)

								try {
                                    console.log('upscale...');
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/71fbba0d-d009-4aef-9485-83597e59d167", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "client_id": clientId,
											"images": [imageUrl]
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Error upscale:', response.status);
                                        return null;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Received upscale response:', JSON.stringify(result));
                                    
                                    // Check for ID to track status
                                    if (result && result.id) {
                                        const upscaleId = result.id;
                                        addMessageToChat("Creating high-resolution image, please wait...", false);
                                        
                                        // Start process of tracking high-resolution image readiness
                                        pollUpscaledImageStatus(upscaleId, 1, clientId);
                                    } else {
                                        addMessageToChat("Failed to start high-resolution image generation", false);
                                        console.error("Response does not contain ID for tracking:", result);
                                    }
                                    
                                    return result;
                                } catch (error) {
                                    console.error("Error during upscale:", error);
                                    addMessageToChat("An error occurred while creating high-resolution image", false);
                                    return null;
                                }
                            };
                            
                            // Function to check high-resolution image generation status
                            const checkUpscaledImageStatus = async (imageId) => {
                                try {
                                    console.log('Checking upscaled image status for ID:', imageId);
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "id": imageId
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Error requesting upscaled image status:', response.status);
                                        return null;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Upscaled image status:', JSON.stringify(result));
                                    return result;
                                } catch (error) {
                                    console.error("Error checking upscaled image status:", error);
                                    return null;
                                }
                            };
                            
                            // Recursive function for periodic checking of upscaled image status
                            const pollUpscaledImageStatus = async (imageId, attempt = 1, clientId) => {
                                if (attempt > 30) { // Limit attempts
                                    addMessageToChat("Maximum time for high-resolution image generation exceeded", false);
                                    return;
                                }
                                
                                console.log(`Checking upscaled image status, attempt ${attempt}/30`);
                                const result = await checkUpscaledImageStatus(imageId);
                                
                                if (result && result.completed === true && result.images && result.images.length > 0) {
                                    console.log(`Upscaled image ready!`);
                                    // Image ready, display it
                                    displayUpscaledImage(result.images[0], imageId, clientId);
                                    
                                    // Clear server resources after successful display
                                    clearServerResources(clientId, imageId);
                                } else {
                                    // Not ready yet, wait 10 seconds and check again
                                    if (attempt % 3 === 0) { // Notify user every 3 attempts
                                        addMessageToChat(`High-resolution image is being created... (${attempt}/30)`, false);
                                    }
                                    
                                    // If received response but no ready images - show details
                                    if (result) {
                                        console.log(`Upscale status: completed=${result.completed}, images=${result.images ? result.images.length : 'none'}`);
                                    }
                                    
                                    setTimeout(() => pollUpscaledImageStatus(imageId, attempt + 1, clientId), 10000);
                                }
                            };
                            
                            // Function to display upscaled image
                            const displayUpscaledImage = (imageUrl, upscaleId, clientId) => {
                                // Create container for high-quality image
                                const highResContainer = document.createElement('div');
                                highResContainer.className = 'message bot-message high-res-image';
                                highResContainer.style.textAlign = 'center';
                                highResContainer.style.marginTop = '20px';
                                
                                // Create heading
                                const heading = document.createElement('h4');
                                heading.textContent = 'Image at highest quality:';
                                heading.style.marginBottom = '10px';
                                heading.style.color = '#333';
                                
                                // Create image
                                const imgElement = document.createElement('img');
                                imgElement.src = imageUrl;
                                imgElement.alt = "High-resolution image";
                                imgElement.style.maxWidth = "90%";
                                imgElement.style.borderRadius = "8px";
                                imgElement.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
                                
                                // Add to container and chat
                                highResContainer.appendChild(heading);
                                highResContainer.appendChild(imgElement);
                                chatMessages.appendChild(highResContainer);
                                
                                // Scroll chat down
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
                                // Success message
                                addMessageToChat("High-resolution image is ready!", false);
                                
                                // Create container for action buttons
                                const actionsContainer = document.createElement('div');
                                actionsContainer.className = 'message bot-message actions-container';
                                actionsContainer.style.display = 'flex';
                                actionsContainer.style.justifyContent = 'center';
                                actionsContainer.style.gap = '10px';
                                actionsContainer.style.marginTop = '10px';
                                
                                // Add download button
                                const downloadButton = document.createElement('a');
                                downloadButton.textContent = 'Download Image';
                                downloadButton.href = imageUrl;
                                downloadButton.download = 'high-resolution-image.jpg';
                                downloadButton.style.padding = '8px 16px';
                                downloadButton.style.backgroundColor = '#4CAF50';
                                downloadButton.style.color = 'white';
                                downloadButton.style.border = 'none';
                                downloadButton.style.borderRadius = '5px';
                                downloadButton.style.cursor = 'pointer';
                                downloadButton.style.textDecoration = 'none';
                                downloadButton.style.fontWeight = 'bold';
                                
                                actionsContainer.appendChild(downloadButton);
                                
                                // Check if user is authenticated to add save button
                                if (isUserAuthenticated) {
                                    // Add save project button
                                    const saveButton = document.createElement('button');
                                    saveButton.textContent = 'Save Project';
                                    saveButton.className = 'save-project-btn';
                                    saveButton.style.padding = '8px 16px';
                                    saveButton.style.backgroundColor = '#2196F3';
                                    saveButton.style.color = 'white';
                                    saveButton.style.border = 'none';
                                    saveButton.style.borderRadius = '5px';
                                    saveButton.style.cursor = 'pointer';
                                    saveButton.style.fontWeight = 'bold';
                                    saveButton.style.marginLeft = '10px';
                                    
                                    // Click handler for save button
                                    saveButton.addEventListener('click', () => {
                                        saveProject(imageUrl);
                                    });
                                    
                                    actionsContainer.appendChild(saveButton);
                                }
                                
                                chatMessages.appendChild(actionsContainer);
                                
                                // Clear server resources after successful display
                                clearServerResources(clientId, upscaleId);
                            };
                            
                            // Function to save project
                            const saveProject = (imageUrl) => {
                                // Ask user for project name
                                const projectName = prompt('Enter project name:');
                                
                                if (!projectName || projectName.trim() === '') {
                                    return; // User canceled or entered empty string
                                }
                                
                                // Show saving indicator
                                const savingMessage = addMessageToChat('Saving project...', false);
                                
                                // Form data for saving
                                const projectData = {
                                    name: projectName,
                                    image: imageUrl,
                                    conversation: conversationHistory
                                };
                                
                                // Send save request
                                fetch('save_project.php', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(projectData)
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        // Show success message
                                        addMessageToChat(`Project "${projectName}" successfully saved!`, false);
                                    } else {
                                        // Show error message
                                        addMessageToChat(`Error saving project: ${data.message}`, false);
                                    }
                                })
                                .catch(error => {
                                    // Show error message
                                    addMessageToChat('An error occurred while saving the project', false);
                                    console.error('Error saving project:', error);
                                });
                            };
                            
                            // Function to check and display images
                            const checkAndDisplayImages = async (imageId) => {
                                try {
                                    // Initial status check
                                    const responseApi2 = await fetch("https://itsa777.app.n8n.cloud/webhook/e7a59345-0b95-46f5-8abd-aea5a2ea2134", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "id": imageId
                                        })
                                    });
                                    
                                    if (!responseApi2.ok) {
                                        console.error('Error requesting image API:', responseApi2.status);
                                        return;
                                    }
                                    const resultApi2 = await responseApi2.json();
                                    
                                    console.log("Response from image API:", resultApi2);
                                    
                                    // Check image generation status
                                    if (resultApi2.completed === true && resultApi2.images && resultApi2.images.length > 0) {
                                        // Images already ready, display them
                                        displayImages(resultApi2.images, imageId);
                                        
                                        // Clear server resources after successful display
                                        clearServerResources(lastClientId, imageId);
                                    } else {
                                        // Images not ready yet, start periodic check
                                        addMessageToChat("Images are generating, please wait...", false);
                                        pollImageStatus(imageId);
                                    }
                                } catch (error) {
                                    console.error("Error processing image:", error);
                                }
                            };
                            
                            // Function to clean up server resources
                            const clearServerResources = async (clientId, id) => {
                                try {
                                    console.log(`Cleaning server resources: clientId=${clientId}, id=${id}`);
                                    
                                    // Instead of direct API call to DreamsGenerator, use n8n webhook as proxy
                                    const response = await fetch("https://itsa777.app.n8n.cloud/webhook/9fde9366-fe69-4bbd-8756-0f7cf2e08f10", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "user": "dreamsWizard",
                                            "password": "dreamsWizard2024",
                                            "client_id": clientId,
                                            "id": id
                                        })
                                    });
                                    
                                    if (!response.ok) {
                                        console.error('Error clearing server resources:', response.status);
                                        return;
                                    }
                                    
                                    const result = await response.json();
                                    console.log('Resources successfully cleared:', result);
                                } catch (error) {
                                    // Suppress error to not block main functionality
                                    console.error("Error clearing server resources:", error);
                                    console.log("Continuing without resource cleanup");
                                }
                            };
                            
                            // Start image generation process
                            generateImages(jsonData);
                        } else {
                            // Regular text response
                            addMessageToChat(result.output, false);
                        }
                    } else {
                        // Unknown format
                        addMessageToChat(`Received response in unknown format: ${typeof result.output}`, false);
                    }
                } else {
                    // If no output field, show entire response
                    addMessageToChat(`Raw response: ${JSON.stringify(result)}`, false);
                }
                
                userMessage.value = '';
            } else {
                console.error('Error sending message');
                addMessageToChat("Error: Failed to get response", false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChat("Error: Failed to connect to server", false);
        }
    };
    
    // Event listener for send button
    sendButton.addEventListener('click', () => {
        sendMessage(userMessage.value);
    });
    
    // Event listener for Enter key
    userMessage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(userMessage.value);
        }
    });
    
    // Improved error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
    
    // Handle unhandled Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise rejection:', event.reason);
    });
    
    // Project button functionality
    myProjectsButton.addEventListener('click', () => {
        if (isUserAuthenticated) {
            showUserProjects();
        } else {
            // If user is not authenticated, show message
            addMessageToChat('Login required to access projects', false);
        }
    });
    
    document.querySelector('.new-project').addEventListener('click', () => {
        // Send "let's create a project" message when button is clicked
        const projectMessage = "let's create a project";
        sendMessage(projectMessage);
    });
    
    // Hide greeting after first interaction
    const hideGreetingAfterFirstMessage = () => {
        const greeting = document.querySelector('.greeting');
        if (greeting && chatMessages.children.length > 0) {
            greeting.style.display = 'none';
        }
    };
    
    // Observe changes in message container
    const observer = new MutationObserver(hideGreetingAfterFirstMessage);
    observer.observe(chatMessages, { childList: true });
    
    // Function to check validity of base64 image string
    function isValidBase64Image(str) {
        if (!str) return false;
        // Check if string starts with data:image/
        return typeof str === 'string' && str.startsWith('data:image/');
    }

    // Function to display user projects
    const showUserProjects = async () => {
        if (!isUserAuthenticated) {
            return; // Do not execute if user is not authenticated
        }
        
        try {
            // Show loading indicator
            const loadingMessage = addMessageToChat('Loading your projects...', false);
            
            // Load user projects
            const response = await fetch('get_projects.php');
            const data = await response.json();
            
            // Clear chat to display projects
            chatMessages.innerHTML = '';
            
            if (!data.success || data.projects.length === 0) {
                addMessageToChat('You have no saved projects yet.', false);
                addMessageToChat('Create a new project using the "NEW PROJECT" button.', false);
                return;
            }
            
            // Add header
            const headerMessage = document.createElement('div');
            headerMessage.className = 'message bot-message project-header';
            headerMessage.innerHTML = `<h2>Your saved projects (${data.projects.length})</h2>
                                      <p>Select a project to view or return to the conversation.</p>`;
            chatMessages.appendChild(headerMessage);
            
            // Create container for projects in grid view
            const projectsGrid = document.createElement('div');
            projectsGrid.className = 'projects-grid';
            projectsGrid.style.display = 'grid';
            projectsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            projectsGrid.style.gap = '15px';
            projectsGrid.style.padding = '15px 0';
            
            // Add projects to grid
            data.projects.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.className = 'project-card';
                projectCard.style.border = '1px solid #ddd';
                projectCard.style.borderRadius = '8px';
                projectCard.style.overflow = 'hidden';
                projectCard.style.cursor = 'pointer';
                projectCard.style.transition = 'transform 0.2s';
                projectCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                projectCard.style.backgroundColor = '#fff';
                
                // Add image thumbnail
                const imgContainer = document.createElement('div');
                imgContainer.style.width = '100%';
                imgContainer.style.height = '150px';
                imgContainer.style.backgroundColor = '#f5f5f5';
                imgContainer.style.display = 'flex';
                imgContainer.style.alignItems = 'center';
                imgContainer.style.justifyContent = 'center';
                imgContainer.style.overflow = 'hidden';
                
                if (project.image && isValidBase64Image(project.image)) {
                    const img = document.createElement('img');
                    img.src = project.image;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    imgContainer.appendChild(img);
                } else {
                    const noImgText = document.createElement('div');
                    noImgText.textContent = 'No image';
                    noImgText.style.color = '#999';
                    imgContainer.appendChild(noImgText);
                }
                
                projectCard.appendChild(imgContainer);
                
                // Add project information
                const projectInfo = document.createElement('div');
                projectInfo.style.padding = '10px';
                
                const projectName = document.createElement('h3');
                projectName.style.margin = '0 0 5px 0';
                projectName.style.fontSize = '16px';
                projectName.textContent = project.name;
                
                const projectDate = document.createElement('p');
                projectDate.style.margin = '0';
                projectDate.style.fontSize = '12px';
                projectDate.style.color = '#666';
                
                // Format date
                const date = new Date(project.created_at);
                projectDate.textContent = date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                projectInfo.appendChild(projectName);
                projectInfo.appendChild(projectDate);
                projectCard.appendChild(projectInfo);
                
                // Add hover effects
                projectCard.addEventListener('mouseover', () => {
                    projectCard.style.transform = 'scale(1.03)';
                });
                
                projectCard.addEventListener('mouseout', () => {
                    projectCard.style.transform = 'scale(1)';
                });
                
                // Click handler for viewing project
                projectCard.addEventListener('click', () => {
                    viewProject(project.id);
                });
                
                projectsGrid.appendChild(projectCard);
            });
            
            chatMessages.appendChild(projectsGrid);
            
            // Add button to return to dialog
            const backButton = document.createElement('button');
            backButton.textContent = 'Return to Conversation';
            backButton.style.padding = '10px 20px';
            backButton.style.backgroundColor = '#f0f0f0';
            backButton.style.border = '1px solid #ddd';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            backButton.style.display = 'block';
            backButton.style.margin = '15px auto';
            
            backButton.addEventListener('click', () => {
                window.location.reload(); // Simple way to return to dialog
            });
            
            chatMessages.appendChild(backButton);
            
        } catch (error) {
            addMessageToChat('An error occurred while loading projects', false);
            console.error('Error loading projects:', error);
            
            // Add button for retry
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Try Again';
            retryButton.style.padding = '8px 16px';
            retryButton.style.margin = '10px 0';
            retryButton.style.cursor = 'pointer';
            
            retryButton.addEventListener('click', showUserProjects);
            
            chatMessages.appendChild(retryButton);
        }
    };
    
    // Function to view specific project
    const viewProject = async (projectId) => {
        try {
            // Clear chat
            chatMessages.innerHTML = '';
            
            // Show loading message
            addMessageToChat('Loading project...', false);
            
            // Load project data
            const response = await fetch(`get_project.php?id=${projectId}`);
            const data = await response.json();
            
            if (!data.success) {
                addMessageToChat(`Error loading project: ${data.message}`, false);
                return;
            }
            
            const project = data.project;
            
            // Clear chat again to display project
            chatMessages.innerHTML = '';
            
            // Add project header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'project-header';
            headerDiv.innerHTML = `<h2>${project.name}</h2>
                                  <p>Created: ${new Date(project.created_at).toLocaleDateString('en-US')}</p>`;
            headerDiv.style.padding = '10px';
            headerDiv.style.marginBottom = '15px';
            headerDiv.style.borderBottom = '1px solid #eee';
            chatMessages.appendChild(headerDiv);
            
            // Restore message history
            try {
                const conversations = JSON.parse(project.content);
                conversations.forEach(msg => {
                    const isUser = msg.type === 'user';
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
                    messageDiv.textContent = msg.text;
                    chatMessages.appendChild(messageDiv);
                });
            } catch (e) {
                console.error('Error parsing message history:', e);
                addMessageToChat('Error loading message history', false);
            }
            
            // Add project image
            if (project.image && isValidBase64Image(project.image)) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'project-image';
                imageContainer.style.textAlign = 'center';
                imageContainer.style.marginTop = '20px';
                
                const img = document.createElement('img');
                img.src = project.image;
                img.style.maxWidth = '90%';
                img.style.borderRadius = '8px';
                img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                
                imageContainer.appendChild(img);
                chatMessages.appendChild(imageContainer);
            }
            
            // Add button to return to project list
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginTop = '20px';
            
            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Projects';
            backButton.style.padding = '8px 16px';
            backButton.style.backgroundColor = '#f0f0f0';
            backButton.style.border = '1px solid #ddd';
            backButton.style.borderRadius = '5px';
            backButton.style.cursor = 'pointer';
            
            backButton.addEventListener('click', showUserProjects);
            
            const newChatButton = document.createElement('button');
            newChatButton.textContent = 'New Conversation';
            newChatButton.style.padding = '8px 16px';
            newChatButton.style.backgroundColor = '#4CAF50';
            newChatButton.style.color = 'white';
            newChatButton.style.border = 'none';
            newChatButton.style.borderRadius = '5px';
            newChatButton.style.cursor = 'pointer';
            
            newChatButton.addEventListener('click', () => {
                window.location.reload();
            });
            
            buttonContainer.appendChild(backButton);
            buttonContainer.appendChild(newChatButton);
            chatMessages.appendChild(buttonContainer);
            
        } catch (error) {
            addMessageToChat('An error occurred while loading the project', false);
            console.error('Error loading project:', error);
        }
    };
});
