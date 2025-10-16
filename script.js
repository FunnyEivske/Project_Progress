document.addEventListener('DOMContentLoaded', function() {

    // --- Firebase Configuration ---
    // This is your configuration that you provided.
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

    // --- Random Background Image (Restored) ---
    const backgroundWrapper = document.querySelector('.background-wrapper');
    if (backgroundWrapper) {
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
        } else if (bodyClass.includes('project-v60-t-page') && randomNumber < 0.05) {
            imageUrl = rareVolvoImage;
        } else if (bodyClass === '' || bodyClass.includes('index-page')) { // For main page
            if (randomNumber < 0.05) {
                imageUrl = rareDogImage;
            } else {
                const randomIndex = Math.floor(Math.random() * defaultImages.length);
                imageUrl = defaultImages[randomIndex];
            }
        } else { // For all other pages
            const randomIndex = Math.floor(Math.random() * defaultImages.length);
            imageUrl = defaultImages[randomIndex];
        }
        backgroundWrapper.style.backgroundImage = `url('${imageUrl}')`;
    }

    // --- Function to get Project ID from body class ---
    function getProjectIdFromClass(className) {
        const match = className.match(/(\S+)-page/);
        return match ? match[1] : null;
    }

    // --- Function to fetch and render dynamic project data ---
    function fetchProjectData() {
        const projectId = getProjectIdFromClass(document.body.className);
        if (!projectId) return;

        const logContainer = document.getElementById('project-log-container');
        const photoGrid = document.getElementById('photo-gallery-grid');
        const videoGrid = document.getElementById('video-gallery-grid');

        // Fetch Project Logs
        if (logContainer) {
            db.collection('project-logs').where('projectId', '==', projectId).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        logContainer.innerHTML = '<p>Ingen prosjektlogger enda. Kom tilbake snart!</p>';
                        return;
                    }
                    logContainer.innerHTML = '';
                    querySnapshot.forEach(doc => {
                        const log = doc.data();
                        const logCard = document.createElement('div');
                        logCard.className = 'log-card fade-in';
                        logCard.innerHTML = `<h3>${log.title}</h3><p>${log.content}</p>`;
                        logContainer.appendChild(logCard);
                    });
                    observeFadeInElements();
                })
                .catch(error => {
                    console.error("Error getting project logs: ", error);
                    logContainer.innerHTML = '<p>Kunne ikke laste prosjektlogger.</p>';
                });
        }
        
        // Fetch Media
        if (photoGrid || videoGrid) {
            db.collection('project-media').where('projectId', '==', projectId).get()
                .then(querySnapshot => {
                    // Start with empty containers to clear "Loading..." messages
                    if (photoGrid) photoGrid.innerHTML = '';
                    if (videoGrid) videoGrid.innerHTML = '';

                    let photosFound = false;
                    let videosFound = false;

                    querySnapshot.forEach(doc => {
                        const media = doc.data();
                        
                        if (media.type === 'image' && photoGrid) {
                            photosFound = true;
                            const mediaItem = document.createElement('div');
                            mediaItem.className = 'placeholder-card fade-in image-popup-trigger';
                            mediaItem.innerHTML = `
                                <img src="${media.url}" alt="${media.description}" style="width:100%; height:auto; border-radius: 12px; margin-bottom: 1rem; cursor: pointer;">
                                <p>${media.description}</p>
                            `;
                            photoGrid.appendChild(mediaItem);
                        } else if (media.type === 'video' && videoGrid) {
                            videosFound = true;
                            const mediaItem = document.createElement('div');
                            mediaItem.className = 'placeholder-card fade-in';
                            mediaItem.innerHTML = `
                                <video controls style="width:100%; border-radius: 12px; margin-bottom: 1rem;">
                                    <source src="${media.url}" type="video/mp4">
                                    Nettleseren din støtter ikke video-taggen.
                                </video>
                                <p>${media.description}</p>
                            `;
                            videoGrid.appendChild(mediaItem);
                        }
                    });

                    // Logic to show placeholder if no media was found
                    if (photoGrid && !photosFound) {
                        photoGrid.innerHTML = '<div class="placeholder-card"><p>Ingen bilder lastet opp enda.</p></div>';
                    }
                    if (videoGrid && !videosFound) {
                        videoGrid.innerHTML = '<div class="placeholder-card"><p>Ingen videoer lastet opp enda.</p></div>';
                    }

                    initializeModal();
                    observeFadeInElements();
                })
                .catch(error => {
                    console.error("Error getting media: ", error);
                    if (photoGrid) photoGrid.innerHTML = '<div class="placeholder-card"><p>Kunne ikke laste bilder.</p></div>';
                    if (videoGrid) videoGrid.innerHTML = '<div class="placeholder-card"><p>Kunne ikke laste videoer.</p></div>';
                });
        }
    }

    // --- Secret Admin Button ---
    const footer = document.getElementById('footer-section');
    if (footer) {
        let clickCount = 0;
        let clickTimer = null;
        footer.addEventListener('click', () => {
            clickCount++;
            if (clickTimer) clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
            if (clickCount >= 5) {
                window.location.href = 'admin.html';
            }
        });
    }

    // --- Smooth Fade-in on Scroll Effect ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    function observeFadeInElements() {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(element => {
            observer.observe(element);
        });
    }
    
    // --- Update Footer Year ---
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // --- Image Modal (Lightbox) Functionality ---
    function initializeModal() {
        const modal = document.getElementById('imageModal');
        if (!modal) return;
        const modalImg = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.close-button');

        document.querySelectorAll('.image-popup-trigger img').forEach(img => {
            if (!img.onclick) { // Prevents adding multiple listeners
                img.onclick = function() {
                    modal.style.display = "block";
                    modalImg.src = this.src;
                }
            }
        });

        if (closeBtn && !closeBtn.onclick) closeBtn.onclick = closeModal;
        window.onclick = function(event) { if (event.target == modal) closeModal(); }
        if (modalImg && !modalImg.onclick) modalImg.onclick = function() { this.classList.toggle('zoomed'); }
    }

    function closeModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.style.display = "none";
            document.getElementById('modalImage').classList.remove('zoomed');
        }
    }

    // --- Initial Page Load ---
    fetchProjectData();
    observeFadeInElements();
    initializeModal();
});

