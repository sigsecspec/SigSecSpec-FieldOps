class FieldOfficerApp {
    constructor() {
        this.currentMission = null;
        this.missionLogs = this.loadMissionLogs();
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
        this.addPoliceTerminalFeatures();
    }
    
    addPoliceTerminalFeatures() {
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
        timestamp.id = 'policeTimestamp';
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
        const timestamp = document.getElementById('policeTimestamp');
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

        // Navigation
        document.getElementById('viewLogsBtn').addEventListener('click', () => {
            this.showMissionLogs();
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    loadMainPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="mission-selection">
                <h2>Select Operation Type</h2>
                <div class="mission-cards">
                    <div class="mission-card" data-mission="standing">
                        <div class="mission-icon">🛡️</div>
                        <h3>Fixed Post</h3>
                        <p>Stationary patrol assignment</p>
                    </div>
                    <div class="mission-card" data-mission="patrol">
                        <div class="mission-icon">🚔</div>
                        <h3>Mobile Patrol</h3>
                        <p>Vehicle patrol with checkpoint stops</p>
                    </div>
                    <div class="mission-card" data-mission="desk">
                        <div class="mission-icon">📋</div>
                        <h3>Desk Duty</h3>
                        <p>Station administrative operations</p>
                    </div>
                </div>
            </div>
        `;
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
                    <button class="nav-btn" onclick="app.loadMainPage()">← Back to Home</button>
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
                    <button class="nav-btn" onclick="app.loadMainPage()">← Back to Home</button>
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

                <div class="patrol-stops">
                    <h3>Incidents</h3>
                    <div id="incidentsList"></div>
                </div>
            </div>
        `;
    }

    showStartMissionModal() {
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
                        <label for="officerName">Officer Name:</label>
                        <input type="text" id="officerName" required>
                    </div>
                    <div class="form-group">
                        <label for="missionStartTime">Start Time:</label>
                        <input type="datetime-local" id="missionStartTime" required>
                    </div>
                    <div class="form-group">
                        <label for="missionEndTime">Expected End Time:</label>
                        <input type="datetime-local" id="missionEndTime" required>
                    </div>
                    ${this.currentMission.type === 'patrol' ? `
                    <div class="form-group">
                        <label for="patrolRoute">Patrol Route/Stops (Optional):</label>
                        <textarea id="patrolRoute" placeholder="List planned patrol stops..."></textarea>
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="missionNotes">Mission Notes:</label>
                        <textarea id="missionNotes" placeholder="Additional mission details..."></textarea>
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
        const startInput = document.getElementById('missionStartTime');
        const endInput = document.getElementById('missionEndTime');
        
        startInput.value = now.toISOString().slice(0, 16);
        
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        endInput.value = endTime.toISOString().slice(0, 16);

        document.getElementById('startMissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startMission();
        });

        modal.style.display = 'block';
    }

    startMission() {
        const form = document.getElementById('startMissionForm');
        const formData = new FormData(form);
        
        this.currentMission.status = 'active';
        this.currentMission.startTime = new Date(formData.get('missionStartTime'));
        this.currentMission.endTime = new Date(formData.get('missionEndTime'));
        this.currentMission.details = {
            officerName: formData.get('officerName'),
            patrolRoute: formData.get('patrolRoute') || '',
            notes: formData.get('missionNotes') || ''
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
        
        this.closeModal();
        this.showNotification('Mission started successfully!');
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
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Go On Site</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="onSiteForm">
                    <div class="form-group">
                        <label for="siteLocation">Location:</label>
                        <input type="text" id="siteLocation" required>
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
                        <label for="incidentTime">Incident Time:</label>
                        <input type="datetime-local" id="incidentTime" required>
                    </div>
                    <div class="form-group">
                        <label for="incidentType">Incident Type:</label>
                        <select id="incidentType" required>
                            <option value="">Select type...</option>
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
                        <input type="text" id="incidentLocation" required>
                    </div>
                    <div class="form-group">
                        <label for="incidentDescription">Description:</label>
                        <textarea id="incidentDescription" required placeholder="Detailed description of the incident..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="incidentAction">Action Taken:</label>
                        <textarea id="incidentAction" placeholder="Describe actions taken to address the incident..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Report</button>
                    </div>
                </form>
            </div>
        `;

        // Set default time
        const now = new Date();
        document.getElementById('incidentTime').value = now.toISOString().slice(0, 16);

        document.getElementById('incidentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncident();
        });

        modal.style.display = 'block';
    }

    addIncident() {
        const form = document.getElementById('incidentForm');
        const formData = new FormData(form);
        
        const incident = {
            time: new Date(formData.get('incidentTime')),
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
        this.showNotification('Incident report added successfully!');
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
            this.showNotification('Mission must be active to create report!', 'error');
            return;
        }

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
                        <label for="reportSummary">Mission Summary:</label>
                        <textarea id="reportSummary" required placeholder="Overall summary of the mission..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reportObservations">Key Observations:</label>
                        <textarea id="reportObservations" placeholder="Important observations during the mission..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reportRecommendations">Recommendations:</label>
                        <textarea id="reportRecommendations" placeholder="Future recommendations or follow-up actions..."></textarea>
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
            this.saveMissionReport();
        });

        modal.style.display = 'block';
    }

    saveMissionReport() {
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
            // If currently on site, force them to leave
            if (this.isOnSite) {
                this.showNotification('Mission report completed. Please leave site to end mission.', 'error');
            }
        }

        this.closeModal();
        this.showNotification('Mission report saved successfully! Cannot visit new sites after report completion.');
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
        
        this.closeModal();
        this.showNotification('Mission completed successfully!');
        
        // Show completion summary
        setTimeout(() => {
            this.showMissionSummary();
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
                    <button type="button" class="btn-secondary" onclick="app.closeModal(); app.loadMainPage();">Return to Home</button>
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
                        <p><strong>Officer:</strong> ${log.details.officerName}</p>
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
Officer: ${mission.details.officerName}
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
        this.currentMission = null;
        this.isOnSite = false;
        this.currentSiteStartTime = null;
        this.currentPatrolStop = null;
        this.missionStartTime = null;
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

    addBeforeUnloadListener() {
        // Save data before page closes/refreshes
        window.addEventListener('beforeunload', (e) => {
            if (this.currentMission && this.currentMission.status === 'active') {
                this.saveCurrentMission();
                console.log('Saved before page unload');
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
const app = new FieldOfficerApp();