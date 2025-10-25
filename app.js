class SecuritySpecialistApp {
    constructor() {
        this.currentMission = null;
        this.missionLogs = this.loadMissionLogs();
        this.sites = this.loadSites();
        this.bolos = this.loadBolos();
        this.currentPatrolStops = [];
        this.currentIncidents = [];
        this.missionStartTime = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.autoSaveInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.restoreCurrentMission();
        if (!this.currentMission) {
            this.loadMainPage();
        }
        this.startAutoSave();
        this.addBeforeUnloadListener();
        this.addNavigationPrevention();
        this.addSecurityTerminalFeatures();
    }

    isMobileDevice() {
        return window.innerWidth <= 1023;
    }
    
    addSecurityTerminalFeatures() {
        // Add timestamp for desktop toughbook style
        if (window.innerWidth >= 1024) {
            this.addTimestamp();
            this.addSystemStatus();
            setInterval(() => this.updateTimestamp(), 1000);
        }
    }
    
    addSystemStatus() {
        const status = document.createElement('div');
        status.id = 'systemStatus';
        status.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: var(--desktop-bg-primary);
            color: var(--desktop-success);
            padding: 5px 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid var(--desktop-border);
            border-radius: 2px;
            z-index: 1000;
            letter-spacing: 1px;
        `;
        status.innerHTML = '● SYSTEM ONLINE | DB CONNECTED';
        document.body.appendChild(status);
    }
    
    addTimestamp() {
        const timestamp = document.createElement('div');
        timestamp.id = 'securityTimestamp';
        timestamp.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--desktop-bg-primary);
            color: var(--desktop-success);
            padding: 5px 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid var(--desktop-border);
            border-radius: 2px;
            z-index: 1000;
            letter-spacing: 1px;
        `;
        document.body.appendChild(timestamp);
        this.updateTimestamp();
    }
    
    updateTimestamp() {
        const timestamp = document.getElementById('securityTimestamp');
        if (timestamp) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            const dateStr = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            timestamp.textContent = `${dateStr} ${timeStr} UTC`;
        }
    }

    bindEvents() {
        // Mission type selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mission-card')) {
                const missionType = e.target.closest('.mission-card').dataset.mission;
                this.startMissionType(missionType);
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    bindDatabaseButtons() {
        // Navigation buttons - only bind if they exist (on main page)
        const viewLogsBtn = document.getElementById('viewLogsBtn');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => {
                this.showMissionLogs();
            });
        }
        
        const siteBtn = document.getElementById('siteManagerBtn');
        if (siteBtn) {
            siteBtn.addEventListener('click', () => {
                this.showSiteManager();
            });
        }
        
        const boloBtn = document.getElementById('boloBtn');
        if (boloBtn) {
            boloBtn.addEventListener('click', () => {
                this.showBoloBoard();
            });
        }
    }

    loadMainPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="main-screen">
                <div class="database-buttons">
                    <button id="viewLogsBtn" class="nav-btn">Database Records</button>
                    <button id="siteManagerBtn" class="nav-btn">Site Manager</button>
                    <button id="boloBtn" class="nav-btn">BOLO Board</button>
                </div>
                
                <div class="mission-selection">
                    <h2>Select Operation Type</h2>
                    <div class="mission-cards">
                        <div class="mission-card" data-mission="standing">
                            <div class="mission-icon">🛡️</div>
                            <h3>Fixed Post</h3>
                            <p>Stationary security assignment</p>
                        </div>
                        <div class="mission-card" data-mission="patrol">
                            <div class="mission-icon">🚗</div>
                            <h3>Mobile Patrol</h3>
                            <p>Vehicle patrol with checkpoint stops</p>
                        </div>
                        <div class="mission-card" data-mission="desk">
                            <div class="mission-icon">📋</div>
                            <h3>Desk Duty</h3>
                            <p>Administrative operations</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Re-bind the database button events since they're now on the main page
        this.bindDatabaseButtons();
    }

    startMissionType(type) {
        this.currentMission = {
            type: type,
            status: 'inactive',
            startTime: null,
            endTime: null,
            details: {},
            patrolStops: [],
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();

        if (type === 'patrol') {
            this.showPatrolDashboard();
        } else {
            this.showGenericDashboard(type);
        }
    }

    showPatrolDashboard() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div class="mission-info">
                        <h2>Mobile Patrol Operation</h2>
                        <div class="mission-status status-inactive" id="missionStatus">Inactive</div>
                    </div>
                    <button class="nav-btn" onclick="app.attemptNavigateHome()">← Back to Home</button>
                </div>

                <div class="dashboard-controls">
                    <button class="control-btn btn-primary" id="startMissionBtn" onclick="app.showStartMissionModal()">
                        Begin Operation
                    </button>
                    <button class="control-btn btn-success" id="onSiteBtn" onclick="app.goOnSite()" disabled>
                        Arrive On Scene
                    </button>
                    <button class="control-btn btn-warning" id="offSiteBtn" onclick="app.goOffSite()" disabled>
                        Clear Scene
                    </button>
                    <button class="control-btn btn-primary" onclick="app.showIncidentModal()">
                        Incident Report
                    </button>
                    <button class="control-btn btn-primary" onclick="app.showCheckpointModal()">
                        Add Checkpoint
                    </button>
                    <button class="control-btn btn-warning" onclick="app.showMissionReportModal()" id="missionReportBtn" disabled>
                        Mission Report
                    </button>
                    <button class="control-btn btn-danger" id="endMissionBtn" onclick="app.endMission()" disabled>
                        End Mission
                    </button>
                </div>

                <div class="command-console">
                    <div class="console-output" id="consoleOutput"></div>
                    <div class="console-input-row">
                        <span class="prompt">app@ops:~$</span>
                        <input id="consoleInput" placeholder="Type a command, e.g., help" />
                    </div>
                </div>

                <div class="patrol-stops">
                    <h3>Patrol Stops</h3>
                    <div id="patrolStopsList"></div>
                </div>

                <div class="patrol-stops">
                    <h3>Incidents</h3>
                    <div id="incidentsList"></div>
                </div>
            </div>
        `;

        this.bindConsole();
    }

    showGenericDashboard(type) {
        const mainContent = document.getElementById('mainContent');
        const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
        
        mainContent.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div class="mission-info">
                        <h2>${typeTitle} Operation</h2>
                        <div class="mission-status status-inactive" id="missionStatus">Inactive</div>
                    </div>
                    <button class="nav-btn" onclick="app.attemptNavigateHome()">← Back to Home</button>
                </div>

                <div class="dashboard-controls">
                    <button class="control-btn btn-primary" id="startMissionBtn" onclick="app.showStartMissionModal()">
                        Start Mission
                    </button>
                    <button class="control-btn btn-primary" onclick="app.showIncidentModal()">
                        Incident Report
                    </button>
                    <button class="control-btn btn-warning" onclick="app.showMissionReportModal()" id="missionReportBtn" disabled>
                        Mission Report
                    </button>
                    <button class="control-btn btn-danger" id="endMissionBtn" onclick="app.endMission()" disabled>
                        End Mission
                    </button>
                </div>

                <div class="command-console">
                    <div class="console-output" id="consoleOutput"></div>
                    <div class="console-input-row">
                        <span class="prompt">app@ops:~$</span>
                        <input id="consoleInput" placeholder="Type a command, e.g., help" />
                    </div>
                </div>

                <div class="patrol-stops">
                    <h3>Incidents</h3>
                    <div id="incidentsList"></div>
                </div>
            </div>
        `;

        this.bindConsole();
    }

    showStartMissionModal() {
        if (this.isMobileDevice()) {
            this.showMobileStartMissionModal();
        } else {
            this.consoleWrite('=== MISSION START CONSOLE ===');
            this.consoleWrite('Starting mission configuration...');
            this.consoleWrite('Use console commands to configure mission:');
            this.consoleWrite('  start [specialist_name] - Quick start with specialist name');
            this.consoleWrite('  start_detailed - Start detailed configuration');
            this.consoleWrite('  cancel - Cancel mission start');
            this.consoleWrite('');
            this.consoleWrite('Current mission type: ' + (this.currentMission?.type || 'Not selected'));
            this.consoleWrite('System status: ' + (this.currentMission?.status || 'Inactive'));
            this.consoleWrite('');
            this.consoleWrite('Type your command below:');
        }
    }

    showMobileStartMissionModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Start Mission</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="startMissionForm">
                    <div class="form-group">
                        <label for="specialistName">Specialist Name:</label>
                        <input type="text" id="specialistName" required placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="missionStartTime">Start Time:</label>
                        <input type="datetime-local" id="missionStartTime" required>
                    </div>
                    <div class="form-group">
                        <label for="missionEndTime">End Time:</label>
                        <input type="datetime-local" id="missionEndTime" required>
                    </div>
                    <div class="form-group">
                        <label for="missionNotes">Mission Notes (optional):</label>
                        <textarea id="missionNotes" placeholder="Any special instructions or notes..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Start Mission</button>
                    </div>
                </form>
            </div>
        `;

        // Set default times
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        document.getElementById('missionStartTime').value = now.toISOString().slice(0, 16);
        document.getElementById('missionEndTime').value = endTime.toISOString().slice(0, 16);

        document.getElementById('startMissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMobileStartMission();
        });

        modal.style.display = 'block';
    }

    processMobileStartMission() {
        const form = document.getElementById('startMissionForm');
        const formData = new FormData(form);
        
        const specialistName = formData.get('specialistName');
        const startTime = new Date(formData.get('missionStartTime'));
        const endTime = new Date(formData.get('missionEndTime'));
        const notes = formData.get('missionNotes') || '';

        this.currentMission.status = 'active';
        this.currentMission.startTime = startTime;
        this.currentMission.endTime = endTime;
        this.currentMission.details = {
            specialistName: specialistName,
            patrolRoute: '',
            notes: notes
        };
        
        this.missionStartTime = startTime;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        
        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }
        
        this.addNavigationWarning();
        this.closeModal();
        this.showNotification('Mission started successfully!');
    }

    startMission() {
        // This method is now called from console commands
        this.consoleWrite('Mission start configuration completed via console.');
    }

    startDetailedMission() {
        this.consoleWrite('=== DETAILED MISSION CONFIGURATION ===');
        this.consoleWrite('Starting step-by-step mission setup...');
        this.consoleWrite('');
        
        // Initialize mission details object
        this.pendingMissionDetails = {
            specialistName: '',
            startTime: new Date(),
            endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
            notes: '',
            currentStep: 'specialist'
        };
        
        this.askNextMissionQuestion();
    }

    askNextMissionQuestion() {
        if (!this.pendingMissionDetails) return;
        
        switch (this.pendingMissionDetails.currentStep) {
            case 'specialist':
                this.consoleWrite('Step 1 of 4: What is your specialist name?');
                this.consoleWrite('Type: specialist [your_name]');
                break;
            case 'start_time':
                this.consoleWrite('Step 2 of 4: Mission start time (optional - press Enter to use current time)');
                this.consoleWrite('Type: start_time [YYYY-MM-DD HH:MM] or press Enter to skip');
                break;
            case 'end_time':
                this.consoleWrite('Step 3 of 4: Mission end time (optional - press Enter for 8 hours from start)');
                this.consoleWrite('Type: end_time [YYYY-MM-DD HH:MM] or press Enter to skip');
                break;
            case 'notes':
                this.consoleWrite('Step 4 of 4: Mission notes (optional - press Enter to skip)');
                this.consoleWrite('Type: notes [your_notes] or press Enter to skip');
                break;
            case 'confirm':
                this.consoleWrite('All details collected. Ready to start mission:');
                this.consoleWrite(`Specialist: ${this.pendingMissionDetails.specialistName}`);
                this.consoleWrite(`Start: ${this.pendingMissionDetails.startTime.toLocaleString()}`);
                this.consoleWrite(`End: ${this.pendingMissionDetails.endTime.toLocaleString()}`);
                this.consoleWrite(`Notes: ${this.pendingMissionDetails.notes || 'None'}`);
                this.consoleWrite('');
                this.consoleWrite('Type: confirm_start to begin mission');
                break;
        }
    }

    confirmStartMission() {
        if (!this.pendingMissionDetails) {
            this.consoleWrite('ERROR: No mission details configured. Use "start_detailed" first.');
            return;
        }

        if (!this.pendingMissionDetails.specialistName) {
            this.consoleWrite('ERROR: Specialist name is required. Use "specialist [name]" first.');
            return;
        }

        this.consoleWrite('=== CONFIRMING MISSION START ===');
        this.consoleWrite(`Specialist: ${this.pendingMissionDetails.specialistName}`);
        this.consoleWrite(`Start Time: ${this.pendingMissionDetails.startTime.toLocaleString()}`);
        this.consoleWrite(`End Time: ${this.pendingMissionDetails.endTime.toLocaleString()}`);
        this.consoleWrite(`Notes: ${this.pendingMissionDetails.notes || 'None'}`);
        this.consoleWrite('');

        // Start the mission
        this.currentMission.status = 'active';
        this.currentMission.startTime = this.pendingMissionDetails.startTime;
        this.currentMission.endTime = this.pendingMissionDetails.endTime;
        this.currentMission.details = {
            specialistName: this.pendingMissionDetails.specialistName,
            patrolRoute: '',
            notes: this.pendingMissionDetails.notes
        };
        
        this.missionStartTime = this.currentMission.startTime;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        
        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }
        
        // Add navigation restriction indicator
        this.addNavigationWarning();
        
        this.consoleWrite('✓ Mission started successfully!');
        this.consoleWrite('✓ Navigation restrictions activated');
        this.consoleWrite('✓ System ready for operations');
        this.consoleWrite('');
        this.consoleWrite('Available commands: onsite, offsite, incident, checkpoint, report, end');
        
        // Clear pending details
        this.pendingMissionDetails = null;
    }

    goOnSite() {
        if (this.currentMission.status !== 'active') {
            this.showNotification('Mission must be started first!', 'error');
            return;
        }

        // Check if mission report has been completed
        if (this.currentMission.report) {
            this.showNotification('Cannot go on site after mission report is completed!', 'error');
            return;
        }

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        // Build saved sites options
        const siteOptions = this.sites.map((s, idx) => `<option value="${idx}">${s.name} — ${s.address || s.details || ''}</option>`).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Go On Site</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="onSiteForm">
                    <div class="form-group">
                        <label for="siteSelect">Select Saved Site:</label>
                        <select id="siteSelect">
                            <option value="">-- Choose from Site Manager --</option>
                            ${siteOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="siteLocation">Location (override or manual):</label>
                        <input type="text" id="siteLocation" required placeholder="Name or address">
                    </div>
                    <div class="form-group">
                        <label for="siteArrivalTime">Arrival Time:</label>
                        <input type="datetime-local" id="siteArrivalTime" required>
                    </div>
                    <div class="form-group">
                        <label for="siteDetails">Site Details:</label>
                        <textarea id="siteDetails" placeholder="Describe the location, conditions, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Go On Site</button>
                    </div>
                </form>
            </div>
        `;

        // Prefill when selecting a saved site
        setTimeout(() => {
            const select = document.getElementById('siteSelect');
            const locInput = document.getElementById('siteLocation');
            const detailsInput = document.getElementById('siteDetails');
            if (select) {
                select.addEventListener('change', () => {
                    const idx = select.value;
                    if (idx !== '') {
                        const site = this.sites[Number(idx)];
                        locInput.value = site.name || site.address || '';
                        detailsInput.value = site.details || site.address || '';
                    }
                });
            }
        }, 0);

        // Set default time
        const now = new Date();
        document.getElementById('siteArrivalTime').value = now.toISOString().slice(0, 16);

        document.getElementById('onSiteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOnSite();
        });

        modal.style.display = 'block';
    }

    processOnSite() {
        const form = document.getElementById('onSiteForm');
        const formData = new FormData(form);
        
        this.isOnSite = true;
        this.currentSiteStartTime = new Date(formData.get('siteArrivalTime'));
        
        this.currentPatrolStop = {
            location: formData.get('siteLocation'),
            arrivalTime: this.currentSiteStartTime,
            departureTime: null,
            details: formData.get('siteDetails'),
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'On Site';
        document.getElementById('missionStatus').className = 'mission-status status-onsite';
        document.getElementById('onSiteBtn').disabled = true;
        document.getElementById('offSiteBtn').disabled = false;
        
        this.closeModal();
        this.showNotification('Now on site at ' + formData.get('siteLocation'));
    }

    goOffSite() {
        if (!this.isOnSite) {
            this.showNotification('Not currently on site!', 'error');
            return;
        }

        const departureTime = new Date();
        this.currentPatrolStop.departureTime = departureTime;
        
        // Add to patrol stops
        this.currentMission.patrolStops.push(this.currentPatrolStop);
        
        this.isOnSite = false;
        this.currentPatrolStop = null;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active (In Transit)';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('onSiteBtn').disabled = false;
        document.getElementById('offSiteBtn').disabled = true;
        
        this.updatePatrolStopsList();
        this.showNotification('Left site - now in transit');
    }

    showIncidentModal() {
        if (this.isMobileDevice()) {
            this.showMobileIncidentModal();
        } else {
            this.consoleWrite('=== INCIDENT REPORT CONSOLE ===');
            this.consoleWrite('Report an incident using console commands:');
            this.consoleWrite('');
            this.consoleWrite('Quick Report:');
            this.consoleWrite('  incident [type] [location] [description]');
            this.consoleWrite('');
            this.consoleWrite('Detailed Report:');
            this.consoleWrite('  incident_detailed - Start detailed incident report');
            this.consoleWrite('');
            this.consoleWrite('Available incident types:');
            this.consoleWrite('  Security Breach, Suspicious Activity, Equipment Issue');
            this.consoleWrite('  Medical Emergency, Fire/Safety, Theft, Vandalism, Other');
            this.consoleWrite('');
            this.consoleWrite('Type your command below:');
        }
    }

    showMobileIncidentModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Incident Report</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="incidentForm">
                    <div class="form-group">
                        <label for="incidentType">Incident Type:</label>
                        <select id="incidentType" required>
                            <option value="">Select incident type...</option>
                            <option value="Security Breach">Security Breach</option>
                            <option value="Suspicious Activity">Suspicious Activity</option>
                            <option value="Equipment Issue">Equipment Issue</option>
                            <option value="Medical Emergency">Medical Emergency</option>
                            <option value="Fire/Safety">Fire/Safety</option>
                            <option value="Theft">Theft</option>
                            <option value="Vandalism">Vandalism</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="incidentLocation">Location:</label>
                        <input type="text" id="incidentLocation" required placeholder="Where did this occur?">
                    </div>
                    <div class="form-group">
                        <label for="incidentDescription">Description:</label>
                        <textarea id="incidentDescription" required placeholder="Describe what happened..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="incidentAction">Action Taken (optional):</label>
                        <textarea id="incidentAction" placeholder="What action was taken?"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Report</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('incidentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMobileIncident();
        });

        modal.style.display = 'block';
    }

    processMobileIncident() {
        const form = document.getElementById('incidentForm');
        const formData = new FormData(form);
        
        const incident = {
            time: new Date(),
            type: formData.get('incidentType'),
            location: formData.get('incidentLocation'),
            description: formData.get('incidentDescription'),
            action: formData.get('incidentAction') || 'None specified'
        };

        // Add to current patrol stop if on site, otherwise to general incidents
        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.incidents.push(incident);
        } else {
            this.currentMission.incidents.push(incident);
        }
        this.saveCurrentMission();

        this.updateIncidentsList();
        this.closeModal();
        this.showNotification('Incident report submitted successfully!');
    }

    addIncident() {
        // This method is now called from console commands
        this.consoleWrite('Incident report completed via console.');
    }

    startDetailedIncident() {
        this.consoleWrite('=== DETAILED INCIDENT REPORT ===');
        this.consoleWrite('Starting step-by-step incident report...');
        this.consoleWrite('');
        
        // Initialize incident details object
        this.pendingIncident = {
            type: '',
            location: '',
            description: '',
            action: 'None specified',
            currentStep: 'type'
        };
        
        this.askNextIncidentQuestion();
    }

    askNextIncidentQuestion() {
        if (!this.pendingIncident) return;
        
        switch (this.pendingIncident.currentStep) {
            case 'type':
                this.consoleWrite('Step 1 of 4: What type of incident is this?');
                this.consoleWrite('Available types: Security Breach, Suspicious Activity, Equipment Issue, Medical Emergency, Fire/Safety, Theft, Vandalism, Other');
                this.consoleWrite('Type: incident_type [type]');
                break;
            case 'location':
                this.consoleWrite('Step 2 of 4: Where did this incident occur?');
                this.consoleWrite('Type: incident_location [location]');
                break;
            case 'description':
                this.consoleWrite('Step 3 of 4: Please describe what happened:');
                this.consoleWrite('Type: incident_desc [description]');
                break;
            case 'action':
                this.consoleWrite('Step 4 of 4: What action was taken? (optional - press Enter to skip)');
                this.consoleWrite('Type: incident_action [action] or press Enter to skip');
                break;
            case 'confirm':
                this.consoleWrite('Incident report ready for submission:');
                this.consoleWrite(`Type: ${this.pendingIncident.type}`);
                this.consoleWrite(`Location: ${this.pendingIncident.location}`);
                this.consoleWrite(`Description: ${this.pendingIncident.description}`);
                this.consoleWrite(`Action: ${this.pendingIncident.action}`);
                this.consoleWrite('');
                this.consoleWrite('Type: confirm_incident to submit report');
                break;
        }
    }

    confirmIncident() {
        if (!this.pendingIncident) {
            this.consoleWrite('ERROR: No incident details configured. Use "incident_detailed" first.');
            return;
        }

        if (!this.pendingIncident.type || !this.pendingIncident.location || !this.pendingIncident.description) {
            this.consoleWrite('ERROR: Type, location, and description are required.');
            this.consoleWrite('Use incident_type, incident_location, and incident_desc commands.');
            return;
        }

        this.consoleWrite('=== CONFIRMING INCIDENT REPORT ===');
        this.consoleWrite(`Type: ${this.pendingIncident.type}`);
        this.consoleWrite(`Location: ${this.pendingIncident.location}`);
        this.consoleWrite(`Description: ${this.pendingIncident.description}`);
        this.consoleWrite(`Action: ${this.pendingIncident.action}`);
        this.consoleWrite('');

        const incident = {
            time: new Date(),
            type: this.pendingIncident.type,
            location: this.pendingIncident.location,
            description: this.pendingIncident.description,
            action: this.pendingIncident.action
        };

        // Add to current patrol stop if on site, otherwise to general incidents
        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.incidents.push(incident);
            this.consoleWrite('✓ Incident added to current patrol stop');
        } else {
            this.currentMission.incidents.push(incident);
            this.consoleWrite('✓ Incident added to general mission incidents');
        }
        this.saveCurrentMission();

        this.updateIncidentsList();
        this.consoleWrite('✓ Incident report submitted successfully!');
        
        // Clear pending incident
        this.pendingIncident = null;
    }

    // =====================
    // Site Manager
    // =====================
    loadSites() {
        try {
            const raw = localStorage.getItem('fieldOfficerSites');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Error loading sites:', e);
            return [];
        }
    }

    saveSites() {
        try {
            localStorage.setItem('fieldOfficerSites', JSON.stringify(this.sites));
        } catch (e) {
            console.error('Error saving sites:', e);
        }
    }

    showSiteManager() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        const rows = this.sites.map((s, i) => `
            <tr>
                <td>${s.name || ''}</td>
                <td>${s.address || ''}</td>
                <td>${s.details || ''}</td>
                <td>
                    <button class="btn-small btn-primary" data-edit="${i}">Edit</button>
                    <button class="btn-small btn-danger" data-del="${i}">Delete</button>
                </td>
            </tr>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Site Manager</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="siteForm" style="margin-bottom: 16px;">
                    <div class="form-group"><label for="siteName">Site Name</label><input id="siteName" required></div>
                    <div class="form-group"><label for="siteAddress">Address</label><input id="siteAddress"></div>
                    <div class="form-group"><label for="siteDesc">Details</label><textarea id="siteDesc"></textarea></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Save Site</button>
                    </div>
                </form>
                <div class="copy-area" style="max-height: 260px;">
                    <table style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;">Name</th>
                                <th style="text-align:left;">Address</th>
                                <th style="text-align:left;">Details</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="sitesTable">${rows || '<tr><td colspan="4">No sites saved.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        // Handlers
        document.getElementById('siteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const site = {
                name: document.getElementById('siteName').value.trim(),
                address: document.getElementById('siteAddress').value.trim(),
                details: document.getElementById('siteDesc').value.trim()
            };
            this.sites.push(site);
            this.saveSites();
            this.showSiteManager();
            this.showNotification('Site saved');
        });

        modal.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-del'));
                this.sites.splice(idx, 1);
                this.saveSites();
                this.showSiteManager();
                this.showNotification('Site deleted');
            });
        });

        modal.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-edit'));
                const s = this.sites[idx];
                document.getElementById('siteName').value = s.name || '';
                document.getElementById('siteAddress').value = s.address || '';
                document.getElementById('siteDesc').value = s.details || '';
                // Replace submit to update instead of add
                const form = document.getElementById('siteForm');
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', (e2) => {
                    e2.preventDefault();
                    this.sites[idx] = {
                        name: document.getElementById('siteName').value.trim(),
                        address: document.getElementById('siteAddress').value.trim(),
                        details: document.getElementById('siteDesc').value.trim()
                    };
                    this.saveSites();
                    this.showSiteManager();
                    this.showNotification('Site updated');
                });
            });
        });
    }

    // =====================
    // BOLO Board (Person of Interest → BOLO)
    // =====================
    loadBolos() {
        try {
            const raw = localStorage.getItem('fieldOfficerBolos');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Error loading BOLOs:', e);
            return [];
        }
    }

    saveBolos() {
        try {
            localStorage.setItem('fieldOfficerBolos', JSON.stringify(this.bolos));
        } catch (e) {
            console.error('Error saving BOLOs:', e);
        }
    }

    showBoloBoard() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');

        const rows = this.bolos.map((b, i) => `
            <tr>
                <td>${b.subject || ''}</td>
                <td>${b.type || ''}</td>
                <td>${b.notes || ''}</td>
                <td>
                    <button class="btn-small btn-primary" data-edit-b="${i}">Edit</button>
                    <button class="btn-small btn-danger" data-del-b="${i}">Delete</button>
                </td>
            </tr>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>BOLO Board</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="boloForm" style="margin-bottom: 16px;">
                    <div class="form-group"><label for="boloSubject">Subject (Name/Plate/Item)</label><input id="boloSubject" required></div>
                    <div class="form-group"><label for="boloType">Type</label>
                        <select id="boloType" required>
                            <option value="Person">Person</option>
                            <option value="Vehicle">Vehicle</option>
                            <option value="Item">Item</option>
                        </select>
                    </div>
                    <div class="form-group"><label for="boloNotes">Notes</label><textarea id="boloNotes"></textarea></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Add BOLO</button>
                    </div>
                </form>
                <div class="copy-area" style="max-height: 260px;">
                    <table style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;">Subject</th>
                                <th style="text-align:left;">Type</th>
                                <th style="text-align:left;">Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="boloTable">${rows || '<tr><td colspan="4">No BOLOs posted.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        document.getElementById('boloForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const bolo = {
                subject: document.getElementById('boloSubject').value.trim(),
                type: document.getElementById('boloType').value,
                notes: document.getElementById('boloNotes').value.trim(),
                createdAt: new Date().toISOString()
            };
            this.bolos.push(bolo);
            this.saveBolos();
            this.showBoloBoard();
            this.showNotification('BOLO added');
        });

        modal.querySelectorAll('[data-del-b]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-del-b'));
                this.bolos.splice(idx, 1);
                this.saveBolos();
                this.showBoloBoard();
                this.showNotification('BOLO removed');
            });
        });

        modal.querySelectorAll('[data-edit-b]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-edit-b'));
                const b = this.bolos[idx];
                document.getElementById('boloSubject').value = b.subject || '';
                document.getElementById('boloType').value = b.type || 'Person';
                document.getElementById('boloNotes').value = b.notes || '';
                const form = document.getElementById('boloForm');
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', (e2) => {
                    e2.preventDefault();
                    this.bolos[idx] = {
                        subject: document.getElementById('boloSubject').value.trim(),
                        type: document.getElementById('boloType').value,
                        notes: document.getElementById('boloNotes').value.trim(),
                        createdAt: b.createdAt
                    };
                    this.saveBolos();
                    this.showBoloBoard();
                    this.showNotification('BOLO updated');
                });
            });
        });
    }

    // =====================
    // Command Console
    // =====================
    bindConsole() {
        const input = document.getElementById('consoleInput');
        if (!input) return;
        
        // Command history
        this.commandHistory = this.commandHistory || [];
        this.historyIndex = -1;
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (cmd) {
                    this.commandHistory.unshift(cmd);
                    if (this.commandHistory.length > 50) this.commandHistory.pop();
                    this.historyIndex = -1;
                    this.handleCommand(cmd);
                }
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    input.value = this.commandHistory[this.historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.commandHistory[this.historyIndex] || '';
                } else if (this.historyIndex === 0) {
                    this.historyIndex = -1;
                    input.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autoComplete(input);
            }
        });
        
        // Seed greeting
        this.consoleWrite('=== SECURITY COMMAND CONSOLE INITIALIZED ===');
        this.consoleWrite('Type "help" for available commands.');
        this.consoleWrite('Use quick commands: start [officer], onsite [location], etc.');
        this.consoleWrite('Use UP/DOWN arrows for command history, TAB for auto-complete.');
    }

    autoComplete(input) {
        const value = input.value.toLowerCase();
        const commands = ['help', 'start', 'onsite', 'offsite', 'incident', 'checkpoint', 'report', 'end', 'sites', 'bolos', 'logs', 'status', 'time', 'clear', 'home'];
        
        const matches = commands.filter(cmd => cmd.startsWith(value));
        if (matches.length === 1) {
            input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
            this.consoleWrite(`Available: ${matches.join(', ')}`);
        }
    }

    consoleWrite(text, type = 'info') {
        const out = document.getElementById('consoleOutput');
        if (!out) return;
        
        const line = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        // Add styling based on type
        line.className = `console-line console-${type}`;
        
        if (text.startsWith('$')) {
            // Command input
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-command">${text}</span>`;
        } else if (text.startsWith('ERROR:')) {
            // Error message
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-error">${text}</span>`;
        } else if (text.startsWith('WARNING:')) {
            // Warning message
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-warning">${text}</span>`;
        } else if (text.startsWith('===')) {
            // System message
            line.innerHTML = `<span class="console-system">${text}</span>`;
        } else {
            // Regular output
            line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> <span class="console-output-text">${text}</span>`;
        }
        
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
    }

    handleCommand(raw) {
        const [cmd, ...args] = raw.split(/\s+/);
        const a = args.join(' ');
        this.consoleWrite(`$ ${raw}`);
        switch ((cmd || '').toLowerCase()) {
            case 'help':
                this.consoleWrite('Available Commands:');
                this.consoleWrite('  start [officer_name] - Start mission');
                this.consoleWrite('  onsite [location] - Go on site');
                this.consoleWrite('  offsite - Leave current site');
                this.consoleWrite('  incident [type] [location] [description] - Quick incident report');
                this.consoleWrite('  checkpoint [name] [status] - Add checkpoint');
                this.consoleWrite('  report [summary] - Mission report');
                this.consoleWrite('  end - End mission');
                this.consoleWrite('  sites - List saved sites');
                this.consoleWrite('  bolos - List active BOLOs');
                this.consoleWrite('  logs - View mission history');
                this.consoleWrite('  status - Show current mission status');
                this.consoleWrite('  time - Show current time');
                this.consoleWrite('  clear - Clear console');
                break;
            case 'start':
                if (args.length > 0) {
                    this.quickStartMission(a);
                } else {
                    this.showStartMissionModal();
                }
                break;
            case 'start_detailed':
                this.startDetailedMission();
                break;
            case 'specialist':
                if (args.length > 0) {
                    this.pendingMissionDetails = this.pendingMissionDetails || {};
                    this.pendingMissionDetails.specialistName = a;
                    this.consoleWrite(`✓ Specialist name set: ${a}`);
                    this.consoleWrite('');
                    this.pendingMissionDetails.currentStep = 'start_time';
                    this.askNextMissionQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide specialist name. Usage: specialist [name]');
                }
                break;
            case 'start_time':
                if (args.length > 0) {
                    const timeStr = a;
                    const startTime = new Date(timeStr);
                    if (isNaN(startTime.getTime())) {
                        this.consoleWrite('ERROR: Invalid date format. Use YYYY-MM-DD HH:MM');
                    } else {
                        this.pendingMissionDetails = this.pendingMissionDetails || {};
                        this.pendingMissionDetails.startTime = startTime;
                        this.consoleWrite(`✓ Start time set: ${startTime.toLocaleString()}`);
                        this.consoleWrite('');
                        this.pendingMissionDetails.currentStep = 'end_time';
                        this.askNextMissionQuestion();
                    }
                } else {
                    // Skip to next step if no time provided
                    this.consoleWrite('✓ Using current time as start time');
                    this.consoleWrite('');
                    this.pendingMissionDetails.currentStep = 'end_time';
                    this.askNextMissionQuestion();
                }
                break;
            case 'end_time':
                if (args.length > 0) {
                    const timeStr = a;
                    const endTime = new Date(timeStr);
                    if (isNaN(endTime.getTime())) {
                        this.consoleWrite('ERROR: Invalid date format. Use YYYY-MM-DD HH:MM');
                    } else {
                        this.pendingMissionDetails = this.pendingMissionDetails || {};
                        this.pendingMissionDetails.endTime = endTime;
                        this.consoleWrite(`✓ End time set: ${endTime.toLocaleString()}`);
                        this.consoleWrite('');
                        this.pendingMissionDetails.currentStep = 'notes';
                        this.askNextMissionQuestion();
                    }
                } else {
                    // Skip to next step if no time provided
                    this.consoleWrite('✓ Using default end time (8 hours from start)');
                    this.consoleWrite('');
                    this.pendingMissionDetails.currentStep = 'notes';
                    this.askNextMissionQuestion();
                }
                break;
            case 'notes':
                if (args.length > 0) {
                    this.pendingMissionDetails = this.pendingMissionDetails || {};
                    this.pendingMissionDetails.notes = a;
                    this.consoleWrite(`✓ Notes set: ${a}`);
                } else {
                    this.consoleWrite('✓ No notes added');
                }
                this.consoleWrite('');
                this.pendingMissionDetails.currentStep = 'confirm';
                this.askNextMissionQuestion();
                break;
            case 'confirm_start':
                this.confirmStartMission();
                break;
            case 'cancel':
                this.pendingMissionDetails = null;
                this.consoleWrite('Mission start cancelled. System remains inactive.');
                break;
            case 'onsite':
                if (args.length > 0) {
                    this.quickGoOnSite(a);
                } else {
                    this.goOnSite();
                    this.consoleWrite('Opening Go On Site form...');
                }
                break;
            case 'offsite':
                this.goOffSite();
                this.consoleWrite('Processing off-site...');
                break;
            case 'incident':
                if (args.length >= 3) {
                    this.quickIncident(args);
                } else {
                    this.showIncidentModal();
                }
                break;
            case 'incident_detailed':
                this.startDetailedIncident();
                break;
            case 'incident_type':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.type = a;
                    this.consoleWrite(`✓ Incident type set: ${a}`);
                    this.consoleWrite('');
                    this.pendingIncident.currentStep = 'location';
                    this.askNextIncidentQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide incident type. Usage: incident_type [type]');
                }
                break;
            case 'incident_location':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.location = a;
                    this.consoleWrite(`✓ Location set: ${a}`);
                    this.consoleWrite('');
                    this.pendingIncident.currentStep = 'description';
                    this.askNextIncidentQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide location. Usage: incident_location [location]');
                }
                break;
            case 'incident_desc':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.description = a;
                    this.consoleWrite(`✓ Description set: ${a}`);
                    this.consoleWrite('');
                    this.pendingIncident.currentStep = 'action';
                    this.askNextIncidentQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide description. Usage: incident_desc [description]');
                }
                break;
            case 'incident_action':
                if (args.length > 0) {
                    this.pendingIncident = this.pendingIncident || {};
                    this.pendingIncident.action = a;
                    this.consoleWrite(`✓ Action set: ${a}`);
                } else {
                    this.consoleWrite('✓ No action specified');
                }
                this.consoleWrite('');
                this.pendingIncident.currentStep = 'confirm';
                this.askNextIncidentQuestion();
                break;
            case 'confirm_incident':
                this.confirmIncident();
                break;
            case 'checkpoint':
                if (args.length >= 2) {
                    this.quickCheckpoint(args);
                } else {
                    this.showCheckpointModal();
                    this.consoleWrite('Opening Add Checkpoint form...');
                }
                break;
            case 'report':
                if (args.length > 0) {
                    this.quickReport(a);
                } else {
                    this.showMissionReportModal();
                }
                break;
            case 'report_detailed':
                this.startDetailedReport();
                break;
            case 'report_summary':
                if (args.length > 0) {
                    this.pendingReport = this.pendingReport || {};
                    this.pendingReport.summary = a;
                    this.consoleWrite(`✓ Summary set: ${a}`);
                    this.consoleWrite('');
                    this.pendingReport.currentStep = 'observations';
                    this.askNextReportQuestion();
                } else {
                    this.consoleWrite('ERROR: Please provide summary. Usage: report_summary [summary]');
                }
                break;
            case 'report_obs':
                if (args.length > 0) {
                    this.pendingReport = this.pendingReport || {};
                    this.pendingReport.observations = a;
                    this.consoleWrite(`✓ Observations set: ${a}`);
                } else {
                    this.consoleWrite('✓ No observations added');
                }
                this.consoleWrite('');
                this.pendingReport.currentStep = 'recommendations';
                this.askNextReportQuestion();
                break;
            case 'report_rec':
                if (args.length > 0) {
                    this.pendingReport = this.pendingReport || {};
                    this.pendingReport.recommendations = a;
                    this.consoleWrite(`✓ Recommendations set: ${a}`);
                } else {
                    this.consoleWrite('✓ No recommendations added');
                }
                this.consoleWrite('');
                this.pendingReport.currentStep = 'confirm';
                this.askNextReportQuestion();
                break;
            case 'confirm_report':
                this.confirmReport();
                break;
            case 'end':
                this.endMission();
                this.consoleWrite('Attempting to end mission...');
                break;
            case 'sites':
                this.listSites();
                break;
            case 'bolos':
                this.listBolos();
                break;
            case 'logs':
                this.showMissionLogs();
                this.consoleWrite('Opening Mission Logs...');
                break;
            case 'status':
                this.showStatus();
                break;
            case 'time':
                this.showTime();
                break;
            case 'clear':
                this.clearConsole();
                break;
            case 'home':
                this.attemptNavigateHome();
                this.consoleWrite('Navigating to home...');
                break;
            default:
                this.consoleWrite(`Unknown command: ${cmd}. Type "help" for available commands.`);
        }
    }

    // =====================
    // Quick Console Commands (No Popups)
    // =====================
    quickStartMission(specialistName) {
        if (this.currentMission && this.currentMission.status === 'active') {
            this.consoleWrite('ERROR: Mission already active. End current mission first.');
            return;
        }
        
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        
        this.currentMission = {
            type: this.currentMission?.type || 'patrol',
            status: 'active',
            startTime: now,
            endTime: endTime,
            details: {
                specialistName: specialistName,
                patrolRoute: '',
                notes: 'Started via console'
            },
            patrolStops: [],
            incidents: [],
            checkpoints: []
        };
        
        this.missionStartTime = now;
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'Active';
        document.getElementById('missionStatus').className = 'mission-status status-active';
        document.getElementById('startMissionBtn').disabled = true;
        document.getElementById('missionReportBtn').disabled = false;
        document.getElementById('endMissionBtn').disabled = false;
        
        if (this.currentMission.type === 'patrol') {
            document.getElementById('onSiteBtn').disabled = false;
        }
        
        this.addNavigationWarning();
        this.consoleWrite(`Mission started for Specialist ${specialistName}`);
        this.consoleWrite(`Expected end time: ${endTime.toLocaleString()}`);
    }

    quickGoOnSite(location) {
        if (this.currentMission?.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be started first!');
            return;
        }

        if (this.currentMission.report) {
            this.consoleWrite('ERROR: Cannot go on site after mission report is completed!');
            return;
        }

        if (this.isOnSite) {
            this.consoleWrite('ERROR: Already on site. Use "offsite" first.');
            return;
        }

        const now = new Date();
        this.isOnSite = true;
        this.currentSiteStartTime = now;
        
        this.currentPatrolStop = {
            location: location,
            arrivalTime: now,
            departureTime: null,
            details: 'Arrived via console',
            incidents: [],
            checkpoints: []
        };
        this.saveCurrentMission();
        
        // Update UI
        document.getElementById('missionStatus').textContent = 'On Site';
        document.getElementById('missionStatus').className = 'mission-status status-onsite';
        document.getElementById('onSiteBtn').disabled = true;
        document.getElementById('offSiteBtn').disabled = false;
        
        this.consoleWrite(`Now on site at: ${location}`);
        this.consoleWrite(`Arrival time: ${now.toLocaleString()}`);
    }

    quickIncident(args) {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to report incidents!');
            return;
        }

        const [type, location, ...descParts] = args;
        const description = descParts.join(' ');
        
        const incident = {
            time: new Date(),
            type: type,
            location: location,
            description: description,
            action: 'Reported via console'
        };

        // Add to current patrol stop if on site, otherwise to general incidents
        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.incidents.push(incident);
        } else {
            this.currentMission.incidents.push(incident);
        }
        this.saveCurrentMission();

        this.updateIncidentsList();
        this.consoleWrite(`Incident reported: ${type} at ${location}`);
        this.consoleWrite(`Description: ${description}`);
    }

    quickCheckpoint(args) {
        if (!this.isOnSite) {
            this.consoleWrite('ERROR: Must be on site to add checkpoint!');
            return;
        }

        const [name, status, ...detailsParts] = args;
        const details = detailsParts.join(' ') || 'Added via console';
        
        const checkpoint = {
            time: new Date(),
            name: name,
            status: status,
            details: details
        };

        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.checkpoints.push(checkpoint);
        } else {
            this.currentMission.checkpoints.push(checkpoint);
        }
        this.saveCurrentMission();

        this.consoleWrite(`Checkpoint added: ${name} - Status: ${status}`);
        if (details) this.consoleWrite(`Details: ${details}`);
    }

    quickReport(summary) {
        if (this.currentMission?.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to create report!');
            return;
        }

        this.currentMission.report = {
            summary: summary,
            observations: 'Completed via console',
            recommendations: '',
            completedAt: new Date()
        };
        this.saveCurrentMission();

        // Disable on-site button after mission report is completed (for patrol missions)
        if (this.currentMission.type === 'patrol') {
            const onSiteBtn = document.getElementById('onSiteBtn');
            if (onSiteBtn) {
                onSiteBtn.disabled = true;
            }
            if (this.isOnSite) {
                this.consoleWrite('WARNING: Mission report completed. Please leave site to end mission.');
            }
        }

        this.consoleWrite('Mission report saved successfully!');
        this.consoleWrite(`Summary: ${summary}`);
    }

    listSites() {
        if (this.sites.length === 0) {
            this.consoleWrite('No saved sites found.');
            return;
        }
        
        this.consoleWrite('Saved Sites:');
        this.sites.forEach((site, idx) => {
            this.consoleWrite(`  ${idx + 1}. ${site.name} - ${site.address || site.details || 'No details'}`);
        });
    }

    listBolos() {
        if (this.bolos.length === 0) {
            this.consoleWrite('No active BOLOs.');
            return;
        }
        
        this.consoleWrite('Active BOLOs:');
        this.bolos.forEach((bolo, idx) => {
            this.consoleWrite(`  ${idx + 1}. ${bolo.type}: ${bolo.subject}`);
            if (bolo.notes) this.consoleWrite(`     Notes: ${bolo.notes}`);
        });
    }

    showStatus() {
        if (!this.currentMission) {
            this.consoleWrite('No active mission.');
            return;
        }
        
        this.consoleWrite('Mission Status:');
        this.consoleWrite(`  Type: ${this.currentMission.type}`);
        this.consoleWrite(`  Status: ${this.currentMission.status}`);
        this.consoleWrite(`  Specialist: ${this.currentMission.details?.specialistName || 'Unknown'}`);
        this.consoleWrite(`  Started: ${this.formatDateTime(this.currentMission.startTime)}`);
        
        if (this.isOnSite && this.currentPatrolStop) {
            this.consoleWrite(`  Current Location: ${this.currentPatrolStop.location}`);
            this.consoleWrite(`  On Site Since: ${this.formatDateTime(this.currentPatrolStop.arrivalTime)}`);
        }
        
        this.consoleWrite(`  Incidents: ${this.currentMission.incidents?.length || 0}`);
        this.consoleWrite(`  Patrol Stops: ${this.currentMission.patrolStops?.length || 0}`);
    }

    showTime() {
        const now = new Date();
        this.consoleWrite(`Current Time: ${now.toLocaleString()}`);
        this.consoleWrite(`UTC: ${now.toISOString()}`);
    }

    clearConsole() {
        const out = document.getElementById('consoleOutput');
        if (out) {
            out.innerHTML = '';
            this.consoleWrite('Console cleared. Type "help" for available commands.');
        }
    }

    showCheckpointModal() {
        if (!this.isOnSite) {
            this.showNotification('Must be on site to add checkpoint!', 'error');
            return;
        }

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Add Checkpoint</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="checkpointForm">
                    <div class="form-group">
                        <label for="checkpointTime">Checkpoint Time:</label>
                        <input type="datetime-local" id="checkpointTime" required>
                    </div>
                    <div class="form-group">
                        <label for="checkpointName">Checkpoint Name:</label>
                        <input type="text" id="checkpointName" required placeholder="e.g., Main Entrance, Parking Lot A">
                    </div>
                    <div class="form-group">
                        <label for="checkpointStatus">Status:</label>
                        <select id="checkpointStatus" required>
                            <option value="Normal">Normal</option>
                            <option value="Attention Required">Attention Required</option>
                            <option value="Issue Found">Issue Found</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="checkpointDetails">Details:</label>
                        <textarea id="checkpointDetails" placeholder="Checkpoint details, observations, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Add Checkpoint</button>
                    </div>
                </form>
            </div>
        `;

        // Set default time
        const now = new Date();
        document.getElementById('checkpointTime').value = now.toISOString().slice(0, 16);

        document.getElementById('checkpointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCheckpoint();
        });

        modal.style.display = 'block';
    }

    addCheckpoint() {
        const form = document.getElementById('checkpointForm');
        const formData = new FormData(form);
        
        const checkpoint = {
            time: new Date(formData.get('checkpointTime')),
            name: formData.get('checkpointName'),
            status: formData.get('checkpointStatus'),
            details: formData.get('checkpointDetails') || ''
        };

        if (this.isOnSite && this.currentPatrolStop) {
            this.currentPatrolStop.checkpoints.push(checkpoint);
        } else {
            this.currentMission.checkpoints.push(checkpoint);
        }
        this.saveCurrentMission();

        this.closeModal();
        this.showNotification('Checkpoint added successfully!');
    }

    showMissionReportModal() {
        if (this.currentMission.status !== 'active') {
            this.consoleWrite('ERROR: Mission must be active to create report!');
            return;
        }

        if (this.isMobileDevice()) {
            this.showMobileMissionReportModal();
        } else {
            this.consoleWrite('=== MISSION REPORT CONSOLE ===');
            this.consoleWrite('Create mission report using console commands:');
            this.consoleWrite('');
            this.consoleWrite('Quick Report:');
            this.consoleWrite('  report [summary] - Quick report with summary only');
            this.consoleWrite('');
            this.consoleWrite('Detailed Report:');
            this.consoleWrite('  report_detailed - Start detailed mission report');
            this.consoleWrite('');
            this.consoleWrite('Type your command below:');
        }
    }

    showMobileMissionReportModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Report</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="missionReportForm">
                    <div class="form-group">
                        <label for="reportSummary">Mission Summary (required):</label>
                        <textarea id="reportSummary" required placeholder="Provide a summary of the mission..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reportObservations">Key Observations (optional):</label>
                        <textarea id="reportObservations" placeholder="Any notable observations during the mission..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reportRecommendations">Recommendations (optional):</label>
                        <textarea id="reportRecommendations" placeholder="Any recommendations for future missions..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Report</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('missionReportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processMobileMissionReport();
        });

        modal.style.display = 'block';
    }

    processMobileMissionReport() {
        const form = document.getElementById('missionReportForm');
        const formData = new FormData(form);
        
        this.currentMission.report = {
            summary: formData.get('reportSummary'),
            observations: formData.get('reportObservations') || '',
            recommendations: formData.get('reportRecommendations') || '',
            completedAt: new Date()
        };
        this.saveCurrentMission();

        // Disable on-site button after mission report is completed (for patrol missions)
        if (this.currentMission.type === 'patrol') {
            const onSiteBtn = document.getElementById('onSiteBtn');
            if (onSiteBtn) {
                onSiteBtn.disabled = true;
            }
        }

        this.closeModal();
        this.showNotification('Mission report saved successfully!');
    }

    saveMissionReport() {
        // This method is now called from console commands
        this.consoleWrite('Mission report completed via console.');
    }

    startDetailedReport() {
        this.consoleWrite('=== DETAILED MISSION REPORT ===');
        this.consoleWrite('Starting step-by-step mission report...');
        this.consoleWrite('');
        
        // Initialize report details object
        this.pendingReport = {
            summary: '',
            observations: '',
            recommendations: '',
            currentStep: 'summary'
        };
        
        this.askNextReportQuestion();
    }

    askNextReportQuestion() {
        if (!this.pendingReport) return;
        
        switch (this.pendingReport.currentStep) {
            case 'summary':
                this.consoleWrite('Step 1 of 3: Please provide a mission summary (required):');
                this.consoleWrite('Type: report_summary [your summary]');
                break;
            case 'observations':
                this.consoleWrite('Step 2 of 3: Key observations during the mission (optional - press Enter to skip):');
                this.consoleWrite('Type: report_obs [observations] or press Enter to skip');
                break;
            case 'recommendations':
                this.consoleWrite('Step 3 of 3: Any recommendations for future missions (optional - press Enter to skip):');
                this.consoleWrite('Type: report_rec [recommendations] or press Enter to skip');
                break;
            case 'confirm':
                this.consoleWrite('Mission report ready for submission:');
                this.consoleWrite(`Summary: ${this.pendingReport.summary}`);
                this.consoleWrite(`Observations: ${this.pendingReport.observations || 'None'}`);
                this.consoleWrite(`Recommendations: ${this.pendingReport.recommendations || 'None'}`);
                this.consoleWrite('');
                this.consoleWrite('Type: confirm_report to save report');
                break;
        }
    }

    confirmReport() {
        if (!this.pendingReport) {
            this.consoleWrite('ERROR: No report details configured. Use "report_detailed" first.');
            return;
        }

        if (!this.pendingReport.summary) {
            this.consoleWrite('ERROR: Summary is required. Use "report_summary [summary]" first.');
            return;
        }

        this.consoleWrite('=== CONFIRMING MISSION REPORT ===');
        this.consoleWrite(`Summary: ${this.pendingReport.summary}`);
        this.consoleWrite(`Observations: ${this.pendingReport.observations || 'None'}`);
        this.consoleWrite(`Recommendations: ${this.pendingReport.recommendations || 'None'}`);
        this.consoleWrite('');

        this.currentMission.report = {
            summary: this.pendingReport.summary,
            observations: this.pendingReport.observations || '',
            recommendations: this.pendingReport.recommendations || '',
            completedAt: new Date()
        };
        this.saveCurrentMission();

        // Disable on-site button after mission report is completed (for patrol missions)
        if (this.currentMission.type === 'patrol') {
            const onSiteBtn = document.getElementById('onSiteBtn');
            if (onSiteBtn) {
                onSiteBtn.disabled = true;
            }
            // If currently on site, force them to leave
            if (this.isOnSite) {
                this.consoleWrite('WARNING: Mission report completed. Please leave site to end mission.');
            }
        }

        this.consoleWrite('✓ Mission report saved successfully!');
        this.consoleWrite('✓ Cannot visit new sites after report completion');
        
        // Clear pending report
        this.pendingReport = null;
    }

    endMission() {
        if (!this.currentMission.report) {
            this.showNotification('Mission report must be completed before ending mission!', 'error');
            return;
        }

        const now = new Date();
        const expectedEndTime = new Date(this.currentMission.endTime);
        const timeDiff = (expectedEndTime - now) / (1000 * 60); // minutes

        if (timeDiff > 15) {
            this.showEarlyEndModal();
            return;
        }

        this.completeMission();
    }

    showEarlyEndModal() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Early Mission End</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Warning:</strong> You are ending the mission more than 15 minutes early.</p>
                <form id="earlyEndForm">
                    <div class="form-group">
                        <label for="earlyEndReason">Reason for Early End:</label>
                        <textarea id="earlyEndReason" required placeholder="Explain why the mission is ending early..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="hasReplacement">Do you have cover/replacement?</label>
                        <select id="hasReplacement" required>
                            <option value="">Select...</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div class="form-group" id="replacementDetails" style="display: none;">
                        <label for="replacementInfo">Replacement Details:</label>
                        <textarea id="replacementInfo" placeholder="Who is covering and when..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-danger">End Mission Early</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('hasReplacement').addEventListener('change', (e) => {
            const replacementDetails = document.getElementById('replacementDetails');
            if (e.target.value === 'yes') {
                replacementDetails.style.display = 'block';
            } else {
                replacementDetails.style.display = 'none';
            }
        });

        document.getElementById('earlyEndForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processEarlyEnd();
        });

        modal.style.display = 'block';
    }

    processEarlyEnd() {
        const form = document.getElementById('earlyEndForm');
        const formData = new FormData(form);
        
        this.currentMission.earlyEnd = {
            reason: formData.get('earlyEndReason'),
            hasReplacement: formData.get('hasReplacement') === 'yes',
            replacementInfo: formData.get('replacementInfo') || ''
        };
        this.saveCurrentMission();

        this.completeMission();
    }

    completeMission() {
        // If currently on site, automatically go off site
        if (this.isOnSite) {
            this.currentPatrolStop.departureTime = new Date();
            this.currentMission.patrolStops.push(this.currentPatrolStop);
            this.isOnSite = false;
        }

        this.currentMission.status = 'completed';
        this.currentMission.actualEndTime = new Date();
        
        // Generate mission ID
        const missionId = 'M' + Date.now();
        this.currentMission.id = missionId;
        
        // Save to mission logs
        this.missionLogs.push({ ...this.currentMission });
        this.saveMissionLogs();
        
        // Clear current mission from storage
        this.clearCurrentMission();
        
        // Remove navigation restriction indicator
        this.removeNavigationWarning();
        
        // Force system to inactive state
        this.currentMission = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.missionStartTime = null;
        
        this.closeModal();
        this.showNotification('Mission completed successfully! System reset to inactive. Navigation restrictions removed.');
        
        // Return to main page to allow new mission start
        setTimeout(() => {
            this.loadMainPage();
        }, 1000);
    }

    showMissionSummary() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        const missionReport = this.generateMissionReport(this.currentMission);
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Completed</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Mission ID:</strong> ${this.currentMission.id}</p>
                <p><strong>Type:</strong> ${this.currentMission.type.charAt(0).toUpperCase() + this.currentMission.type.slice(1)}</p>
                <p><strong>Duration:</strong> ${this.formatDuration(this.currentMission.startTime, this.currentMission.actualEndTime)}</p>
                
                <div class="copy-area" id="missionReportText">${missionReport}</div>
                
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="app.copyToClipboard('missionReportText')">Copy Report</button>
                    <button type="button" class="btn-secondary" onclick="app.closeModal(); app.attemptNavigateHome();">Return to Home</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    showMissionLogs() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        let logsHtml = '';
        
        if (this.missionLogs.length === 0) {
            logsHtml = '<p>No mission logs found.</p>';
        } else {
            this.missionLogs.forEach(log => {
                logsHtml += `
                    <div class="mission-log">
                        <div class="mission-log-header">
                            <div class="mission-log-title">${log.id} - ${log.type.charAt(0).toUpperCase() + log.type.slice(1)} Mission</div>
                            <div class="mission-log-date">${this.formatDate(log.startTime)}</div>
                        </div>
                        <p><strong>Specialist:</strong> ${log.details.specialistName}</p>
                        <p><strong>Duration:</strong> ${this.formatDuration(log.startTime, log.actualEndTime)}</p>
                        <div class="mission-log-actions">
                            <button class="btn-small btn-primary" onclick="app.viewMissionDetails('${log.id}')">View Details</button>
                            <button class="btn-small btn-secondary" onclick="app.copyMissionReport('${log.id}')">Copy Report</button>
                        </div>
                    </div>
                `;
            });
        }
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Logs</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                ${logsHtml}
            </div>
        `;

        modal.style.display = 'block';
    }

    viewMissionDetails(missionId) {
        const mission = this.missionLogs.find(m => m.id === missionId);
        if (!mission) return;

        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        const missionReport = this.generateMissionReport(mission);
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Mission Details - ${mission.id}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="copy-area" id="missionDetailsText">${missionReport}</div>
                
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="app.copyToClipboard('missionDetailsText')">Copy Report</button>
                    <button type="button" class="btn-secondary" onclick="app.showMissionLogs()">← Back to Logs</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    copyMissionReport(missionId) {
        const mission = this.missionLogs.find(m => m.id === missionId);
        if (!mission) return;

        const report = this.generateMissionReport(mission);
        navigator.clipboard.writeText(report).then(() => {
            this.showNotification('Mission report copied to clipboard!');
        });
    }

    generateMissionReport(mission) {
        let report = `FIELD OFFICER MISSION REPORT
