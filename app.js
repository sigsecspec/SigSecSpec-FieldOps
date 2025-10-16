// Field Officer App - Main Application Logic
class FieldOfficerApp {
    constructor() {
        this.currentMission = null;
        this.currentMissionType = null;
        this.patrolStops = [];
        this.incidents = [];
        this.missionLogs = [];
        this.isOnSite = false;
        this.currentLocation = null;
        
        this.initializeApp();
        this.loadData();
        this.setupEventListeners();
        this.updateTime();
    }

    initializeApp() {
        // Check if profile exists, if not show profile modal
        const profile = this.getProfile();
        if (!profile.name) {
            this.showModal('profile-modal');
        } else {
            this.updateProfileDisplay();
        }
    }

    loadData() {
        // Load data from localStorage
        const savedMissionLogs = localStorage.getItem('missionLogs');
        if (savedMissionLogs) {
            this.missionLogs = JSON.parse(savedMissionLogs);
        }

        const savedCurrentMission = localStorage.getItem('currentMission');
        if (savedCurrentMission) {
            this.currentMission = JSON.parse(savedCurrentMission);
            this.resumeMission();
        }
    }

    saveData() {
        localStorage.setItem('missionLogs', JSON.stringify(this.missionLogs));
        if (this.currentMission) {
            localStorage.setItem('currentMission', JSON.stringify(this.currentMission));
        } else {
            localStorage.removeItem('currentMission');
        }
    }

    getProfile() {
        const profile = localStorage.getItem('officerProfile');
        return profile ? JSON.parse(profile) : {};
    }

    saveProfile(profileData) {
        localStorage.setItem('officerProfile', JSON.stringify(profileData));
    }

    updateProfileDisplay() {
        const profile = this.getProfile();
        document.getElementById('guard-name').textContent = profile.name || 'Officer Name';
    }

