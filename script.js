// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQuF0P7leiyn3ddC1OfsElFyF6F9sZJzw", // Use your full key
    authDomain: "panel-aurora.firebaseapp.com",
    projectId: "panel-aurora",
    storageBucket: "panel-aurora.appspot.com",
    messagingSenderId: "479594137457",
    appId: "1:479594137457:web:f3bae0817900e3126218d0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


document.addEventListener('DOMContentLoaded', function() {
<<<<<<< Updated upstream
    
=======

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

>>>>>>> Stashed changes
    // --- Random Background Image ---
    const backgroundWrapper = document.querySelector('.background-wrapper');
    
    if (backgroundWrapper) {
<<<<<<< Updated upstream
        // Define the image sets
        const defaultImages = [
            'Media/Images/Backrounds/Landskap.jpg',
            'Media/Images/Backrounds/Landskap1.jpg',
            'Media/Images/Backrounds/Landskap2.jpg',
            'Media/Images/Backrounds/Landskap3.jpg'
        ];
=======
        const defaultImages = [ 'Media/Images/Backrounds/Landskap.jpg', 'Media/Images/Backrounds/Landskap1.jpg', 'Media/Images/Backrounds/Landskap2.jpg', 'Media/Images/Backrounds/Landskap3.jpg' ];
>>>>>>> Stashed changes
        const rareDogImage = 'Media/Images/Backrounds/Dog.jpg';
        const veryRareHuldraImage = 'Media/Images/Backrounds/Huldra.jpg';
        const rareVolvoImage = 'Media/Images/Backrounds/Volvo.jpg';
        let imageUrl;
        const bodyClass = document.body.className;
<<<<<<< Updated upstream
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

=======
        const randomNumber = Math.random();
        if (bodyClass.includes('aurora-page') && randomNumber < 0.001) { imageUrl = veryRareHuldraImage; } 
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
        }).catch(error => console.error("Error fetching project progress: ", error));
    }


    // --- Fetch Logs for Project Pages ---
    function fetchProjectLogs(projectId) {
        const logContainer = document.getElementById('project-log-container');
        if (!logContainer) return;
        db.collection('project-logs').where('projectId', '==', projectId).get()
            .then(querySnapshot => {
                logContainer.innerHTML = ''; // Clear loading message
                if (querySnapshot.empty) {
                    logContainer.innerHTML = '<p>Ingen prosjektlogger enda. Kom tilbake snart!</p>';
                    return;
                }
                querySnapshot.forEach(doc => {
                    const log = doc.data();
                    const logCard = document.createElement('div');
                    logCard.className = 'log-card fade-in';
                    logCard.innerHTML = `<h3>${log.title}</h3><p>${log.content.replace(/\n/g, '<br>')}</p>`;
                    logContainer.appendChild(logCard);
                });
                observeFadeInElements();
            }).catch(error => {
                console.error("Error fetching project logs: ", error);
                logContainer.innerHTML = '<p>Kunne ikke laste prosjektlogger.</p>';
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
                let photosFound = false;
                let videosFound = false;
                querySnapshot.forEach(doc => {
                    const media = doc.data();
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
                if (photoGrid && !photosFound) photoGrid.innerHTML = '<div class="placeholder-card"><p>Ingen bilder lastet opp enda.</p></div>';
                if (videoGrid && !videosFound) videoGrid.innerHTML = '<div class="placeholder-card"><p>Ingen videoer lastet opp enda.</p></div>';
                initializeModal();
                observeFadeInElements();
            }).catch(error => {
                console.error("Error fetching media: ", error);
                if (photoGrid) photoGrid.innerHTML = '<div class="placeholder-card"><p>Kunne ikke laste bilder.</p></div>';
                if (videoGrid) videoGrid.innerHTML = '<div class="placeholder-card"><p>Kunne ikke laste videoer.</p></div>';
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

>>>>>>> Stashed changes
    // --- Smooth Fade-in on Scroll Effect ---
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
<<<<<<< Updated upstream
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
=======
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    function observeFadeInElements() {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
    }
>>>>>>> Stashed changes
    
    // --- Update Footer Year ---
    const yearElement = document.getElementById('current-year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();

<<<<<<< Updated upstream
    // --- "Secret" Admin Button ---
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

    // --- Dynamic Content Loading from Firebase ---
    const logContainer = document.getElementById('project-log-container');
    const photoContainer = document.getElementById('photo-gallery-grid');
    const videoContainer = document.getElementById('video-gallery-grid');

    if (logContainer || photoContainer || videoContainer) {
        const projectId = document.body.className.replace('-page', '').trim();
        
        if (projectId) {
            if(logContainer) fetchProjectLogs(projectId);
            if(photoContainer || videoContainer) fetchProjectMedia(projectId);
        }
    }

    function setupImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            const modalImg = document.getElementById('modalImage');
            const closeBtn = document.querySelector('.close-button');
            const triggerImages = document.querySelectorAll('.image-popup-trigger img');

            triggerImages.forEach(img => {
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
=======
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
>>>>>>> Stashed changes
            }

<<<<<<< Updated upstream
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
=======
        const closeModal = () => {
            modal.style.display = "none";
            modalImg.classList.remove('zoomed');
        };

        if (closeBtn) closeBtn.onclick = closeModal;
        window.onclick = (event) => { if (event.target == modal) closeModal(); };
        if (modalImg) modalImg.onclick = () => modalImg.classList.toggle('zoomed');
        modalInitialized = true;
>>>>>>> Stashed changes
    }
    setupImageModal(); 

    // --- Firebase Data Fetching Functions (Compat Syntax) ---
    function fetchProjectLogs(projectId) {
        const logContainer = document.getElementById('project-log-container');
        db.collection('project-logs').where('projectId', '==', projectId).orderBy('timestamp', 'desc').get()
            .then((querySnapshot) => {
                if(querySnapshot.empty) {
                    logContainer.innerHTML = '<p>No project logs found. Add one from the admin panel!</p>';
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
                const newFadeElements = logContainer.querySelectorAll('.fade-in');
                newFadeElements.forEach(el => observer.observe(el));
            })
            .catch((error) => {
                console.error("Error fetching project logs: ", error);
                logContainer.innerHTML = '<p>Could not load project logs.</p>';
            });
    }

    function fetchProjectMedia(projectId) {
        const photoContainer = document.getElementById('photo-gallery-grid');
        const videoContainer = document.getElementById('video-gallery-grid');

        db.collection("project-media").where("projectId", "==", projectId).orderBy("timestamp", "desc").get()
            .then((querySnapshot) => {
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
                if (videoContainer) videoContainer.innerHTML = videoHtml || '<p>No videos uploaded yet.</p>';
                
                const newFadeElements = document.querySelectorAll('.fade-in:not(.visible)');
                newFadeElements.forEach(el => observer.observe(el));
                setupImageModal();
            })
            .catch((error) => {
                console.error("Error fetching project media:", error);
            });
    }
});