========================================

Mission ID: ${mission.id}
Mission Type: ${mission.type.charAt(0).toUpperCase() + mission.type.slice(1)}
Specialist: ${mission.details.specialistName}
Start Time: ${this.formatDateTime(mission.startTime)}
End Time: ${this.formatDateTime(mission.actualEndTime)}
Duration: ${this.formatDuration(mission.startTime, mission.actualEndTime)}

`;

        if (mission.earlyEnd) {
            report += `EARLY END NOTICE:
Reason: ${mission.earlyEnd.reason}
Replacement: ${mission.earlyEnd.hasReplacement ? 'Yes' : 'No'}
${mission.earlyEnd.replacementInfo ? 'Replacement Details: ' + mission.earlyEnd.replacementInfo : ''}

`;
        }

        if (mission.details.patrolRoute) {
            report += `PATROL ROUTE:
${mission.details.patrolRoute}

`;
        }

        if (mission.details.notes) {
            report += `MISSION NOTES:
${mission.details.notes}

`;
        }

        if (mission.patrolStops && mission.patrolStops.length > 0) {
            report += `PATROL STOPS:
`;
            mission.patrolStops.forEach((stop, index) => {
                report += `
${index + 1}. ${stop.location}
   Arrival: ${this.formatDateTime(stop.arrivalTime)}
   Departure: ${this.formatDateTime(stop.departureTime)}
   Duration: ${this.formatDuration(stop.arrivalTime, stop.departureTime)}
   Details: ${stop.details || 'None'}
