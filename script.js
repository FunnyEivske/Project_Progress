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
        yearElement.textContent = new Date().getFullYear();
    }

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

