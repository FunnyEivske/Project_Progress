document.addEventListener('DOMContentLoaded', function() {

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyBQuF0P7leiyn3ddC1OfsElFyF6F9sZJzw",
        authDomain: "panel-aurora.firebaseapp.com",
        projectId: "panel-aurora",
        storageBucket: "panel-aurora.appspot.com",
        messagingSenderId: "479594137457",
        appId: "1:479594137457:web:f3bae0817900e3126218d0"
    };

    // --- App Initialization ---
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // --- Automated System Health Tracker ---
    const systemHealth = {
        logs: 'ok',
        media: 'ok',
        progress: 'ok'
    };
    const firebaseStatus = {
        level: 'optimal',
        customMessage: null
    };

    // --- Central function to update the footer status message ---
    function updateSystemStatusMessage() {
        const statusElement = document.getElementById('system-status');
        if (!statusElement) return;

        // An automated error has the highest priority
        if (Object.values(systemHealth).includes('error')) {
            statusElement.textContent = 'some systems need attention.';
            return;
        }

        // If no errors, check for a manual override message from Firebase
        if (firebaseStatus.customMessage) {
            statusElement.textContent = firebaseStatus.customMessage;
            return;
        }

        // If no errors and no override, use the manual level from Firebase
        if (firebaseStatus.level === 'optimal') {
            statusElement.textContent = 'all systems online.';
        } else if (firebaseStatus.level === 'warning') {
            statusElement.textContent = 'some systems need attention.';
        } else {
            statusElement.textContent = 'all systems online.'; // Default fallback
        }
    }


    // --- Random Background Image ---
    const backgroundWrapper = document.querySelector('.background-wrapper');
    if (backgroundWrapper) {
        const defaultImages = [ 'Media/Images/Backrounds/Landskap.jpg', 'Media/Images/Backrounds/Landskap1.jpg', 'Media/Images/Backrounds/Landskap2.jpg', 'Media/Images/Backrounds/Landskap3.jpg' ];
        const rareDogImage = 'Media/Images/Backrounds/Dog.jpg';
        const rareVolvoImage = 'Media/Images/Backrounds/Volvo.jpg';
        
        const veryRareAuroraImages = [
            'Media/Images/Backrounds/Huldra.jpg', 'Media/Images/Backrounds/E.jpg', 'Media/Images/Backrounds/Huldra2.jpg'
        ];

        let imageUrl;
        const bodyClass = document.body.className;
        const randomNumber = Math.random();

        if (bodyClass.includes('aurora-page') && randomNumber < 0.001) { 
            const randomIndex = Math.floor(Math.random() * veryRareAuroraImages.length);
            imageUrl = veryRareAuroraImages[randomIndex];
        } 
        else if (bodyClass.includes('project-v60-t-page') && randomNumber < 0.05) { imageUrl = rareVolvoImage; } 
        else if (bodyClass.includes('index-page')) {
            if (randomNumber < 0.05) { imageUrl = rareDogImage; } 
            else { const randomIndex = Math.floor(Math.random() * defaultImages.length); imageUrl = defaultImages[randomIndex]; }
        } else { const randomIndex = Math.floor(Math.random() * defaultImages.length); imageUrl = defaultImages[randomIndex]; }
        backgroundWrapper.style.backgroundImage = `url('${imageUrl}')`;
    }

    // --- Function to get Project ID from body class ---
    function getProjectIdFromClass(className) {
        return className.replace('-page', '').trim();
    }

    // --- Dynamic Data Fetching ---
    function fetchProjectData() {
        const bodyClass = document.body.className;
        if (bodyClass.includes('index-page')) {
            fetchProjectProgress();
        } else {
            const projectId = getProjectIdFromClass(bodyClass);
            if (!projectId) return;
            fetchProjectLogs(projectId);
            fetchProjectMedia(projectId);
        }
    }
    
    // --- Fetch Progress for Index Page ---
    function fetchProjectProgress() {
        db.collection('project-progress').get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                const projectId = doc.id;
                const data = doc.data();
                const progressBarContainer = document.getElementById(`progress-${projectId}`);
                if (progressBarContainer) {
                    const progressFill = progressBarContainer.querySelector('.progress-fill');
                    if(progressFill) {
                        progressFill.style.width = `${data.progress}%`;
                    }
                }
            });
            systemHealth.progress = 'ok';
        }).catch(error => {
            console.error("Error fetching project progress: ", error);
            systemHealth.progress = 'error';
        }).finally(() => {
            updateSystemStatusMessage();
        });
    }

    // --- Fetch Logs for Project Pages ---
    function fetchProjectLogs(projectId) {
        const logContainer = document.getElementById('project-log-container');
        if (!logContainer) return;
        db.collection('project-logs').where('projectId', '==', projectId).get()
            .then(querySnapshot => {
                logContainer.innerHTML = '';
                if (querySnapshot.empty) {
                    logContainer.innerHTML = '<p>No project logs yet. Check back soon!</p>';
                    return;
                }
                
                const logs = [];
                querySnapshot.forEach(doc => logs.push(doc.data()));
                logs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

                logs.forEach(log => {
                    const logCard = document.createElement('div');
                    logCard.className = 'log-card fade-in';
                    logCard.innerHTML = `<h3>${log.title}</h3><p>${log.content.replace(/\n/g, '<br>')}</p>`;
                    logContainer.appendChild(logCard);
                });

                observeFadeInElements();
                systemHealth.logs = 'ok';
            }).catch(error => {
                console.error("Error fetching project logs: ", error);
                logContainer.innerHTML = '<p>Could not load project logs.</p>';
                systemHealth.logs = 'error';
            }).finally(() => {
                updateSystemStatusMessage();
            });
    }

    // --- Fetch Media for Project Pages ---
    function fetchProjectMedia(projectId) {
        const photoGrid = document.getElementById('photo-gallery-grid');
        const videoGrid = document.getElementById('video-gallery-grid');
        if (!photoGrid && !videoGrid) return;

        db.collection('project-media').where('projectId', '==', projectId).get()
            .then(querySnapshot => {
                if (photoGrid) photoGrid.innerHTML = '';
                if (videoGrid) videoGrid.innerHTML = '';
                
                const mediaItems = [];
                querySnapshot.forEach(doc => mediaItems.push(doc.data()));
                mediaItems.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

                let photosFound = false;
                let videosFound = false;

                mediaItems.forEach(media => {
                    if (media.type === 'image' && photoGrid) {
                        photosFound = true;
                        const item = document.createElement('div');
                        item.className = 'placeholder-card fade-in image-popup-trigger';
                        item.innerHTML = `<img src="${media.url}" alt="${media.description}" style="width:100%; height:auto; border-radius: 12px; margin-bottom: 1rem; cursor: pointer;"><p>${media.description}</p>`;
                        photoGrid.appendChild(item);
                    } else if (media.type === 'video' && videoGrid) {
                        videosFound = true;
                        const item = document.createElement('div');
                        item.className = 'placeholder-card fade-in';
                        item.innerHTML = `<video controls style="width:100%; border-radius: 12px; margin-bottom: 1rem;"><source src="${media.url}" type="video/mp4"></video><p>${media.description}</p>`;
                        videoGrid.appendChild(item);
                    }
                });

                if (photoGrid && !photosFound) photoGrid.innerHTML = '<div class="placeholder-card"><p>No photos uploaded yet.</p></div>';
                if (videoGrid && !videosFound) videoGrid.innerHTML = '<div class="placeholder-card"><p>No videos uploaded yet.</p></div>';
                
                initializeModal();
                observeFadeInElements();
                systemHealth.media = 'ok';
            }).catch(error => {
                console.error("Error fetching media: ", error);
                if (photoGrid) photoGrid.innerHTML = '<div class="placeholder-card"><p>Could not load photos.</p></div>';
                if (videoGrid) videoGrid.innerHTML = '<div class="placeholder-card"><p>Could not load videos.</p></div>';
                systemHealth.media = 'error';
            }).finally(() => {
                updateSystemStatusMessage();
            });
    }

    // --- Listen for Manual System Status updates from Firebase ---
    function listenForSystemStatus() {
        const statusElement = document.getElementById('system-status');
        if (!statusElement) return;

        db.collection('system_status').doc('main').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                firebaseStatus.level = data.level || 'optimal';
                firebaseStatus.customMessage = data.customMessage || null;
            } else {
                firebaseStatus.level = 'optimal';
                firebaseStatus.customMessage = null;
            }
            updateSystemStatusMessage(); // Update the message based on new Firebase data
        }, error => {
            console.error("Error fetching system status: ", error);
            statusElement.textContent = 'hull failure imminent! Abandon ship!';
        });
    }

    // --- Secret Admin Button ---
    const footer = document.getElementById('footer-section');
    if (footer) {
        let clickCount = 0, clickTimer = null;
        footer.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
            if (clickCount >= 5) window.location.href = 'admin.html';
        });
    }

    // --- Smooth Fade-in on Scroll Effect ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    function observeFadeInElements() {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
    }
    
    // --- Update Footer Year ---
    const yearElement = document.getElementById('current-year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();

    // --- Image Modal (Lightbox) Functionality ---
    let modalInitialized = false;
    function initializeModal() {
        if (modalInitialized) return;
        const modal = document.getElementById('imageModal');
        if (!modal) return;
        const modalImg = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.close-button');
        
        document.body.addEventListener('click', function(event) {
            if (event.target.parentElement && event.target.parentElement.classList.contains('image-popup-trigger')) {
                 modal.style.display = "block";
                 modalImg.src = event.target.src;
            }
        });

        const closeModal = () => {
            modal.style.display = "none";
            modalImg.classList.remove('zoomed');
        };

        if (closeBtn) closeBtn.onclick = closeModal;
        window.onclick = (event) => { if (event.target == modal) closeModal(); };
        if (modalImg) modalImg.onclick = () => modalImg.classList.toggle('zoomed');
        modalInitialized = true;
    }

    // --- Initial Page Load ---
    fetchProjectData();
    observeFadeInElements();
    initializeModal();
    listenForSystemStatus(); // Activate our new status listener!
});

