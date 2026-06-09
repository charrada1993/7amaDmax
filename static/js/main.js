document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Real-time Listener ---
    const firebaseConfig = {
        databaseURL: "https://amadmax-72d24-default-rtdb.firebaseio.com"
    };
    
    // Initialize Firebase
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        const historyRef = database.ref('history');

        // Real-time listener for mutation updates
        historyRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert object to array and sort by timestamp
                const records = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
                updateArchivesGrid(records);
            }
        });
    }

    // --- Intro Video Splash Screen ---
    const introOverlay = document.getElementById('intro-overlay');
    const introBootScreen = document.getElementById('intro-boot-screen');
    const introVideoContainer = document.getElementById('intro-video-container');
    const introVideo = document.getElementById('intro-video');
    const bootBtn = document.getElementById('boot-btn');
    const skipIntroBtn = document.getElementById('skip-intro-btn');

    bootBtn.addEventListener('click', () => {
        introBootScreen.classList.add('hidden');
        introVideoContainer.classList.remove('hidden');
        introVideo.play().catch(err => {
            console.error("Playback block:", err);
            finishIntro();
        });
    });

    skipIntroBtn.addEventListener('click', finishIntro);
    introVideo.addEventListener('ended', finishIntro);

    function finishIntro() {
        introVideo.pause();
        introOverlay.classList.add('intro-fade-out');
        setTimeout(() => {
            introOverlay.classList.add('hidden');
        }, 800);
    }

    // --- Starfield Particle System ---
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    const numStars = 200;
    let targetWarpSpeed = 0;
    let currentWarpSpeed = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            alpha: Math.random()
        });
    }

    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        currentWarpSpeed += (targetWarpSpeed - currentWarpSpeed) * 0.05;

        stars.forEach(star => {
            // Move stars slowly downwards (parallax feel)
            const speedMult = 1 + currentWarpSpeed * 60;
            const dy = star.speed * speedMult;
            star.y += dy;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }

            // Draw star (streak line if warping, circle otherwise)
            ctx.beginPath();
            if (currentWarpSpeed > 0.01) {
                ctx.strokeStyle = `rgba(0, 229, 255, ${star.alpha * (0.3 + currentWarpSpeed * 0.7)})`;
                ctx.lineWidth = star.size * (1 + currentWarpSpeed * 0.8);
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(star.x, star.y - dy * 1.5);
                ctx.stroke();
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        requestAnimationFrame(animateStars);
    }
    animateStars();

    // --- Floating Sakasiik Emojis (Bounce Off Edges) ---
    const emojiContainer = document.getElementById('floating-emojis-container');
    const numEmojis = 5;
    const emojis = [];
    const emojiSymbol = '🫏';

    for (let i = 0; i < numEmojis; i++) {
        const el = document.createElement('div');
        el.className = 'floating-siks';
        el.textContent = emojiSymbol;
        emojiContainer.appendChild(el);

        const speedX = (Math.random() - 0.5) * 3;
        const speedY = (Math.random() - 0.5) * 3;
        
        emojis.push({
            element: el,
            x: Math.random() * (window.innerWidth - 50),
            y: Math.random() * (window.innerHeight - 50),
            vx: speedX === 0 ? 1 : speedX,
            vy: speedY === 0 ? 1 : speedY,
            width: 40,
            height: 40
        });
    }

    function updateFloatingEmojis() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        emojis.forEach(emoji => {
            emoji.x += emoji.vx;
            emoji.y += emoji.vy;

            // Bounce off left/right
            if (emoji.x <= 0) {
                emoji.x = 0;
                emoji.vx *= -1;
            } else if (emoji.x + emoji.width >= w) {
                emoji.x = w - emoji.width;
                emoji.vx *= -1;
            }

            // Bounce off top/bottom
            if (emoji.y <= 0) {
                emoji.y = 0;
                emoji.vy *= -1;
            } else if (emoji.y + emoji.height >= h) {
                emoji.y = h - emoji.height;
                emoji.vy *= -1;
            }

            emoji.element.style.left = emoji.x + 'px';
            emoji.element.style.top = emoji.y + 'px';
        });

        requestAnimationFrame(updateFloatingEmojis);
    }
    updateFloatingEmojis();

    // --- 3D Watch Mouse Tracker (Subtle Interactive Tilt) ---
    const watchContainer = document.getElementById('watch-container');
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        watchContainer.style.transform = `rotateX(${25 + yAxis}deg) rotateY(${-15 - xAxis}deg)`;
    });

    // --- Mission of the Day Generator ---
    const missions = [
        "Locate the lost Chankla of Sidi Bou Said to unlock ultimate siks flight.",
        "Buy a baguette from the local Koucha without saying 'Habibi' or paying double.",
        "Escort a herd of stubborn sakasiik through the chaotic streets of Tunis during rush hour.",
        "Defeat the evil Lord 3asbana in a legendary Harissa-eating contest.",
        "Hack the alien mainframe using only a dial-up connection from a Publinet in Sousse.",
        "Find a parking spot in downtown downtown Sfax on a market day without crying.",
        "Negotiate a lower price for a carpet in the Kairouan medina without getting offered tea.",
        "Survive a trip in a Tunisian yellow taxi without the driver talking about politics."
    ];
    const missionText = document.getElementById('mission-text');
    missionText.textContent = missions[Math.floor(Math.random() * missions.length)];

    // --- Fake Power Level Logic ---
    const powerBar = document.getElementById('power-bar');
    const powerText = document.getElementById('power-text');
    const powerStatus = document.getElementById('power-status');
    let powerLevel = 0;

    function simulateCalibration() {
        if (powerLevel < 78) {
            powerLevel += Math.floor(Math.random() * 5) + 1;
            if (powerLevel > 78) powerLevel = 78;
            powerBar.style.width = powerLevel + '%';
            powerText.textContent = powerLevel + '%';
            setTimeout(simulateCalibration, 100);
        } else {
            powerStatus.textContent = "STABLE AT MAXIMUM 7AMARIA CO-EFFICIENT";
        }
    }
    simulateCalibration();

    // --- File input indicator ---
    const fileInput = document.getElementById('image-upload');
    const fileChosen = document.getElementById('file-chosen');
    fileInput.addEventListener('change', function() {
        fileChosen.textContent = this.files[0] ? this.files[0].name : "No file selected habibi";
    });

    // --- Transformation & Form Upload Logic ---
    const uploadForm = document.getElementById('upload-form');
    const uploadPanel = document.getElementById('upload-panel');
    const resultPanel = document.getElementById('result-panel');
    const timerDisplay = document.getElementById('timer-display');
    const flashOverlay = document.getElementById('flash-overlay');
    const transformedPhoto = document.getElementById('transformed-photo');
    const alienNameDisplay = document.getElementById('alien-name-display');
    const userHeroName = document.getElementById('user-hero-name');
    const userHeroBio = document.getElementById('user-hero-bio');
    const activateBtn = document.getElementById('activate-btn');
    const resetBtn = document.getElementById('reset-btn');

    let transformationData = null;
    let isTransforming = false;

    // Helper: trigger form submit from watch click
    activateBtn.addEventListener('click', () => {
        if (isTransforming) return;
        
        // If form is valid, trigger submit, else highlight form
        if (uploadForm.checkValidity()) {
            uploadForm.dispatchEvent(new Event('submit', { cancelable: true }));
        } else {
            // Scroll to form and focus name
            document.getElementById('hero-name').focus();
            alert("Fill in your Superhero details and upload your mug first, habibi! 📸");
        }
    });

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isTransforming) return;

        isTransforming = true;
        activateBtn.disabled = true;
        activateBtn.textContent = "TRANSFORMING...";
        
        const formData = new FormData(uploadForm);

        // Fetch to Flask backend
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Server error'); });
            }
            return response.json();
        })
        .then(data => {
            transformationData = data;
            // Start the dramatic countdown!
            startCountdown();
        })
        .catch(err => {
            isTransforming = false;
            activateBtn.disabled = false;
            activateBtn.textContent = "PRESS TO ACTIVATE";
            alert("Transformation failed! " + err.message);
        });
    });

    function startCountdown() {
        targetWarpSpeed = 1.0;
        watchContainer.classList.add('watch-charging');
        let count = 3;
        timerDisplay.textContent = count;
        timerDisplay.classList.add('countdown-active');
        
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                timerDisplay.textContent = count;
            } else {
                clearInterval(interval);
                timerDisplay.textContent = "SIKS!";
                timerDisplay.classList.remove('countdown-active');
                
                // Execute actual visual transformation
                triggerTransformationVisuals();
            }
        }, 1000);
    }

    function triggerTransformationVisuals() {
        // 1. Shake/Explode Watch Face
        watchContainer.classList.add('watch-explode');

        // 2. Delay slightly, then Screen Flash (0.5s total duration)
        setTimeout(() => {
            flashOverlay.classList.add('flash-active');
            
            // 3. Immediately switch views during the flash peak
            setTimeout(() => {
                // Remove active panels
                uploadPanel.classList.add('hidden');
                resultPanel.classList.remove('hidden');

                // Bind uploaded image (using a timestamp to prevent caching)
                transformedPhoto.src = `/static/uploads/${transformationData.filename}?t=${new Date().getTime()}`;
                
                // Set text info
                alienNameDisplay.textContent = transformationData.alien_name;
                userHeroName.textContent = document.getElementById('hero-name').value;
                userHeroBio.textContent = `"${document.getElementById('hero-bio').value}"`;

                // Overload Power level to 100%+
                powerBar.style.width = '100%';
                powerText.textContent = "OVER 9000!!!";
                powerStatus.textContent = "CRITICAL 7AMARIA MELTDOWN IN PROGRESS!";
                powerStatus.style.color = 'var(--hot-orange)';
                powerStatus.style.textShadow = 'var(--glow-orange)';
            }, 100);

            // Cleanup animation classes
            setTimeout(() => {
                flashOverlay.classList.remove('flash-active');
                watchContainer.classList.remove('watch-explode');
                watchContainer.classList.remove('watch-charging');
                isTransforming = false;
                activateBtn.disabled = false;
                activateBtn.textContent = "PRESS TO ACTIVATE";
                targetWarpSpeed = 0.0;
            }, 600);

        }, 300);
    }

    // Reset Form
    resetBtn.addEventListener('click', () => {
        uploadForm.reset();
        fileChosen.textContent = "No file selected habibi";
        uploadPanel.classList.remove('hidden');
        resultPanel.classList.add('hidden');
        timerDisplay.textContent = "READY";
        
        // Reset power level simulation
        powerLevel = 0;
        powerBar.style.width = '0%';
        powerText.textContent = '0%';
        powerStatus.textContent = "CALIBRATING 7AMARIA ENERGY...";
        powerStatus.style.color = 'var(--neon-green)';
        powerStatus.style.textShadow = 'var(--glow-green)';
        simulateCalibration();
    });

    // --- Secret ASCII Art Siks Modal ---
    const secretScrewBtn = document.getElementById('secret-screw-btn');
    const secretModal = document.getElementById('secret-modal');
    const closeModal = document.getElementById('close-modal');
    const asciiArtDisplay = document.getElementById('ascii-art-display');

    // ASCII art frame array for a dancing/hee-hawing cyber siks
    const siksFrames = [
`
         /\\____/\\
        /  o  o  \\  <-- Cybernetic Ears Active!
       ( ==  Y  ==)
        \\   ___  /
        /  /   \\ \\
        /  /     \\ \\
      _/_ /       \\ _\\_
     /___/         \\___\\
`,
`
         /\\____/\\
       ((  o  o  )) <-- HEE-HAW MOTHERBOARD!
        ( ==  *  ==) 
         \\  ---  /
         /  /   \\ \\
        /  /     \\ \\
       _/_/       \\_\\_
      /___\\       /___\\
`
    ];

    let currentFrame = 0;
    let modalAnimInterval = null;

    secretScrewBtn.addEventListener('click', () => {
        secretModal.classList.remove('hidden');
        currentFrame = 0;
        asciiArtDisplay.textContent = siksFrames[currentFrame];
        
        // Start simple loop animation
        modalAnimInterval = setInterval(() => {
            currentFrame = (currentFrame + 1) % siksFrames.length;
            asciiArtDisplay.textContent = siksFrames[currentFrame];
        }, 400);
    });

    function closeSecretModal() {
        secretModal.classList.add('hidden');
        if (modalAnimInterval) {
            clearInterval(modalAnimInterval);
            modalAnimInterval = null;
        }
    }

    closeModal.addEventListener('click', closeSecretModal);
    
    // Close modal if user clicks outside content box
    secretModal.addEventListener('click', (e) => {
        if (e.target === secretModal) {
            closeSecretModal();
        }
    });

    // --- Mutation Archives Viewer ---
    const viewArchivesBtn = document.getElementById('view-archives-btn');
    const archivesPanel = document.getElementById('archives-panel');
    const closeArchives = document.getElementById('close-archives');
    const archivesGrid = document.getElementById('archives-grid');

    function updateArchivesGrid(data) {
        archivesGrid.innerHTML = '';
        if (!data || data.length === 0) {
            archivesGrid.innerHTML = '<p class="comic-text text-empty">No mutations logged yet. Upload your mug, habibi! 📸</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'archive-card';

            // Ensure safe escaping
            const escapedHero = escapeHTML(item.hero_name);
            const escapedBio = escapeHTML(item.hero_bio);
            const escapedAlien = escapeHTML(item.alien_name);

            const timeString = new Date(item.timestamp * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Use image_url if available, otherwise fallback to local uploads
            const displayImgUrl = item.image_url || `/static/uploads/${item.filename}`;
            
            card.innerHTML = `
                <div class="archive-card-header">
                    <span class="archive-card-status">MUTANT DETECTED</span>
                    <span class="archive-card-date">${timeString}</span>
                </div>
                <div class="archive-img-container">
                    <img class="archive-img" src="${displayImgUrl}" alt="${escapedAlien}">
                    <div class="archive-card-border-outer"></div>
                    <div class="archive-card-scanline"></div>
                </div>
                <div class="archive-card-body">
                    <div class="archive-card-title">${escapedAlien}</div>
                    <div class="archive-card-meta">
                        <span class="meta-label">HERO:</span> 
                        <span class="meta-value">${escapedHero}</span>
                    </div>
                    <div class="archive-card-bio-title">MUTATION READOUT</div>
                    <div class="archive-card-bio">"${escapedBio}"</div>
                </div>
            `;
            archivesGrid.appendChild(card);
        });
    }

    viewArchivesBtn.addEventListener('click', () => {
        archivesPanel.classList.remove('hidden');
        
        // If firebase listener is not active, do a manual fetch
        if (typeof firebase === 'undefined') {
            archivesGrid.innerHTML = '<p class="comic-text text-gold" style="grid-column: 1/-1; text-align: center; font-size: 1.2rem;">📡 Contacting Tunisia Satellite logs...</p>';
            fetch('/history')
                .then(res => res.json())
                .then(data => updateArchivesGrid(data))
                .catch(err => {
                    console.error(err);
                    archivesGrid.innerHTML = `<p class="comic-text text-empty">Failed to scan database: ${err.message}</p>`;
                });
        }
    });

    closeArchives.addEventListener('click', () => {
        archivesPanel.classList.add('hidden');
    });

    archivesPanel.addEventListener('click', (e) => {
        if (e.target === archivesPanel) {
            archivesPanel.classList.add('hidden');
        }
    });

    // Helper: HTML Escaping to prevent injection bugs
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
