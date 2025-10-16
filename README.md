# Field Officer Dashboard

A comprehensive web application for field officers to manage their shifts, missions, and reports.

## Features

### Profile Management
- Set up officer profile with name, badge number, department, and supervisor
- Profile information is automatically included in all reports
- Edit profile at any time

### Mission Types
- **Standing Guard**: Fixed position security duty
- **Patrol**: Mobile security patrol with location tracking
- **Desk Duty**: Administrative and monitoring duty

### Patrol Mission Features
- Mission start/stop with detailed planning
- On-site/Off-site tracking with location logging
- Checkpoint recording and status updates
- Real-time activity status monitoring
- Patrol stop logging with timestamps and duration

### Incident Reporting
- File incident reports at any time during missions
- Categorized incident types (Security, Maintenance, Medical, Fire/Safety, etc.)
- Automatic location detection when on-site
- Detailed description and action taken fields

### Mission Reports
- Comprehensive mission reports with all activities
- Copy reports to clipboard for easy sharing
- Include all patrol stops, incidents, and checkpoint data
- Professional formatting for official documentation

### Early Mission End
- Special handling for missions ending 15+ minutes early
- Excuse form with reason and replacement information
- Automatic flagging in mission reports

### Mission Logs
- View all completed missions in a separate page
- Access historical reports and data
- Copy previous reports for reference

### Data Persistence
- All data stored locally in browser
- Resume interrupted missions
- Persistent mission logs and profile data

## How to Use

1. **First Time Setup**
   - Open `index.html` in a web browser
   - Fill out your officer profile information
   - Save your profile

2. **Starting a Mission**
   - Select your mission type from the dashboard
   - For patrol missions, fill out mission details including:
     - Mission name
     - Start and end times
     - Planned patrol stops (optional)
     - Mission details

3. **During Patrol Missions**
   - Use "Go On-Site" when arriving at a location
   - Add location details and checkpoint information
   - File incident reports as needed
   - Use "Go Off-Site" when leaving a location
   - Continue patrol stops throughout your shift

4. **Ending a Mission**
   - Click "End Mission" when your shift is complete
   - If ending early, fill out the excuse form
   - Generate and copy your mission report

5. **Viewing Mission Logs**
   - Click "View Mission Logs" from the main dashboard
   - Access all historical mission data
   - Copy previous reports for reference

## Technical Requirements

- Modern web browser with JavaScript enabled
- Local storage support for data persistence
- No internet connection required (fully offline capable)

## File Structure

- `index.html` - Main application interface
- `styles.css` - Application styling and responsive design
- `app.js` - Core application logic and functionality
- `README.md` - This documentation file

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Data Storage

All data is stored locally in your browser's localStorage. Data persists between sessions but is tied to the specific browser and device. For backup purposes, you can copy mission reports to external storage.

## Security Note

This application stores all data locally and does not transmit any information over the internet. All officer and mission data remains on the local device.