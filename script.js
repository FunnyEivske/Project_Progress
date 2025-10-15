// Firebase SDKs - Add these at the top of your script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQuF0P7leiyn3ddC1OfsElFyF6F9sZJzw", // Make sure to use your full, un-redacted key
    authDomain: "panel-aurora.firebaseapp.com",
    projectId: "panel-aurora",
    storageBucket: "panel-aurora.appspot.com", // Corrected storage bucket URL
    messagingSenderId: "479594137457",
    appId: "1:479594137457:web:f3bae0817900e3126218d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


document.addEventListener('DOMContentLoaded', function() {
    
    // --- Random Background Image ---
    const backgroundWrapper = document.querySelector('.background-wrapper');
    
    if (backgroundWrapper) {
        // Define the image sets
        const defaultImages = [
            'Media/Images/Backrounds/Landskap.jpg',
            'Media/Images/Backrounds/Landskap1.jpg',
            'Media/Images/Backrounds/Landskap2.jpg',
            'Media/Images/Backrounds/Landskap3.jpg'
        ];
        const rareDogImage = 'Media/Images/Backrounds/Dog.jpg';
        const veryRareHuldraImage = 'Media/Images/Backrounds/Huldra.jpg';
        const rareVolvoImage = 'Media/Images/Backrounds/Volvo.jpg';

        let imageUrl;
        const bodyClass = document.body.className;
        const randomNumber = Math.random(); 

        if (bodyClass.includes('aurora-page') && randomNumber < 0.001) {
            imageUrl = veryRareHuldraImage;
        } 
        else if (bodyClass.includes('project-v60-t-page') && randomNumber < 0.05) {
            imageUrl = rareVolvoImage;
        }
        else if (bodyClass === '') {
            if (randomNumber < 0.05) {
                imageUrl = rareDogImage;
            } else {
                const randomIndex = Math.floor(Math.random() * defaultImages.length);
                imageUrl = defaultImages[randomIndex];
            }
        }
        else {
            const randomIndex = Math.floor(Math.random() * defaultImages.length);
            imageUrl = defaultImages[randomIndex];
        }
        
        backgroundWrapper.style.backgroundImage = `url('${imageUrl}')`;
    }

    // --- Smooth Fade-in on Scroll Effect ---
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1
    });

    fadeElements.forEach(element => {
        observer.observe(element);
    });
    
    // --- Update Footer Year ---
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new aDate().getFullYear();
    }

    // --- NEW: "Secret" Admin Button ---
    const footer = document.getElementById('footer-section');
    if(footer) {
        let clickCount = 0;
        let timer;
        footer.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 5) { // Needs 5 quick clicks to activate
                window.location.href = 'admin.html';
            }
            clearTimeout(timer);
            timer = setTimeout(() => {
                clickCount = 0;
            }, 1000); // Reset after 1 second
        });
    }

    // --- NEW: Dynamic Content Loading from Firebase ---
    const logContainer = document.getElementById('project-log-container');
    const photoContainer = document.getElementById('photo-gallery-grid');
    const videoContainer = document.getElementById('video-gallery-grid');

    if (logContainer || photoContainer || videoContainer) {
        // Determine project ID from body class e.g., "aurora-page" -> "aurora"
        const projectId = document.body.className.replace('-page', '').trim();
        
        if (projectId) {
            if(logContainer) fetchProjectLogs(projectId);
            if(photoContainer || videoContainer) fetchProjectMedia(projectId);
        }
    }


    // --- Image Modal (Lightbox) Functionality ---
    // Moved the setup logic into a function so we can call it after loading dynamic images
    function setupImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            const modalImg = document.getElementById('modalImage');
            const closeBtn = document.querySelector('.close-button');

            const triggerImages = document.querySelectorAll('.image-popup-trigger img');

            triggerImages.forEach(img => {
                // Prevent adding duplicate listeners
                if(img.dataset.modalAttached) return;
                img.dataset.modalAttached = true;
                
                img.onclick = function() {
                    modal.style.display = "block";
                    modalImg.src = this.src;
                }
            });

            function closeModal() {
                modal.style.display = "none";
                modalImg.classList.remove('zoomed');
            }

            if(closeBtn) {
                closeBtn.onclick = closeModal;
            }

            window.onclick = function(event) {
                if (event.target == modal) {
                    closeModal();
                }
            }
            
            modalImg.onclick = function() {
                this.classList.toggle('zoomed');
            }
        }
    }
    setupImageModal(); // Call it for existing static images


    // --- NEW: Firebase Data Fetching Functions ---
    async function fetchProjectLogs(projectId) {
        const logContainer = document.getElementById('project-log-container');
        const q = query(collection(db, 'project-logs'), where('projectId', '==', projectId), orderBy('timestamp', 'desc'));
        
        try {
            const querySnapshot = await getDocs(q);
            if(querySnapshot.empty) {
                logContainer.innerHTML = '<p class="text-center text-gray-400">No project logs found. Add one from the admin panel!</p>';
                return;
            }

            let html = '';
            querySnapshot.forEach((doc) => {
                const log = doc.data();
                html += `
                    <div class="log-card fade-in">
                        <h3>${log.title}</h3>
                        <p>${log.content.replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            });
            logContainer.innerHTML = html;
            // Re-run animation observer for new elements
            const newFadeElements = logContainer.querySelectorAll('.fade-in');
            newFadeElements.forEach(el => observer.observe(el));

        } catch(error) {
            console.error("Error fetching project logs: ", error);
            logContainer.innerHTML = '<p class="text-center text-red-500">Could not load project logs.</p>';
        }
    }

    async function fetchProjectMedia(projectId) {
        const photoContainer = document.getElementById('photo-gallery-grid');
        const videoContainer = document.getElementById('video-gallery-grid');

        const q = query(collection(db, "project-media"), where("projectId", "==", projectId), orderBy("timestamp", "desc"));
        try {
            const querySnapshot = await getDocs(q);
            let photoHtml = '';
            let videoHtml = '';

            querySnapshot.forEach((doc) => {
                const media = doc.data();
                if (media.type === 'image') {
                    photoHtml += `
                        <div class="placeholder-card fade-in image-popup-trigger">
                            <img src="${media.url}" alt="${media.description}" style="width:100%; height:auto; border-radius: 12px; margin-bottom: 1rem; cursor: pointer;">
                            <p>${media.description}</p>
                        </div>
                    `;
                } else if (media.type === 'video') {
                    videoHtml += `
                        <div class="placeholder-card fade-in">
                            <video controls style="width:100%; border-radius: 12px; margin-bottom: 1rem;">
                                <source src="${media.url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                             <p>${media.description}</p>
                        </div>
                    `;
                }
            });

            if (photoContainer) photoContainer.insertAdjacentHTML('beforeend', photoHtml);
            if (videoContainer) videoContainer.innerHTML = videoHtml || '<p class="text-center text-gray-400 col-span-full">No videos uploaded yet.</p>';
            
            // Re-run animation and modal setup for new elements
            const newFadeElements = document.querySelectorAll('.fade-in:not(.visible)');
            newFadeElements.forEach(el => observer.observe(el));
            setupImageModal();

        } catch (error) {
            console.error("Error fetching project media:", error);
        }
    }
});