`;

                if (stop.checkpoints && stop.checkpoints.length > 0) {
                    report += `   Checkpoints:
`;
                    stop.checkpoints.forEach(checkpoint => {
                        report += `   - ${this.formatDateTime(checkpoint.time)}: ${checkpoint.name} (${checkpoint.status})
     ${checkpoint.details || 'No additional details'}
`;
                    });
                }

                if (stop.incidents && stop.incidents.length > 0) {
                    report += `   Incidents:
`;
                    stop.incidents.forEach(incident => {
                        report += `   - ${this.formatDateTime(incident.time)}: ${incident.type} at ${incident.location}
     Description: ${incident.description}
     Action Taken: ${incident.action}
`;
                    });
                }
            });
        }

        if (mission.incidents && mission.incidents.length > 0) {
            report += `
GENERAL INCIDENTS:
`;
            mission.incidents.forEach((incident, index) => {
                report += `
${index + 1}. ${incident.type} - ${this.formatDateTime(incident.time)}
   Location: ${incident.location}
   Description: ${incident.description}
   Action Taken: ${incident.action}
`;
            });
        }

        if (mission.checkpoints && mission.checkpoints.length > 0) {
            report += `
GENERAL CHECKPOINTS:
`;
            mission.checkpoints.forEach((checkpoint, index) => {
                report += `