    setupEventListeners() {
        // Profile management
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            this.showProfileModal();
        });

        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileData();
        });

        document.getElementById('cancel-profile').addEventListener('click', () => {
            this.hideModal('profile-modal');
        });

        // Mission selection
        document.querySelectorAll('.mission-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const missionType = card.dataset.mission;
                this.selectMissionType(missionType);
            });
        });

        // View logs
        document.getElementById('view-logs-btn').addEventListener('click', () => {
            this.showMissionLogs();
        });

        // Patrol mission controls
        document.getElementById('start-mission-btn').addEventListener('click', () => {
            this.showMissionStartModal();
        });

        document.getElementById('end-mission-btn').addEventListener('click', () => {
            this.endMission();
        });

        document.getElementById('mission-report-btn').addEventListener('click', () => {
            this.generateMissionReport();
        });

        document.getElementById('on-site-btn').addEventListener('click', () => {
            this.goOnSite();
        });

        document.getElementById('off-site-btn').addEventListener('click', () => {
            this.goOffSite();
        });

        document.getElementById('incident-report-btn').addEventListener('click', () => {
            this.showIncidentModal();
        });

        // Standing mission controls
        document.getElementById('start-standing-btn').addEventListener('click', () => {
            this.startStandingMission();
        });

        document.getElementById('end-standing-btn').addEventListener('click', () => {
            this.endStandingMission();
        });

        document.getElementById('standing-incident-btn').addEventListener('click', () => {
            this.showIncidentModal();
        });

        document.getElementById('standing-report-btn').addEventListener('click', () => {
            this.generateStandingReport();
        });

        // Desk mission controls
        document.getElementById('start-desk-btn').addEventListener('click', () => {
            this.startDeskMission();
        });

        document.getElementById('end-desk-btn').addEventListener('click', () => {
            this.endDeskMission();
        });

        document.getElementById('desk-incident-btn').addEventListener('click', () => {
            this.showIncidentModal();
        });

        document.getElementById('desk-report-btn').addEventListener('click', () => {
            this.generateDeskReport();
        });

        // Mission start modal
        document.getElementById('mission-start-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startPatrolMission();
        });

        document.getElementById('cancel-mission-start').addEventListener('click', () => {
            this.hideModal('mission-start-modal');
        });

        // Location modal
        document.getElementById('location-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitLocation();
        });

        document.getElementById('cancel-location').addEventListener('click', () => {
            this.hideModal('location-modal');
        });

        // Incident modal
        document.getElementById('incident-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIncident();
        });

        document.getElementById('cancel-incident').addEventListener('click', () => {
            this.hideModal('incident-modal');
        });

        // Report modal
        document.getElementById('copy-report-btn').addEventListener('click', () => {
            this.copyReport();
        });

        document.getElementById('save-report-btn').addEventListener('click', () => {
            this.saveReport();
        });

        document.getElementById('close-report-btn').addEventListener('click', () => {
            this.hideModal('mission-report-modal');
        });

        // Early end modal
        document.getElementById('early-end-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmEarlyEnd();
        });

        document.getElementById('cancel-early-end').addEventListener('click', () => {
            this.hideModal('early-end-modal');
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showProfileModal() {
        const profile = this.getProfile();
        document.getElementById('officer-name').value = profile.name || '';
        document.getElementById('badge-number').value = profile.badgeNumber || '';
        document.getElementById('department').value = profile.department || '';
        document.getElementById('supervisor').value = profile.supervisor || '';
        this.showModal('profile-modal');
    }

    saveProfileData() {
        const profileData = {
            name: document.getElementById('officer-name').value,
            badgeNumber: document.getElementById('badge-number').value,
            department: document.getElementById('department').value,
            supervisor: document.getElementById('supervisor').value
        };
        
        this.saveProfile(profileData);
        this.updateProfileDisplay();
        this.hideModal('profile-modal');
    }

    selectMissionType(type) {
        this.currentMissionType = type;
        
        // Hide mission selection
        document.getElementById('mission-selection').classList.add('hidden');
        
        // Show appropriate dashboard
        document.getElementById(`${type}-dashboard`).classList.remove('hidden');
        
        if (type === 'patrol') {
            this.initializePatrolDashboard();
        }
    }

    initializePatrolDashboard() {
        this.updatePatrolStatus();
    }

    showMissionStartModal() {
        // Set default times
        const now = new Date();
        const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        
        document.getElementById('start-time').value = this.formatDateTimeLocal(now);
        document.getElementById('end-time').value = this.formatDateTimeLocal(endTime);
        
        this.showModal('mission-start-modal');
    }

    startPatrolMission() {
        const profile = this.getProfile();
        const missionData = {
            id: Date.now(),
            type: 'patrol',
            name: document.getElementById('mission-name').value,
            startTime: new Date(document.getElementById('start-time').value),
            expectedEndTime: new Date(document.getElementById('end-time').value),
            plannedStops: document.getElementById('patrol-stops').value,
            details: document.getElementById('mission-details').value,
            officer: profile,
            patrolStops: [],
            incidents: [],
            status: 'active',
            actualStartTime: new Date()
        };

        this.currentMission = missionData;
        this.patrolStops = [];
        this.incidents = [];
        
        this.updatePatrolStatus();
        this.addPatrolLogEntry(`Mission started: ${missionData.name}`, 'mission-start');
        
        this.hideModal('mission-start-modal');
        this.saveData();
    }

    updatePatrolStatus() {
        const statusElement = document.getElementById('mission-status');
        const controlsElement = document.getElementById('patrol-controls');
        
        if (this.currentMission && this.currentMission.status === 'active') {
            statusElement.textContent = `Mission Active: ${this.currentMission.name}`;
            statusElement.parentElement.classList.add('active');
            
            document.getElementById('start-mission-btn').classList.add('hidden');
            document.getElementById('end-mission-btn').classList.remove('hidden');
            document.getElementById('mission-report-btn').classList.remove('hidden');
            controlsElement.classList.remove('hidden');
            
            this.updateActivityStatus();
        } else {
            statusElement.textContent = 'Mission Not Started';
            statusElement.parentElement.classList.remove('active');
        }
    }

    updateActivityStatus() {
        const activityElement = document.getElementById('activity-status');
        
        if (this.isOnSite && this.currentLocation) {
            activityElement.textContent = `On-site at: ${this.currentLocation.name}`;
            activityElement.className = 'status-active';
        } else if (this.currentMission) {
            activityElement.textContent = 'In transit';
            activityElement.className = 'status-warning';
        } else {
            activityElement.textContent = 'No active patrol';
            activityElement.className = 'status-inactive';
        }
    }

    goOnSite() {
        if (!this.currentMission || this.currentMission.status !== 'active') {
            alert('Please start a mission first');
            return;
        }
        
        document.getElementById('location-modal-title').textContent = 'Go On-Site';
        document.getElementById('location-submit').textContent = 'Go On-Site';
        document.getElementById('location-name').value = '';
        document.getElementById('location-details').value = '';
        document.getElementById('checkpoint-name').value = '';
        document.getElementById('checkpoint-details').value = '';
        
        this.showModal('location-modal');
    }

    goOffSite() {
        if (!this.isOnSite) {
            alert('You are not currently on-site');
            return;
        }
        
        // Log leaving the site
        this.addPatrolLogEntry(`Left site: ${this.currentLocation.name}`, 'site-leave');
        
        // Add patrol stop to mission
        const patrolStop = {
            ...this.currentLocation,
            endTime: new Date(),
            duration: new Date() - this.currentLocation.startTime
        };
        
        this.currentMission.patrolStops.push(patrolStop);
        
        this.isOnSite = false;
        this.currentLocation = null;
        
        document.getElementById('on-site-btn').classList.remove('hidden');
        document.getElementById('off-site-btn').classList.add('hidden');
        
        this.updateActivityStatus();
        this.saveData();
    }

    submitLocation() {
        const locationData = {
            name: document.getElementById('location-name').value,
            details: document.getElementById('location-details').value,
            checkpoint: document.getElementById('checkpoint-name').value,
            checkpointDetails: document.getElementById('checkpoint-details').value,
            startTime: new Date()
        };

        this.currentLocation = locationData;
        this.isOnSite = true;
        
        this.addPatrolLogEntry(`Arrived at: ${locationData.name}`, 'site-arrival');
        
        if (locationData.checkpoint) {
            this.addPatrolLogEntry(`Checkpoint: ${locationData.checkpoint} - ${locationData.checkpointDetails}`, 'checkpoint');
        }
        
        document.getElementById('on-site-btn').classList.add('hidden');
        document.getElementById('off-site-btn').classList.remove('hidden');
        
        this.updateActivityStatus();
        this.hideModal('location-modal');
        this.saveData();
    }

    showIncidentModal() {
        // Set current time
        document.getElementById('incident-time').value = this.formatDateTimeLocal(new Date());
        
        // Set current location if on-site
        if (this.isOnSite && this.currentLocation) {
            document.getElementById('incident-location').value = this.currentLocation.name;
        } else {
            document.getElementById('incident-location').value = '';
        }
        
        // Clear form
        document.getElementById('incident-type').value = '';
        document.getElementById('incident-description').value = '';
        document.getElementById('incident-action').value = '';
        
        this.showModal('incident-modal');
    }

    submitIncident() {
        const incidentData = {
            id: Date.now(),
            type: document.getElementById('incident-type').value,
            location: document.getElementById('incident-location').value,
            time: new Date(document.getElementById('incident-time').value),
            description: document.getElementById('incident-description').value,
            action: document.getElementById('incident-action').value,
            reportedBy: this.getProfile(),
            missionId: this.currentMission ? this.currentMission.id : null
        };

        this.incidents.push(incidentData);
        
        if (this.currentMission) {
            this.currentMission.incidents.push(incidentData);
        }
        
        this.addPatrolLogEntry(`Incident reported: ${incidentData.type} at ${incidentData.location}`, 'incident');
        
        this.hideModal('incident-modal');
        this.saveData();
    }

    addPatrolLogEntry(content, type = 'general') {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(contentDiv);
        
        document.getElementById('patrol-entries').appendChild(logEntry);
    }

    endMission() {
        if (!this.currentMission) return;
        
        const now = new Date();
        const expectedEnd = new Date(this.currentMission.expectedEndTime);
        const timeDiff = expectedEnd - now;
        
        // Check if ending 15+ minutes early
        if (timeDiff > 15 * 60 * 1000) {
            this.showModal('early-end-modal');
            return;
        }
        
        this.completeMission();
    }

    confirmEarlyEnd() {
        const reason = document.getElementById('early-reason').value;
        const replacement = document.getElementById('replacement-info').value;
        
        this.currentMission.earlyEnd = {
            reason: reason,
            replacement: replacement,
            actualEndTime: new Date()
        };
        
        this.hideModal('early-end-modal');
        this.completeMission();
    }

    completeMission() {
        if (this.isOnSite) {
            this.goOffSite();
        }
        
        this.currentMission.status = 'completed';
        this.currentMission.actualEndTime = new Date();
        
        // Save to mission logs
        this.missionLogs.push(this.currentMission);
        
        this.addPatrolLogEntry('Mission completed', 'mission-end');
        
        // Reset state
        this.currentMission = null;
        this.patrolStops = [];
        this.incidents = [];
        this.isOnSite = false;
        this.currentLocation = null;
        
        // Update UI
        this.updatePatrolStatus();
        
        // Show mission selection again
        document.getElementById('patrol-dashboard').classList.add('hidden');
        document.getElementById('mission-selection').classList.remove('hidden');
        
        this.saveData();
        
        alert('Mission completed successfully!');
    }

    generateMissionReport() {
        if (!this.currentMission) return;
        
        const profile = this.getProfile();
        const mission = this.currentMission;
        
        let report = `FIELD OFFICER MISSION REPORT\n`;
        report += `=====================================\n\n`;
        report += `Officer: ${profile.name}\n`;
        report += `Badge Number: ${profile.badgeNumber}\n`;
        report += `Department: ${profile.department}\n`;
        report += `Supervisor: ${profile.supervisor}\n\n`;
        
        report += `MISSION DETAILS\n`;
        report += `---------------\n`;
        report += `Mission Name: ${mission.name}\n`;
        report += `Mission Type: ${mission.type.toUpperCase()}\n`;
        report += `Start Time: ${mission.actualStartTime.toLocaleString()}\n`;
        report += `Expected End: ${mission.expectedEndTime.toLocaleString()}\n`;
        
        if (mission.actualEndTime) {
            report += `Actual End: ${mission.actualEndTime.toLocaleString()}\n`;
        }
        
        report += `Status: ${mission.status.toUpperCase()}\n\n`;
        
        if (mission.details) {
            report += `Mission Details: ${mission.details}\n\n`;
        }
        
        if (mission.plannedStops) {
            report += `Planned Stops:\n${mission.plannedStops}\n\n`;
        }
        
        if (mission.patrolStops && mission.patrolStops.length > 0) {
            report += `PATROL STOPS\n`;
            report += `------------\n`;
            mission.patrolStops.forEach((stop, index) => {
                report += `${index + 1}. ${stop.name}\n`;
                report += `   Arrival: ${stop.startTime.toLocaleString()}\n`;
                if (stop.endTime) {
                    report += `   Departure: ${stop.endTime.toLocaleString()}\n`;
                    report += `   Duration: ${Math.round(stop.duration / 60000)} minutes\n`;
                }
                if (stop.details) {
                    report += `   Details: ${stop.details}\n`;
                }
                if (stop.checkpoint) {
                    report += `   Checkpoint: ${stop.checkpoint}\n`;
                    if (stop.checkpointDetails) {
                        report += `   Checkpoint Details: ${stop.checkpointDetails}\n`;
                    }
                }
                report += `\n`;
            });
        }
        
        if (mission.incidents && mission.incidents.length > 0) {
            report += `INCIDENTS\n`;
            report += `---------\n`;
            mission.incidents.forEach((incident, index) => {
                report += `${index + 1}. ${incident.type.toUpperCase()}\n`;
                report += `   Location: ${incident.location}\n`;
                report += `   Time: ${incident.time.toLocaleString()}\n`;
                report += `   Description: ${incident.description}\n`;
                if (incident.action) {
                    report += `   Action Taken: ${incident.action}\n`;
                }
                report += `\n`;
            });
        }
        
        if (mission.earlyEnd) {
            report += `EARLY END DETAILS\n`;
            report += `-----------------\n`;
            report += `Reason: ${mission.earlyEnd.reason}\n`;
            report += `Replacement Info: ${mission.earlyEnd.replacement}\n`;
            report += `End Time: ${mission.earlyEnd.actualEndTime.toLocaleString()}\n\n`;
        }
        
        report += `Report Generated: ${new Date().toLocaleString()}\n`;
        report += `Generated by: Field Officer App v1.0\n`;
        
        document.getElementById('generated-report').textContent = report;
        this.showModal('mission-report-modal');
    }

    copyReport() {
        const reportText = document.getElementById('generated-report').textContent;
        navigator.clipboard.writeText(reportText).then(() => {
            alert('Report copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = reportText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Report copied to clipboard!');
        });
    }

    saveReport() {
        // Save current report to mission logs if not already saved
        if (this.currentMission && !this.missionLogs.find(log => log.id === this.currentMission.id)) {
            const missionCopy = { ...this.currentMission };
            missionCopy.report = document.getElementById('generated-report').textContent;
            this.missionLogs.push(missionCopy);
            this.saveData();
        }
        alert('Report saved successfully!');
    }

    showMissionLogs() {
        // Create a simple mission logs page
        const logsWindow = window.open('', '_blank');
        let logsHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mission Logs</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .log-entry { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                    .log-header { font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
                    .log-details { color: #666; }
                    button { margin: 5px; padding: 8px 15px; cursor: pointer; }
                </style>
            </head>
            <body>
                <h1>Mission Logs</h1>
        `;
        
        if (this.missionLogs.length === 0) {
            logsHtml += '<p>No mission logs found.</p>';
        } else {
            this.missionLogs.forEach((log, index) => {
                logsHtml += `
                    <div class="log-entry">
                        <div class="log-header">
                            ${log.name} (${log.type.toUpperCase()}) - ${log.actualStartTime ? new Date(log.actualStartTime).toLocaleDateString() : 'N/A'}
                        </div>
                        <div class="log-details">
                            Status: ${log.status}<br>
                            Start: ${log.actualStartTime ? new Date(log.actualStartTime).toLocaleString() : 'N/A'}<br>
                            End: ${log.actualEndTime ? new Date(log.actualEndTime).toLocaleString() : 'Ongoing'}<br>
                            Patrol Stops: ${log.patrolStops ? log.patrolStops.length : 0}<br>
                            Incidents: ${log.incidents ? log.incidents.length : 0}
                        </div>
                        <button onclick="viewReport(${index})">View Full Report</button>
                        <button onclick="copyReport(${index})">Copy Report</button>
                    </div>
                `;
            });
        }
        
        logsHtml += `
                <script>
                    const missionLogs = ${JSON.stringify(this.missionLogs)};
                    
                    function viewReport(index) {
                        const log = missionLogs[index];
                        // Generate report for this log
                        alert('Report viewing functionality would be implemented here');
                    }
                    
                    function copyReport(index) {
                        const log = missionLogs[index];
                        // Copy report functionality would be implemented here
                        alert('Report copying functionality would be implemented here');
                    }
                </script>
            </body>
            </html>
        `;
        
        logsWindow.document.write(logsHtml);
        logsWindow.document.close();
    }

    // Standing and Desk mission methods (simplified versions)
    startStandingMission() {
        const profile = this.getProfile();
        this.currentMission = {
            id: Date.now(),
            type: 'standing',
            name: 'Standing Guard Duty',
            startTime: new Date(),
            officer: profile,
            incidents: [],
            status: 'active'
        };
        
        document.getElementById('standing-mission-status').textContent = 'Standing Duty Active';
        document.getElementById('start-standing-btn').classList.add('hidden');
        document.getElementById('end-standing-btn').classList.remove('hidden');
        document.getElementById('standing-report-btn').classList.remove('hidden');
        
        this.addStandingLogEntry('Standing duty started');
        this.saveData();
    }

    endStandingMission() {
        if (this.currentMission) {
            this.currentMission.status = 'completed';
            this.currentMission.endTime = new Date();
            this.missionLogs.push(this.currentMission);
            this.currentMission = null;
        }
        
        document.getElementById('standing-mission-status').textContent = 'Mission Not Started';
        document.getElementById('start-standing-btn').classList.remove('hidden');
        document.getElementById('end-standing-btn').classList.add('hidden');
        document.getElementById('standing-report-btn').classList.add('hidden');
        
        this.addStandingLogEntry('Standing duty ended');
        this.saveData();
        
        // Return to mission selection
        document.getElementById('standing-dashboard').classList.add('hidden');
        document.getElementById('mission-selection').classList.remove('hidden');
    }

    generateStandingReport() {
        // Similar to patrol report but for standing duty
        this.generateMissionReport();
    }

    addStandingLogEntry(content) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(contentDiv);
        
        document.getElementById('standing-entries').appendChild(logEntry);
    }

    startDeskMission() {
        const profile = this.getProfile();
        this.currentMission = {
            id: Date.now(),
            type: 'desk',
            name: 'Desk Duty',
            startTime: new Date(),
            officer: profile,
            incidents: [],
            status: 'active'
        };
        
        document.getElementById('desk-mission-status').textContent = 'Desk Duty Active';
        document.getElementById('start-desk-btn').classList.add('hidden');
        document.getElementById('end-desk-btn').classList.remove('hidden');
        document.getElementById('desk-report-btn').classList.remove('hidden');
        
        this.addDeskLogEntry('Desk duty started');
        this.saveData();
    }

    endDeskMission() {
        if (this.currentMission) {
            this.currentMission.status = 'completed';
            this.currentMission.endTime = new Date();
            this.missionLogs.push(this.currentMission);
            this.currentMission = null;
        }
        
        document.getElementById('desk-mission-status').textContent = 'Mission Not Started';
        document.getElementById('start-desk-btn').classList.remove('hidden');
        document.getElementById('end-desk-btn').classList.add('hidden');
        document.getElementById('desk-report-btn').classList.add('hidden');
        
        this.addDeskLogEntry('Desk duty ended');
        this.saveData();
        
        // Return to mission selection
        document.getElementById('desk-dashboard').classList.add('hidden');
        document.getElementById('mission-selection').classList.remove('hidden');
    }

    generateDeskReport() {
        // Similar to patrol report but for desk duty
        this.generateMissionReport();
    }

    addDeskLogEntry(content) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';
        contentDiv.textContent = content;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(contentDiv);
        
        document.getElementById('desk-entries').appendChild(logEntry);
    }

    resumeMission() {
        if (this.currentMission) {
            this.selectMissionType(this.currentMission.type);
            if (this.currentMission.type === 'patrol') {
                this.updatePatrolStatus();
            }
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString();
        
        document.getElementById('current-time').textContent = timeString;
        document.getElementById('standing-current-time').textContent = timeString;
        document.getElementById('desk-current-time').textContent = timeString;
        
        // Update every second
        setTimeout(() => this.updateTime(), 1000);
    }

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FieldOfficerApp();
});