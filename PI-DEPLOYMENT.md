# Raspberry Pi Deployment Guide

## Quick Start

On your Raspberry Pi, run:

```bash
# Clone the repo
git clone https://github.com/chengsij/gf-tea.git
cd gf-tea

# Run setup script (installs everything + systemd service)
chmod +x pi-setup.sh
./pi-setup.sh
```

That's it! Your tea app will be running and auto-start on boot.

## Access the App

The app runs on port 3001. Find your Pi's IP address:
```bash
hostname -I
```

Then visit: `http://YOUR_PI_IP:3001`

Example: `http://192.168.1.100:3001`

## Useful Commands

```bash
# View status
sudo systemctl status tea-app

# View live logs
sudo journalctl -u tea-app -f

# Restart (after updates)
cd ~/gf-tea-app
git pull
cd tea-app && npm run build
sudo systemctl restart tea-app

# Stop service
sudo systemctl stop tea-app

# Start service
sudo systemctl start tea-app

# Disable auto-start on boot
sudo systemctl disable tea-app
```

## Updating the App

When you push changes to GitHub:

```bash
# On Pi
cd ~/gf-tea-app
git pull
cd tea-app
npm install           # If dependencies changed
npm run build         # Rebuild frontend
sudo systemctl restart tea-app
```

## Manual Setup (if you prefer)

If you don't want to use the setup script:

### 1. Install Dependencies
```bash
cd tea-app
npm install
cd server && npm install && cd ..
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Install systemd Service
```bash
sudo cp tea-app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tea-app
sudo systemctl start tea-app
```

## Troubleshooting

### Service won't start
```bash
# Check logs
sudo journalctl -u tea-app -n 50

# Common issues:
# - Node/npm not installed: sudo apt install nodejs npm
# - Wrong path in service file: edit /etc/systemd/system/tea-app.service
# - Permissions: make sure pi user owns the directory
```

### Port 3001 already in use
```bash
# Find what's using it
sudo lsof -i :3001

# Kill the process
sudo kill <PID>
```

### Out of memory
The service limits RAM to 500MB. If you need more:
```bash
sudo systemctl edit tea-app
# Add: [Service]
#      MemoryMax=1G
sudo systemctl restart tea-app
```

## Performance Tips

The app is optimized for Raspberry Pi:
- Express serves static files (lightweight)
- CPU limited to 50% to prevent overheating
- Memory capped at 500MB
- Auto-restarts on crashes

Your Pi should handle this easily with resources to spare!
