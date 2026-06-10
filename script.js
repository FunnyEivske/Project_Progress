// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBQuF0P7leiyn3ddC1OfsElFyF6F9sZJzw",
    authDomain: "panel-aurora.firebaseapp.com",
    projectId: "panel-aurora",
    storageBucket: "panel-aurora.appspot.com",
    messagingSenderId: "479594137457",
    appId: "1:479594137457:web:f3bae0817900e3126218d0"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', function() {

    const bodyClass = document.body.className;
    let currentUserProfile = null; // Store user role

    // Helper: Fade in observer
    function observeFadeInElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }
    observeFadeInElements();

    window.scrollCarousel = function(trackId, direction) {
        const track = document.getElementById(trackId);
        if (track) {
            const scrollAmount = track.clientWidth * 0.8;
            track.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
        }
    };

    // =========================================================================
    //  GLOBAL AUTH LISTENER
    // =========================================================================
    auth.onAuthStateChanged(async user => {
        if (user) {
            // Fetch User Profile
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserProfile = userDoc.data();
            } else {
                currentUserProfile = { role: 'regular' }; // Default fallback
            }

            // Route-specific logic on login
            if (bodyClass.includes('login-page')) {
                document.getElementById('auth-forms').style.display = 'block';
                document.getElementById('login-form-container').style.display = 'none';
                document.getElementById('register-form-container').style.display = 'none';
                document.getElementById('logged-in-container').style.display = 'block';
                document.getElementById('current-user-email').textContent = user.email;
            }
            if (bodyClass.includes('print-requests-page')) {
                document.getElementById('auth-warning').style.display = 'none';
                if (currentUserProfile.role === 'pending') {
                    document.getElementById('requests-content').innerHTML = '<div class="glass-panel" style="text-align:center;"><h2>Account Pending Approval</h2><p>An admin must approve your account before you can submit 3D print requests.</p></div>';
                    document.getElementById('requests-content').style.display = 'block';
                } else {
                    document.getElementById('requests-content').style.display = 'block';
                    loadUserPrintRequests(user.uid);
                }
            }
            if (bodyClass.includes('admin-page')) {
                if (currentUserProfile.role === 'admin') {
                    document.getElementById('auth-section').style.display = 'none';
                    document.getElementById('admin-dashboard-container').style.display = 'flex';
                    document.getElementById('user-email').textContent = user.email;
                    initAdminPanel();
                } else {
                    alert('Access Denied: You are not an admin.');
                    auth.signOut();
                    window.location.href = 'index.html';
                }
            }
        } else {
            currentUserProfile = null;
            // Route-specific logic on logout
            if (bodyClass.includes('login-page')) {
                document.getElementById('login-form-container').style.display = 'block';
                document.getElementById('register-form-container').style.display = 'none';
                document.getElementById('logged-in-container').style.display = 'none';
            }
            if (bodyClass.includes('print-requests-page')) {
                document.getElementById('auth-warning').style.display = 'block';
                document.getElementById('requests-content').style.display = 'none';
            }
            if (bodyClass.includes('admin-page')) {
                document.getElementById('auth-section').style.display = 'block';
                document.getElementById('admin-dashboard-container').style.display = 'none';
            }
        }
    });

    // =========================================================================
    //  LOGIN PAGE
    // =========================================================================
    if (bodyClass.includes('login-page')) {
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form-container').style.display = 'none';
            document.getElementById('register-form-container').style.display = 'block';
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form-container').style.display = 'block';
            document.getElementById('register-form-container').style.display = 'none';
        });

        // Register
        document.getElementById('user-register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            try {
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                // Create user profile
                await db.collection('users').doc(cred.user.uid).set({
                    email: email,
                    role: 'pending' // Default
                });
                alert('Account created successfully!');
            } catch (error) {
                alert('Registration Error: ' + error.message);
            }
        });

        // Login
        document.getElementById('user-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                alert('Login Error: ' + error.message);
            }
        });

        // Logout
        document.getElementById('user-logout-btn').addEventListener('click', () => {
            auth.signOut();
        });
    }

    // =========================================================================
    //  INDEX PAGE (Dynamic Projects)
    // =========================================================================
    if (bodyClass.includes('index-page')) {
        const cosplayContainer = document.getElementById('cosplay-track');
        const workshopContainer = document.getElementById('workshop-track');

        // Clear existing hardcoded ones if any
        if (cosplayContainer) cosplayContainer.innerHTML = '';
        if (workshopContainer) workshopContainer.innerHTML = '';

        db.collection('projects').get().then(snapshot => {
            let projects = [];
            snapshot.forEach(doc => projects.push({id: doc.id, ...doc.data()}));
            
            // Sort: promoted first, then by timestamp (newest first)
            projects.sort((a,b) => {
                if (a.promoted && !b.promoted) return -1;
                if (!a.promoted && b.promoted) return 1;
                const ta = a.timestamp ? a.timestamp.seconds : 0;
                const tb = b.timestamp ? b.timestamp.seconds : 0;
                return tb - ta;
            });

            projects.forEach(p => {
                const docId = p.id;
                const cardHtml = `
                    <a href="project.html?id=${docId}">
                        <div class="project-card fade-in">
                            <h3>${p.name} ${p.promoted ? '<i class="fas fa-star" style="color:var(--accent-helldiver); font-size:1rem;"></i>' : ''}</h3>
                            <p>${p.description}</p>
                            <div class="progress-bar" id="progress-${docId}"><div class="progress-fill" style="width: ${p.progress || 0}%"></div></div>
                            <div class="skill-tags">
                                ${(p.tags || []).map(t => `<span>${t}</span>`).join('')}
                            </div>
                        </div>
                    </a>
                `;
                
                if (p.category === 'Cosplay Creations' && cosplayContainer) {
                    cosplayContainer.innerHTML += cardHtml;
                } else if (p.category === 'Workshop Projects' && workshopContainer) {
                    workshopContainer.innerHTML += cardHtml;
                } else if (cosplayContainer) { // Fallback
                    cosplayContainer.innerHTML += cardHtml;
                }
            });
            observeFadeInElements();
        });
    }

    // =========================================================================
    //  PROJECT DETAIL PAGE
    // =========================================================================
    if (bodyClass.includes('project-detail-page')) {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (!projectId) {
            document.getElementById('project-title').textContent = "Project Not Found";
            return;
        }

        // Fetch details
        db.collection('projects').doc(projectId).get().then(doc => {
            if (doc.exists) {
                const p = doc.data();
                document.getElementById('project-title').textContent = p.name;
                document.getElementById('project-description').textContent = p.description;
                document.getElementById('project-tags').innerHTML = (p.tags || []).map(t => `<span>${t}</span>`).join('');
                
                const pb = document.getElementById('project-progress-bar');
                pb.style.display = 'block';
                pb.querySelector('.progress-fill').style.width = `${p.progress || 0}%`;

                // Set dynamic accent class if needed for CSS matching (optional)
                document.body.classList.add(`${projectId}-page`);
            }
        });

        // Fetch logs
        const logContainer = document.getElementById('project-log-container');
        db.collection('project-logs').where('projectId', '==', projectId).get().then(snapshot => {
            logContainer.innerHTML = '';
            if (snapshot.empty) { logContainer.innerHTML = '<p>No logs found.</p>'; return; }
            
            let logs = [];
            snapshot.forEach(doc => logs.push(doc.data()));
            logs.sort((a,b) => (b.date || '') > (a.date || '') ? 1 : -1);

            logs.forEach(log => {
                logContainer.innerHTML += `
                    <div class="log-card fade-in">
                        <h3>${log.title}</h3>
                        <p class="log-card-date">${log.date || ''}</p>
                        <p>${log.content.replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            });
            observeFadeInElements();
        });

        // Fetch Media
        const mediaContainer = document.getElementById('project-media-gallery');
        db.collection('project-media').where('projectId', '==', projectId).get().then(snapshot => {
            mediaContainer.innerHTML = '';
            if (snapshot.empty) { mediaContainer.innerHTML = '<p>No media found.</p>'; return; }
            
            snapshot.forEach(doc => {
                const m = doc.data();
                if (m.type === 'image') {
                    mediaContainer.innerHTML += `<img src="${m.url}" alt="${m.description}">`;
                } else if (m.type === 'video') {
                    mediaContainer.innerHTML += `<video src="${m.url}" controls></video>`;
                }
            });
            observeFadeInElements();
        });
    }

    // =========================================================================
    //  PRINT REQUESTS PAGE
    // =========================================================================
    if (bodyClass.includes('print-requests-page')) {
        document.getElementById('print-request-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const priorityLevel = currentUserProfile.role === 'admin' ? 3 : (currentUserProfile.role === 'partner' ? 2 : 1);

            const requestData = {
                userId: user.uid,
                userEmail: user.email,
                title: document.getElementById('pr-title').value,
                link: document.getElementById('pr-link').value,
                color: document.getElementById('pr-color').value,
                size: document.getElementById('pr-size').value,
                description: document.getElementById('pr-description').value,
                status: 'Pending',
                priority: priorityLevel,
                role: currentUserProfile.role,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('print_requests').add(requestData);
                alert('Request submitted!');
                e.target.reset();
                loadUserPrintRequests(user.uid);
            } catch (err) {
                alert('Error submitting: ' + err.message);
            }
        });
    }

    function loadUserPrintRequests(uid) {
        const list = document.getElementById('user-requests-list');
        db.collection('print_requests').where('userId', '==', uid).get().then(snap => {
            list.innerHTML = '';
            if(snap.empty) { list.innerHTML = '<p>No requests yet.</p>'; return; }
            snap.forEach(doc => {
                const data = doc.data();
                list.innerHTML += `
                    <div class="request-card">
                        <h3 style="margin:0; color:var(--accent-tech)">${data.title}</h3>
                        <p style="margin:0"><a href="${data.link}" target="_blank" style="color:var(--text-color)">View Model</a></p>
                        <p style="margin:0; font-size: 0.9rem">Color: ${data.color} | Size: ${data.size}</p>
                        <p style="margin:0; font-size: 0.9rem; color:var(--text-muted-color)">Status: <strong>${data.status}</strong></p>
                    </div>
                `;
            });
        });
    }


    // =========================================================================
    //  ADMIN PANEL
    // =========================================================================
    function initAdminPanel() {
        // Tab switching
        const tabs = document.querySelectorAll('.admin-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
            });
        });

        document.getElementById('logout-button').addEventListener('click', () => auth.signOut());

        loadAdminProjects();
        loadAdminPrintRequests();
        loadAdminUsers();

        // Project CRUD
        document.getElementById('add-new-project-btn').addEventListener('click', () => {
            document.getElementById('project-form-container').style.display = 'block';
            document.getElementById('project-crud-form').reset();
            document.getElementById('crud-project-id').value = '';
        });
        document.getElementById('cancel-project-btn').addEventListener('click', () => {
            document.getElementById('project-form-container').style.display = 'none';
        });

        document.getElementById('project-crud-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('crud-project-id').value || document.getElementById('crud-project-slug').value.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const data = {
                name: document.getElementById('crud-project-name').value,
                category: document.getElementById('crud-project-category').value,
                description: document.getElementById('crud-project-desc').value,
                tags: document.getElementById('crud-project-tags').value.split(',').map(t=>t.trim()),
                promoted: document.getElementById('crud-project-promoted').checked,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('projects').doc(id).set(data, {merge: true});
            alert('Project Saved!');
            document.getElementById('project-form-container').style.display = 'none';
            loadAdminProjects();
        });
    }

    function loadAdminProjects() {
        const grid = document.getElementById('projects-list-grid');
        if (!grid) return;
        
        db.collection('projects').get().then(snap => {
            grid.innerHTML = '';
            
            // Also populate dropdowns for Logs, Progress
            const selects = ['global-project-select', 'progress-project-id'];
            let options = '<option value="">Select a Project...</option>';
            
            snap.forEach(doc => {
                const p = doc.data();
                options += `<option value="${doc.id}">${p.name}</option>`;
                
                grid.innerHTML += `
                    <div class="log-card" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3 style="margin:0">${p.name}</h3>
                            <p style="margin:0; font-size:0.9rem;">${p.category} | ${doc.id}</p>
                        </div>
                        <button class="secondary-btn edit-proj-btn" data-id="${doc.id}">Edit</button>
                    </div>
                `;
            });

            selects.forEach(selId => {
                const el = document.getElementById(selId);
                if (el) el.innerHTML = options;
            });

            // Attach edit listeners
            document.querySelectorAll('.edit-proj-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const docId = e.target.dataset.id;
                    const doc = await db.collection('projects').doc(docId).get();
                    if(doc.exists) {
                        const p = doc.data();
                        document.getElementById('project-form-container').style.display = 'block';
                        document.getElementById('crud-project-id').value = docId;
                        document.getElementById('crud-project-slug').value = docId;
                        document.getElementById('crud-project-slug').disabled = true; // Can't change ID
                        document.getElementById('crud-project-name').value = p.name;
                        document.getElementById('crud-project-category').value = p.category;
                        document.getElementById('crud-project-desc').value = p.description;
                        document.getElementById('crud-project-tags').value = (p.tags||[]).join(', ');
                        document.getElementById('crud-project-promoted').checked = !!p.promoted;
                    }
                });
            });
        });
    }

    function loadAdminPrintRequests() {
        const grid = document.getElementById('requests-grid');
        if (!grid) return;

        db.collection('print_requests').get().then(snap => {
            grid.innerHTML = '';
            if(snap.empty) { grid.innerHTML = '<p>No pending requests.</p>'; return; }

            let reqs = [];
            snap.forEach(doc => reqs.push({id: doc.id, ...doc.data()}));

            // Sort by priority (descending 3=admin, 2=partner, 1=regular) then timestamp
            reqs.sort((a,b) => {
                if (b.priority !== a.priority) return b.priority - a.priority;
                const ta = a.timestamp ? a.timestamp.seconds : 0;
                const tb = b.timestamp ? b.timestamp.seconds : 0;
                return ta - tb; // Older first
            });

            reqs.forEach(r => {
                const prioClass = r.role === 'admin' ? 'req-priority-admin' : (r.role === 'partner' ? 'req-priority-partner' : 'req-priority-regular');
                grid.innerHTML += `
                    <div class="request-card ${prioClass}">
                        <div style="display:flex; justify-content:space-between;">
                            <h3 style="margin:0">${r.title}</h3>
                            <span style="font-size:0.8rem; opacity:0.7">Role: ${r.role}</span>
                        </div>
                        <p style="margin:0; font-size:0.9rem">User: ${r.userEmail}</p>
                        <p style="margin:0; font-size:0.9rem"><a href="${r.link}" target="_blank" style="color:var(--accent-tech)">Model Link</a> | Color: ${r.color} | Size: ${r.size}</p>
                        <p style="margin:0; font-size:0.9rem; background:rgba(0,0,0,0.5); padding:10px; border-radius:10px;">${r.description}</p>
                        
                        <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                            <select class="status-select" data-id="${r.id}" style="width:auto; margin:0">
                                <option value="Pending" ${r.status==='Pending'?'selected':''}>Pending</option>
                                <option value="Printing" ${r.status==='Printing'?'selected':''}>Printing</option>
                                <option value="Done" ${r.status==='Done'?'selected':''}>Done</option>
                            </select>
                        </div>
                    </div>
                `;
            });

            document.querySelectorAll('.status-select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    const newStatus = e.target.value;
                    db.collection('print_requests').doc(e.target.dataset.id).update({status: newStatus});
                });
            });
        });
    }

    function loadAdminUsers() {
        const grid = document.getElementById('users-list-grid');
        if (!grid) return;

        db.collection('users').get().then(snap => {
            grid.innerHTML = '';
            if(snap.empty) { grid.innerHTML = '<p>No users found.</p>'; return; }

            snap.forEach(doc => {
                const u = doc.data();
                const isPending = u.role === 'pending';
                grid.innerHTML += `
                    <div class="request-card ${isPending ? 'req-priority-admin' : ''}">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h3 style="margin:0">${u.email}</h3>
                                <p style="margin:0; font-size:0.9rem; color:var(--text-muted-color)">Current Role: <strong>${u.role}</strong></p>
                            </div>
                            <select class="user-role-select" data-id="${doc.id}" style="width:auto; margin:0">
                                <option value="pending" ${u.role==='pending'?'selected':''}>Pending</option>
                                <option value="regular" ${u.role==='regular'?'selected':''}>Regular</option>
                                <option value="partner" ${u.role==='partner'?'selected':''}>Partner</option>
                                <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                            </select>
                        </div>
                    </div>
                `;
            });

            document.querySelectorAll('.user-role-select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    const newRole = e.target.value;
                    db.collection('users').doc(e.target.dataset.id).update({role: newRole});
                });
            });
        });
    }

    // System Status Update (Footer)
    function updateFooterStatus() {
        const el = document.getElementById('system-status');
        if(!el) return;
        db.collection('system_status').doc('main').get().then(doc => {
            if(doc.exists) {
                const d = doc.data();
                el.textContent = d.customMessage || (d.level === 'optimal' ? 'all systems online.' : 'systems need attention.');
            }
        });
    }
    updateFooterStatus();

    // Footer year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

});
