document.addEventListener('DOMContentLoaded', function() {
    
    // --- Random Background Image ---
    const backgroundWrapper = document.querySelector('.background-wrapper');
    const imageUrls = [
        'https://images-bonnier.imgix.net/files/dif/production/2024/06/23204235/eternal-kingdom-V1sczRo_9vle-__CLHQlXg_xx4524-scaled.jpg?auto=compress,format&w=1500',
        'https://images-bonnier.imgix.net/files/dif/production/2024/06/23204208/reign-of-ice-Mogb0UbLPi39JhQuJ-TQpA_xx5368-scaled.jpg?auto=compress,format&w=1500',
        'https://images-bonnier.imgix.net/files/dif/production/2024/06/23204214/redemption-road-qL3N-92RzCAuCSqSSf0_Bg_xx9602-scaled.jpg?auto=compress,format&w=1500',
        'https://images-bonnier.imgix.net/files/dif/production/2024/06/23204220/firechild-an4WjCBpiNaAS6yXKDPXXA_xx8359-scaled.jpg?auto=compress,format&w=1500',
        'https://images-bonnier.imgix.net/files/dif/production/2024/06/23204228/yggdrasil-_e3zNZvyNmmijnm2mIjzNg_xx9474-scaled.jpg?auto=compress,format&w=1500'
    ];

    if (backgroundWrapper) {
        const randomIndex = Math.floor(Math.random() * imageUrls.length);
        const randomImageUrl = imageUrls[randomIndex];
        backgroundWrapper.style.backgroundImage = `url('${randomImageUrl}')`;
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
