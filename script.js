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
    const auth = firebase.auth(); // Make auth and storage available globally in this script
    const storage = firebase.storage();

    const bodyClass = document.body.className;

    // =========================================================================
    //  ADMIN PANEL CODE
    //  This code will ONLY run if the body has the class "admin-page"
    // =========================================================================
    if (bodyClass.includes('admin-page')) {
        
        // --- Element References ---
        const loginForm = document.getElementById('login-form');
        const logoutSection = document.getElementById('logout-section');
        const contentManagement = document.getElementById('content-management');
        const userEmailSpan = document.getElementById('user-email');

        // --- Project Data ---
        const projects = [
            { id: 'anaru', name: 'Anaru (OwlHarpy)' },
            { id: 'aurora', name: 'Aurora' },
            { id: 'dr-darling', name: 'Dr. Darling' },
            { id: 'snufkin', name: 'Snufkin (Moomin)' },
            { id: 'alastor', name: 'Alastor (Hazbin Hotel)' },
            { id: 'helldiver', name: 'Helldiver EX-03' },
            { id: 'nms-traveler', name: 'NMS Traveler' },
            { id: 'alan-wake', name: 'Alan Wake 2' },
            { id: 'project-v60-t', name: 'Project V60-T' },
            { id: 'larp-armory', name: 'LARP Armory' },
            { id: 'prop-electronics-lab', name: 'Prop & Electronics Lab' }
        ];

        // --- Function to populate project dropdowns ---
        function populateDropdowns() {
            const allSelects = document.querySelectorAll('select');
            let projectOptionsHtml = '';
            projects.forEach(p => {
                projectOptionsHtml += `<option value="${p.id}">${p.name}</option>`;
            });
            
            allSelects.forEach(s => {
                // Only populate selects that are meant for projects
                if (s.id.includes('-project-id')) {
                    s.innerHTML = projectOptionsHtml;
                }
            });
        }
        populateDropdowns();

        // --- NEW: Tab Switching Logic ---
        const tabNav = document.querySelector('.admin-tab-nav');
        const tabButtons = document.querySelectorAll('.admin-tab-btn');
        const tabContents = document.querySelectorAll('.admin-tab-content');

        if (tabNav) {
            tabNav.addEventListener('click', (e) => {
                const clickedTab = e.target.closest('.admin-tab-btn');
                if (!clickedTab) return; // Exit if they clicked the nav background

                e.preventDefault(); // Stop any default button behavior
                const tabId = clickedTab.dataset.tab;

                // 1. Deactivate all buttons and tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // 2. Activate the clicked button
                clickedTab.classList.add('active');

                // 3. Activate the corresponding content pane
                const activePane = document.getElementById(`tab-${tabId}`);
                if (activePane) {
                    activePane.classList.add('active');
                }
            });
        }
        // --- End of Tab Switching Logic ---


        // --- Authentication Logic ---
        auth.onAuthStateChanged(user => {
            const welcomeSubtitle = document.getElementById('welcome-subtitle');
            if (user) {
                // Special Welcome Message Logic
                const randomNumber = Math.random();
                if (randomNumber < 0.02) { 
                    welcomeSubtitle.textContent = "You are the best captain on the planet, I'm not even squiddin";
                    document.getElementById('login-sound-rare').play().catch(e => console.error("Audio play failed.", e));
                } else if (randomNumber < 0.17) {
                    welcomeSubtitle.textContent = "Welcome back, Anaru! Let's get the workshop updated.";
                    document.getElementById('login-sound-common').play().catch(e => console.error("Audio play failed.", e));
                } else {
                    welcomeSubtitle.textContent = "Welcome back, Anaru! Let's get the workshop updated.";
                }
                
                // Show/Hide Elements
                loginForm.style.display = 'none';
                logoutSection.style.display = 'block';
                contentManagement.style.display = 'block';
                userEmailSpan.textContent = user.email;
                
                // Fetch initial data
                fetchCurrentProgress(document.getElementById('progress-project-id').value);
                fetchCurrentSiteStatus();
            } else {
                // Logged out state
                loginForm.style.display = 'block';
                logoutSection.style.display = 'none';
                contentManagement.style.display = 'none';
                welcomeSubtitle.textContent = "Welcome back, Anaru! Let's get the workshop updated.";
            }
        });

        // Login Button
        document.getElementById('login-button').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => alert('Login Failed: ' + error.message));
        });

        // Logout Button
        document.getElementById('logout-button').addEventListener('click', () => {
            const randomNumber = Math.random();
            let soundPlayed = false;

            if (randomNumber < 0.02) {
                soundPlayed = true;
                document.getElementById('logout-sound-rare').play().catch(e => console.error("Audio play failed.", e));
            } else if (randomNumber < 0.17) {
                soundPlayed = true;
                document.getElementById('logout-sound-common').play().catch(e => console.error("Audio play failed.", e));
            }

            if (soundPlayed) {
                setTimeout(() => auth.signOut(), 500);
            } else {
                auth.signOut();
            }
        });

        // --- Project Log Form Logic ---
        document.getElementById('log-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const projectId = document.getElementById('log-project-id').value;
            const title = document.getElementById('log-title').value;
            const content = document.getElementById('log-content').value;
            let logDate = document.getElementById('log-date').value; // Get the date
            
            // If date is not set, use today's date
            if (!logDate) {
                logDate = new Date().toISOString().split('T')[0];
            }

            db.collection('project-logs').add({
                projectId,
                title,
                content,
                date: logDate, // Save the date string
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Keep for internal sorting
            }).then(() => {
                alert('Log added successfully!');
                e.target.reset();
            }).catch(error => alert('Error adding log: ' + error.message));
        });

        // --- Media Upload Form Logic ---
        document.getElementById('media-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const projectId = document.getElementById('media-project-id').value;
            const file = document.getElementById('media-file').files[0];
            const description = document.getElementById('media-description').value;
            const progressP = document.getElementById('upload-progress');

            if (!file) {
                alert('Please select a file to upload.');
                return;
            }

            const fileType = file.type.split('/')[0];
            const storageRef = storage.ref(`${projectId}/${Date.now()}_${file.name}`);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressP.style.display = 'block';
                    progressP.textContent = `Uploading: ${Math.round(progress)}%`;
                }, 
                (error) => {
                    alert('Upload failed: ' + error.message);
                    progressP.style.display = 'none';
                }, 
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                        db.collection('project-media').add({
                            projectId,
                            url: downloadURL,
                            description,
                            type: fileType,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            alert('Media uploaded successfully!');
                            e.target.reset();
                            progressP.style.display = 'none';
                        });
                    });
                }
            );
        });

        // --- Progress Bar Form Logic ---
        const progressProjectIdSelect = document.getElementById('progress-project-id');
        const progressSlider = document.getElementById('progress-slider');
        const progressValueInput = document.getElementById('progress-value');
        
        progressSlider.addEventListener('input', () => progressValueInput.value = progressSlider.value);
        progressValueInput.addEventListener('input', () => progressSlider.value = progressValueInput.value);

        progressProjectIdSelect.addEventListener('change', (e) => {
            fetchCurrentProgress(e.target.value);
        });

        function fetchCurrentProgress(projectId) {
            db.collection('project-progress').doc(projectId).get().then(doc => {
                if (doc.exists) {
                    const progress = doc.data().progress || 0;
                    progressSlider.value = progress;
                    progressValueInput.value = progress;
                } else {
                    progressSlider.value = 0;
                    progressValueInput.value = 0;
                }
            }).catch(error => {
                console.error("Error fetching current progress:", error);
                progressSlider.value = 0;
                progressValueInput.value = 0;
            });
        }

        document.getElementById('progress-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const projectId = progressProjectIdSelect.value;
            const progress = parseInt(progressValueInput.value, 10);

            db.collection('project-progress').doc(projectId).set({
                progress: progress
            }).then(() => {
                alert(`Progress for ${projectId} updated to ${progress}%!`);
            }).catch(error => alert('Error updating progress: ' + error.message));
        });

        // --- System Status Form Logic ---
        const statusForm = document.getElementById('status-form');
        const statusLevelSelect = document.getElementById('status-level');
        const statusMessageInput = document.getElementById('status-message');
        const clearStatusButton = document.getElementById('clear-status-message');
        const statusDocRef = db.collection('system_status').doc('main');

        function fetchCurrentSiteStatus() {
            statusDocRef.get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    statusLevelSelect.value = data.level || 'optimal';
                    statusMessageInput.value = data.customMessage || ''; 
                } else {
                    statusLevelSelect.value = 'optimal';
                    statusMessageInput.value = '';
                }
            }).catch(error => {
                console.error("Error fetching site status:", error);
                alert("Could not load site status.");
            });
        }

        statusForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newLevel = statusLevelSelect.value;
            const newMessage = statusMessageInput.value.trim(); 

            statusDocRef.set({
                level: newLevel,
                customMessage: newMessage || null
            }, { merge: true })
            .then(() => {
                alert('Site status updated successfully!');
            }).catch(error => {
                alert('Error updating status: ' + error.message);
            });
        });

        clearStatusButton.addEventListener('click', () => {
            statusMessageInput.value = '';
        });

        // --- Media Management Logic (FIXED) ---
        const loadMediaButton = document.getElementById('load-media-button');
        const manageProjectIdSelect = document.getElementById('manage-project-id');
        const mediaGrid = document.getElementById('media-grid');
        const mediaLoadStatus = document.getElementById('media-load-status');

        // Load Media Button
        loadMediaButton.addEventListener('click', () => {
            const projectId = manageProjectIdSelect.value;
            mediaGrid.innerHTML = ''; // Clear existing grid
            mediaLoadStatus.textContent = 'Loading media...';
            
            // REMOVED: .orderBy('timestamp', 'desc')
            db.collection('project-media').where('projectId', '==', projectId).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        mediaLoadStatus.textContent = 'No media found for this project.';
                        return;
                    }
                    
                    mediaLoadStatus.textContent = ''; // Clear status

                    // ADDED: Sort media in JavaScript
                    const mediaItems = [];
                    querySnapshot.forEach(doc => {
                        // Store both data and doc.id
                        mediaItems.push({ id: doc.id, data: doc.data() });
                    });
                    mediaItems.sort((a, b) => (b.data.timestamp?.seconds || 0) - (a.data.timestamp?.seconds || 0));


                    mediaItems.forEach(item => {
                        const media = item.data;
                        const docId = item.id;
                        
                        const card = document.createElement('div');
                        card.className = 'media-item-card';
                        
                        let mediaPreview = '';
                        if (media.type === 'image') {
                            mediaPreview = `<img src="${media.url}" alt="${media.description}">`;
                        } else if (media.type === 'video') {
                            // Use a video tag, muted and preload="metadata" for a lightweight preview
                            mediaPreview = `<video src="${media.url}#t=0.5" muted preload="metadata" style="width:100%; height:100px; object-fit: cover;"></video>`;
                        } else {
                            mediaPreview = `<span>Unknown type</span>`;
                        }
                        
                        card.innerHTML = `
                            ${mediaPreview}
                            <input type="text" class="media-description-input" value="${media.description || ''}" placeholder="Description">
                            <button class="edit-media-btn" data-doc-id="${docId}">Save Text</button>
                            <button class="delete-media-btn" data-doc-id="${docId}" data-media-url="${media.url}">Delete</button>
                        `;
                        
                        mediaGrid.appendChild(card);
                    });
                }).catch(error => {
                    console.error("Error loading media: ", error);
                    mediaLoadStatus.textContent = 'Error loading media. Check console.';
                });
        });

        // --- UPDATED: Media Grid Event Delegation ---
        mediaGrid.addEventListener('click', (e) => {
            const btn = e.target;
            
            // --- Handle Delete Button ---
            if (btn.classList.contains('delete-media-btn')) {
                const docId = btn.dataset.docId;
                const mediaUrl = btn.dataset.mediaUrl;

                if (btn.classList.contains('confirm-delete')) {
                    // --- Second click: Perform deletion ---
                    btn.textContent = 'Deleting...';
                    btn.disabled = true;

                    // 1. Get a reference to the file in Storage
                    const storageRef = storage.refFromURL(mediaUrl);
                    
                    // 2. Delete the file from Storage
                    storageRef.delete().then(() => {
                        // 3. If storage deletion is successful, delete from Firestore
                        deleteFirestoreRecord(docId, btn, 'Media deleted successfully!');
                    }).catch(error => {
                        console.error("Error deleting from Storage: ", error);
                        if (error.code === 'storage/object-not-found') {
                            console.warn('File not found in storage, deleting from Firestore only.');
                            deleteFirestoreRecord(docId, btn, 'Media record deleted (file was already missing).');
                        } else {
                            alert('Error deleting file: ' + error.message);
                            btn.textContent = 'Delete'; // Reset button
                            btn.disabled = false;
                            btn.classList.remove('confirm-delete');
                        }
                    });
                    
                } else {
                    // --- First click: Ask for confirmation ---
                    // Reset any other buttons
                    mediaGrid.querySelectorAll('.confirm-delete').forEach(otherBtn => {
                        otherBtn.textContent = 'Delete';
                        otherBtn.classList.remove('confirm-delete');
                    });
                    
                    // Set this button to confirm state
                    btn.classList.add('confirm-delete');
                    btn.textContent = 'Confirm Delete?';
                }
            } // --- End Delete Button Logic ---
            
            // --- Handle Save Text Button ---
            if (btn.classList.contains('edit-media-btn')) {
                const docId = btn.dataset.docId;
                const card = btn.closest('.media-item-card');
                const newDescription = card.querySelector('.media-description-input').value;
                
                btn.textContent = 'Saving...';
                btn.disabled = true;

                db.collection('project-media').doc(docId).update({
                    description: newDescription
                }).then(() => {
                    btn.textContent = 'Saved!';
                    setTimeout(() => {
                        btn.textContent = 'Save Text';
                        btn.disabled = false;
                    }, 2000);
                }).catch(error => {
                    alert('Error saving: ' + error.message);
                    btn.textContent = 'Save Text';
                    btn.disabled = false;
                });
            } // --- End Save Text Button Logic ---

        }); // --- End Media Grid Event Delegation ---

        // Helper function to delete from Firestore and update UI
        function deleteFirestoreRecord(docId, btn, alertMessage) {
            db.collection('project-media').doc(docId).delete().then(() => {
                btn.closest('.media-item-card').remove();
                alert(alertMessage);
                if (mediaGrid.children.length === 0) {
                    mediaLoadStatus.textContent = 'No media found for this project.';
                }
            }).catch(error => {
                console.error("Error deleting from Firestore: ", error);
                alert('Error deleting database record.');
                btn.textContent = 'Delete'; // Reset button
                btn.disabled = false;
                btn.classList.remove('confirm-delete');
            });
        }

        // --- NEW: Log Management Logic ---
        const loadLogsButton = document.getElementById('load-logs-button');
        const manageLogsProjectIdSelect = document.getElementById('manage-logs-project-id');
        const logGrid = document.getElementById('log-grid');
        const logLoadStatus = document.getElementById('log-load-status');

        // 1. Load Logs Button
        loadLogsButton.addEventListener('click', () => {
            const projectId = manageLogsProjectIdSelect.value;
            logGrid.innerHTML = '';
            logLoadStatus.textContent = 'Loading logs...';

            db.collection('project-logs').where('projectId', '==', projectId).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        logLoadStatus.textContent = 'No logs found for this project.';
                        return;
                    }

                    logLoadStatus.textContent = ''; // Clear status

                    // Sort logs in JavaScript
                    const logs = [];
                    querySnapshot.forEach(doc => {
                        logs.push({ id: doc.id, data: doc.data() });
                    });
                    
                    // Sort by 'date' string (YYYY-MM-DD) descending, fallback to timestamp
                    logs.sort((a, b) => {
                        const dateA = a.data.date || (a.data.timestamp?.seconds || 0);
                        const dateB = b.data.date || (b.data.timestamp?.seconds || 0);
                        return dateB > dateA ? 1 : -1;
                    });


                    logs.forEach(item => {
                        const log = item.data;
                        const docId = item.id;
                        
                        const card = document.createElement('div');
                        card.className = 'log-item-card';
                        
                        // Use log.date if it exists, fallback to formatting timestamp, else empty
                        let logDate = log.date || '';
                        if (!logDate && log.timestamp) {
                            // Convert firebase timestamp to YYYY-MM-DD
                            logDate = new Date(log.timestamp.seconds * 1000).toISOString().split('T')[0];
                        }

                        card.innerHTML = `
                            <label>Title</label>
                            <input type="text" class="log-title-input" value="${log.title || ''}" placeholder="Log Title">
                            
                            <label>Date</label>
                            <input type="date" class="log-date-input" value="${logDate}">
                            
                            <label>Content</label>
                            <textarea class="log-content-input" placeholder="Log Content">${log.content || ''}</textarea>
                            
                            <div class="button-group">
                                <button class="edit-log-btn" data-doc-id="${docId}">Save Changes</button>
                                <button class="delete-log-btn" data-doc-id="${docId}">Delete Log</button>
                            </div>
                        `;
                        
                        logGrid.appendChild(card);
                    });

                }).catch(error => {
                    console.error("Error loading logs: ", error);
                    logLoadStatus.textContent = 'Error loading logs. Check console.';
                });
        });

        // 2. Log Grid Event Delegation (Edit and Delete)
        logGrid.addEventListener('click', (e) => {
            const btn = e.target;
            const docId = btn.dataset.docId;

            // --- Handle Edit Log Button ---
            if (btn.classList.contains('edit-log-btn')) {
                const card = btn.closest('.log-item-card');
                const newTitle = card.querySelector('.log-title-input').value;
                const newDate = card.querySelector('.log-date-input').value;
                const newContent = card.querySelector('.log-content-input').value;

                if (!newTitle || !newDate || !newContent) {
                    alert('Please fill out all fields (Title, Date, Content) before saving.');
                    return;
                }
                
                btn.textContent = 'Saving...';
                btn.disabled = true;

                db.collection('project-logs').doc(docId).update({
                    title: newTitle,
                    date: newDate,
                    content: newContent
                }).then(() => {
                    btn.textContent = 'Saved!';
                    setTimeout(() => {
                        btn.textContent = 'Save Changes';
                        btn.disabled = false;
                    }, 2000);
                }).catch(error => {
                    alert('Error saving log: ' + error.message);
                    btn.textContent = 'Save Changes';
                    btn.disabled = false;
                });
            }

            // --- Handle Delete Log Button ---
            if (btn.classList.contains('delete-log-btn')) {
                if (btn.classList.contains('confirm-delete')) {
                    // --- Second click: Perform deletion ---
                    btn.textContent = 'Deleting...';
                    btn.disabled = true;

                    db.collection('project-logs').doc(docId).delete().then(() => {
                        alert('Log deleted successfully!');
                        card.remove(); // Remove the card from the UI
                        if (logGrid.children.length === 0) {
                            logLoadStatus.textContent = 'No logs found for this project.';
                        }
                    }).catch(error => {
                        alert('Error deleting log: ' + error.message);
                        btn.textContent = 'Delete Log';
                        btn.disabled = false;
                        btn.classList.remove('confirm-delete');
                    });
                    
                } else {
                    // --- First click: Ask for confirmation ---
                    // Reset any other buttons
                    logGrid.querySelectorAll('.confirm-delete').forEach(otherBtn => {
                        otherBtn.textContent = 'Delete Log';
                        otherBtn.classList.remove('confirm-delete');
                    });
                    
                    // Set this button to confirm state
                    btn.classList.add('confirm-delete');
                    btn.textContent = 'Confirm Delete?';
                }
            }
        });

    // =========================================================================
    //  END OF ADMIN PANEL CODE
    // =========================================================================

    } else {

    // =========================================================================
    //  MAIN WEBSITE CODE
    //  This code will run on ALL pages EXCEPT the admin page
    // =========================================================================

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
            // const bodyClass is already defined at the top
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
            
            if (imageUrl) { // Only set if one was chosen
                backgroundWrapper.style.backgroundImage = `url('${imageUrl}')`;
            }
        }

        // --- Function to get Project ID from body class ---
        function getProjectIdFromClass(className) {
            // Find the class that ends with '-page' and is not 'admin-page'
            const pageClass = className.split(' ').find(cls => cls.endsWith('-page') && cls !== 'admin-page');
            if (pageClass) {
                return pageClass.replace('-page', '').trim();
            }
            return null;
        }

        // --- Dynamic Data Fetching ---
        function fetchProjectData() {
            // const bodyClass is already defined at the top
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
                            progressFill.style.width = `${data.progress || 0}%`;
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

        // --- Fetch Logs for Project Pages (FIXED & UPDATED) ---
        function fetchProjectLogs(projectId) {
            const logContainer = document.getElementById('project-log-container');
            if (!logContainer) return;
            
            // REMOVED: .orderBy()
            db.collection('project-logs').where('projectId', '==', projectId).get()
                .then(querySnapshot => {
                    logContainer.innerHTML = '';
                    if (querySnapshot.empty) {
                        logContainer.innerHTML = '<p>No project logs yet. Check back soon!</p>';
                        return;
                    }
                    
                    // ADDED: Sort logs in JavaScript
                    const logs = [];
                    querySnapshot.forEach(doc => logs.push(doc.data()));

                    // Sort by 'date' string (YYYY-MM-DD) descending, fallback to timestamp
                    logs.sort((a, b) => {
                        const dateA = a.date || (a.timestamp?.seconds || 0);
                        const dateB = b.date || (b.timestamp?.seconds || 0);
                        return dateB > dateA ? 1 : -1;
                    });


                    logs.forEach(log => {
                        const logCard = document.createElement('div');
                        logCard.className = 'log-card fade-in';
                        
                        // --- NEW: Date Formatting ---
                        let dateHtml = '';
                        if (log.date) {
                            // Re-format YYYY-MM-DD to a user-friendly format
                            try {
                                const dateParts = log.date.split('-');
                                const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                                const formattedDate = dateObj.toLocaleDateString('en-US', options);
                                dateHtml = `<p class="log-card-date">${formattedDate}</p>`;
                            } catch (e) {
                                console.warn('Could not parse date string:', log.date);
                                // Fallback for invalid date string
                                dateHtml = `<p class="log-card-date">${log.date}</p>`;
                            }
                        }
                        // --- End Date Formatting ---

                        logCard.innerHTML = `
                            <h3>${log.title}</h3>
                            ${dateHtml}
                            <p>${log.content.replace(/\n/g, '<br>')}</p>
                        `;
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

        // --- Fetch Media for Project Pages (FIXED) ---
        function fetchProjectMedia(projectId) {
            const photoGrid = document.getElementById('photo-gallery-grid');
            const videoGrid = document.getElementById('video-gallery-grid');
            if (!photoGrid && !videoGrid) return;

            // REMOVED: .orderBy()
            db.collection('project-media').where('projectId', '==', projectId).get()
                .then(querySnapshot => {
                    if (photoGrid) photoGrid.innerHTML = '';
                    if (videoGrid) videoGrid.innerHTML = '';
                    
                    // ADDED: Sort media in JavaScript
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

    // =========================================================================
    //  END OF MAIN WEBSITE CODE
    // =========================================================================
    }

});

