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
        const randomNumber = Math.random(); // Generate one random number for efficiency

        // --- Page-Specific Logic ---

        // VERRRY rare chance for Huldra on Aurora's page
        if (bodyClass.includes('aurora-page') && randomNumber < 0.001) {
            imageUrl = veryRareHuldraImage;
        } 
        // Rare chance for Volvo on the V60-T page
        else if (bodyClass.includes('project-v60-t-page') && randomNumber < 0.05) {
            imageUrl = rareVolvoImage;
        }
        // Logic for the MAIN page (index.html), which has no specific body class
        else if (bodyClass === '') {
            // Rare chance for the Dog image on the main page
            if (randomNumber < 0.05) {
                imageUrl = rareDogImage;
            } else {
                // Otherwise, pick a random image from the default set
                const randomIndex = Math.floor(Math.random() * defaultImages.length);
                imageUrl = defaultImages[randomIndex];
            }
        }
        // --- Default Logic for all other pages ---
        else {
            // For all other pages, just pick a random default landscape
            const randomIndex = Math.floor(Math.random() * defaultImages.length);
            imageUrl = defaultImages[randomIndex];
        }
        
        // Set the chosen background image
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

    // --- Image Modal (Lightbox) Functionality ---
    const modal = document.getElementById('imageModal');
    if (modal) {
        const modalImg = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.close-button');

        const triggerImages = document.querySelectorAll('.image-popup-trigger img');

        triggerImages.forEach(img => {
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
});