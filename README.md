# Field Officer Mission Log App

A comprehensive web application for field officers to log their shift activities during Standing, Patrol, or Desk missions.

## Features

### Mission Types
- **Standing**: Fixed position security duty
- **Patrol**: Mobile security patrol with multiple stops
- **Desk**: Administrative and monitoring duties

### Core Functionality

#### Mission Management
- Start mission with officer details, start/end times, and optional notes
- Mission report required before ending mission
- Early end protection (15-minute warning) with excuse form
- Local storage for all mission logs
- Copy-to-clipboard functionality for reports

#### Patrol-Specific Features
- **On-Site/Off-Site Tracking**: Guards can mark when they arrive at and leave patrol stops
- **Patrol Stops**: Automatically logged with arrival/departure times, location, and details
- **Checkpoints**: Add checkpoint inspections during patrol stops
- **In-Transit Status**: Shows when guard is between sites
- **Mission Report Lock**: Once mission report is completed, cannot visit new sites

#### Incident Reporting
- File incident reports anytime (even outside patrol stops)
- Multiple incident types: Security Breach, Suspicious Activity, Medical Emergency, etc.
- Incidents automatically categorized by patrol stop or general mission

#### Mission Reports
Contains:
- Full mission details (start/end times, duration)
- All patrol stops with timestamps
- Checkpoint details within each patrol stop
- Incident reports (categorized by location)
- Mission summary, observations, and recommendations
- Early end documentation (if applicable)

### Data Management
- All missions saved to browser's local storage
- View all past mission logs
- Copy any report to clipboard for email/reporting
- Mission logs accessible from main page

## How to Use

1. **Open** `index.html` in a web browser
2. **Select** your mission type (Standing, Patrol, or Desk)
3. **Start Mission** by filling in officer details and mission parameters

### For Patrol Missions:
1. Click "Start Mission" and fill in details
2. Click "Go On Site" when arriving at a location
3. While on site:
   - Add checkpoints
   - File incident reports
   - Add updates and notes
4. Click "Leave Site" when departing (logs patrol stop)
5. Repeat steps 2-4 for all patrol stops
6. Click "Mission Report" to complete the mission report (required)
7. Click "End Mission" when shift is complete

### Ending Mission Early:
- If ending >15 minutes early, system requires:
  - Reason for early end
  - Coverage/replacement information
  - Additional documentation in final report

### Viewing Past Missions:
- Click "View Mission Logs" button
- View details of any past mission
- Copy reports to clipboard

## Technical Details
- Pure HTML/CSS/JavaScript (no dependencies)
- Local storage for data persistence
- Responsive design for mobile/tablet use
- No server required - runs entirely in browser

## Files
- `index.html` - Main application page
- `app.js` - Application logic
- `styles.css` - Styling and layout

## Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with localStorage support