${index + 1}. ${checkpoint.name} - ${this.formatDateTime(checkpoint.time)}
   Status: ${checkpoint.status}
   Details: ${checkpoint.details || 'None'}
`;
            });
        }

        if (mission.report) {
            report += `
MISSION REPORT:
Summary: ${mission.report.summary}

Key Observations: ${mission.report.observations || 'None'}

Recommendations: ${mission.report.recommendations || 'None'}

Report Completed: ${this.formatDateTime(mission.report.completedAt)}
`;
        }

        report += `
========================================
Report Generated: ${this.formatDateTime(new Date())}`;

        return report;
    }

    updatePatrolStopsList() {
        const list = document.getElementById('patrolStopsList');
        if (!list) return;

        let html = '';
        this.currentMission.patrolStops.forEach((stop, index) => {
            html += `
                <div class="patrol-stop">
                    <div class="patrol-stop-header">
                        <div class="patrol-stop-time">${this.formatDateTime(stop.arrivalTime)} - ${this.formatDateTime(stop.departureTime)}</div>
                        <div class="patrol-stop-location">${stop.location}</div>
                    </div>
                    <p>${stop.details || 'No details'}</p>
                    ${stop.incidents.length > 0 ? `<p><strong>Incidents:</strong> ${stop.incidents.length}</p>` : ''}
                    ${stop.checkpoints.length > 0 ? `<p><strong>Checkpoints:</strong> ${stop.checkpoints.length}</p>` : ''}
                </div>
            `;
        });

        list.innerHTML = html || '<p>No patrol stops recorded yet.</p>';
    }

    updateIncidentsList() {
        const list = document.getElementById('incidentsList');
        if (!list) return;

        let html = '';
        
        // Show general incidents
        this.currentMission.incidents.forEach(incident => {
            html += `
                <div class="patrol-stop">
                    <div class="patrol-stop-header">
                        <div class="patrol-stop-time">${this.formatDateTime(incident.time)}</div>
                        <div class="patrol-stop-location">${incident.location}</div>
                    </div>
                    <p><strong>${incident.type}</strong></p>
                    <p>${incident.description}</p>
                    <p><strong>Action:</strong> ${incident.action}</p>
                </div>
            `;
        });

        list.innerHTML = html || '<p>No incidents recorded yet.</p>';
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Copied to clipboard!');
        });
    }

    closeModal() {
        const modal = document.getElementById('logsModal');
        modal.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    formatDateTime(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    }

    formatDuration(start, end) {
        if (!start || !end) return 'N/A';
        const diff = new Date(end) - new Date(start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    loadMissionLogs() {
        try {
            const saved = localStorage.getItem('fieldOfficerMissionLogs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading mission logs:', e);
            this.showNotification('Error loading mission logs', 'error');
            return [];
        }
    }

    saveMissionLogs() {
        try {
            localStorage.setItem('fieldOfficerMissionLogs', JSON.stringify(this.missionLogs));
            return true;
        } catch (e) {
            console.error('Error saving mission logs:', e);
            if (e.name === 'QuotaExceededError') {
                this.showNotification('Storage full! Please clear old mission logs.', 'error');
                // Try to save to sessionStorage as emergency backup
                try {
                    sessionStorage.setItem('fieldOfficerMissionLogs_backup', JSON.stringify(this.missionLogs));
                    this.showNotification('Emergency backup created in session storage', 'error');
                } catch (e2) {
                    console.error('Emergency backup failed:', e2);
                }
            } else {
                this.showNotification('Error saving mission logs', 'error');
            }
            return false;
        }
    }

    saveCurrentMission() {
        if (this.currentMission) {
            const missionState = {
                currentMission: this.currentMission,
                isOnSite: this.isOnSite,
                currentSiteStartTime: this.currentSiteStartTime,
                currentPatrolStop: this.currentPatrolStop,
                missionStartTime: this.missionStartTime,
                savedAt: new Date().toISOString()
            };
            try {
                localStorage.setItem('fieldOfficerCurrentMission', JSON.stringify(missionState));
                // Also save to sessionStorage as redundant backup
                sessionStorage.setItem('fieldOfficerCurrentMission', JSON.stringify(missionState));
                this.showAutoSaveIndicator();
                return true;
            } catch (e) {
                console.error('Error saving current mission:', e);
                if (e.name === 'QuotaExceededError') {
                    this.showNotification('Storage full! Mission data may not be saved.', 'error');
                    // Try at least sessionStorage
                    try {
                        sessionStorage.setItem('fieldOfficerCurrentMission', JSON.stringify(missionState));
                    } catch (e2) {
                        console.error('sessionStorage also full:', e2);
                    }
                } else {
                    this.showNotification('Error saving mission. Please try again.', 'error');
                }
                return false;
            }
        }
    }

    restoreCurrentMission() {
        let saved = localStorage.getItem('fieldOfficerCurrentMission');
        // Try sessionStorage backup if localStorage fails
        if (!saved) {
            saved = sessionStorage.getItem('fieldOfficerCurrentMission');
            if (saved) {
                console.log('Restored from sessionStorage backup');
            }
        }
        
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.currentMission = state.currentMission;
                this.isOnSite = state.isOnSite;
                this.currentSiteStartTime = state.currentSiteStartTime ? new Date(state.currentSiteStartTime) : null;
                this.currentPatrolStop = state.currentPatrolStop;
                this.missionStartTime = state.missionStartTime ? new Date(state.missionStartTime) : null;
                
                // Convert date strings back to Date objects
                if (this.currentMission.startTime) {
                    this.currentMission.startTime = new Date(this.currentMission.startTime);
                }
                if (this.currentMission.endTime) {
                    this.currentMission.endTime = new Date(this.currentMission.endTime);
                }
                
                // Restore the appropriate dashboard
                if (this.currentMission.type === 'patrol') {
                    this.showPatrolDashboard();
                    this.updatePatrolStopsList();
                } else {
                    this.showGenericDashboard(this.currentMission.type);
                }
                this.updateIncidentsList();
                
                // Restore UI state
                if (this.currentMission.status === 'active') {
                    document.getElementById('missionStatus').textContent = this.isOnSite ? 'On Site' : 'Active';
                    document.getElementById('missionStatus').className = this.isOnSite ? 'mission-status status-onsite' : 'mission-status status-active';
                    document.getElementById('startMissionBtn').disabled = true;
                    document.getElementById('missionReportBtn').disabled = false;
                    document.getElementById('endMissionBtn').disabled = false;
                    
                    if (this.currentMission.type === 'patrol') {
                        document.getElementById('onSiteBtn').disabled = this.isOnSite || !!this.currentMission.report;
                        document.getElementById('offSiteBtn').disabled = !this.isOnSite;
                    }
                    
                    // Restore navigation warning for active missions
                    this.addNavigationWarning();
                }
                
                const savedAt = state.savedAt ? new Date(state.savedAt).toLocaleString() : 'unknown time';
                this.showNotification(`Restored mission from ${savedAt}`, 'success');
            } catch (e) {
                console.error('Error restoring mission:', e);
                this.showNotification('Error restoring mission data', 'error');
                // Don't delete backup data in case of parsing error
                try {
                    localStorage.removeItem('fieldOfficerCurrentMission');
                } catch (e2) {
                    console.error('Error clearing corrupted data:', e2);
                }
            }
        }
    }

    clearCurrentMission() {
        try {
            localStorage.removeItem('fieldOfficerCurrentMission');
            sessionStorage.removeItem('fieldOfficerCurrentMission');
        } catch (e) {
            console.error('Error clearing current mission:', e);
        }
        
        // Remove navigation warning
        this.removeNavigationWarning();
        
        // Force complete reset to inactive state
        this.currentMission = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.missionStartTime = null;
        
        // Clear any auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    showAutoSaveIndicator() {
        // Remove any existing indicator
        const existing = document.querySelector('.autosave-indicator');
        if (existing) {
            existing.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = '✓ Saved';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(indicator);
        
        // Fade in
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 1500);
    }

    startAutoSave() {
        // Auto-save every 30 seconds as a backup
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Auto-save triggered at', new Date().toISOString());
            }
        }, 30000); // 30 seconds
    }

    addNavigationPrevention() {
        // Prevent browser back button during active missions
        window.addEventListener('popstate', (e) => {
            if (this.isMissionActive()) {
                // Push the current state back to prevent navigation
                history.pushState(null, null, window.location.href);
                this.showNavigationBlockedNotification();
            }
        });

        // Push initial state to enable popstate detection
        history.pushState(null, null, window.location.href);
    }

    attemptNavigateHome() {
        if (this.isMissionActive()) {
            this.showNavigationConfirmDialog();
        } else {
            this.loadMainPage();
        }
    }

    isMissionActive() {
        return this.currentMission && this.currentMission.status === 'active';
    }

    showNavigationBlockedNotification() {
        this.showNotification('Navigation blocked: Active mission in progress. Complete or end mission first.', 'error');
    }

    showNavigationConfirmDialog() {
        const modal = document.getElementById('logsModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>⚠️ Active Mission Warning</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🚨</div>
                    <h3 style="color: #ff3333; margin-bottom: 16px;">MISSION IN PROGRESS</h3>
                    <p><strong>You have an active mission that has not been completed.</strong></p>
                    <p>Leaving now may result in data loss and incomplete mission records.</p>
                </div>
                
                <div style="background: rgba(255, 51, 51, 0.1); border: 1px solid #ff3333; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p><strong>Current Mission Status:</strong></p>
                    <p>• Type: ${this.currentMission.type.charAt(0).toUpperCase() + this.currentMission.type.slice(1)}</p>
                    <p>• Status: ${this.currentMission.status}</p>
                    <p>• Started: ${this.formatDateTime(this.currentMission.startTime)}</p>
                    ${this.isOnSite ? '<p>• Currently on site</p>' : ''}
                </div>
                
                <p style="margin-top: 16px;"><strong>Recommended actions:</strong></p>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                    <li>Complete your mission report</li>
                    <li>End the mission properly</li>
                    <li>Ensure all data is saved</li>
                </ul>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Stay on Mission</button>
                    <button type="button" class="btn-danger" onclick="app.forceNavigateHome()">Force Exit (Not Recommended)</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    forceNavigateHome() {
        // Show final warning and save data
        if (this.currentMission && this.currentMission.status === 'active') {
            this.saveCurrentMission();
            this.showNotification('Mission data saved. Please resume mission as soon as possible.', 'warning');
        }
        this.closeModal();
        this.loadMainPage();
    }

    addNavigationWarning() {
        // Remove existing warning if present
        this.removeNavigationWarning();
        
        const warning = document.createElement('div');
        warning.id = 'navigationWarning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff3333;
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            z-index: 10001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease-out;
        `;
        warning.innerHTML = '🚨 MISSION ACTIVE - NAVIGATION RESTRICTED 🚨';
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        
        // Adjust main content to account for warning bar
        document.body.style.paddingTop = '40px';
    }

    removeNavigationWarning() {
        const warning = document.getElementById('navigationWarning');
        if (warning) {
            warning.remove();
        }
        document.body.style.paddingTop = '0';
    }

    addBeforeUnloadListener() {
        // Save data and warn before page closes/refreshes during active missions
        window.addEventListener('beforeunload', (e) => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved before page unload');
                
                // Show browser warning for active missions
                const message = 'You have an active mission in progress. Leaving may result in data loss.';
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        });
        
        // Also listen for visibility change (when app goes to background on mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved on visibility change');
            }
        });
        
        // Listen for page hide event (more reliable on mobile)
        window.addEventListener('pagehide', (e) => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved on page hide');
            }
        });
    }
}

// Initialize the app
const app = new SecuritySpecialistApp();