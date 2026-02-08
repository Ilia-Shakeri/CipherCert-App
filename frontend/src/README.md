# CipherCert v2 - Enterprise SSL & Domain Intelligence Dashboard

A high-end SSL Security & Domain Intelligence Dashboard built with React, featuring a futuristic glassmorphism design with cyberpunk aesthetic.

## ✨ Features

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Frosted glass effects with backdrop blur
- **Cyberpunk Aesthetic**: Dark mode-first with neon cyan accents (#22D3EE)
- **Mesh Gradients**: Subtle radial gradients in the background
- **Smooth Animations**: Motion-powered transitions and hover effects
- **Custom Logo**: Integrated cybersecurity shield logo

### 📊 Dashboard
- **Real-time Scanning**: Scan domains and IP addresses instantly
- **Status Cards**: Visual metrics with animated circular progress bars
  - Secure Domains count
  - Expired certificates count
  - Average Security Score
- **Security Trend Chart**: Area chart showing security scores over time
- **Data Table**: Comprehensive view of all scanned domains with:
  - Status badges (Secure/Warning/Expired)
  - SSL grades (A+/A/B/C/F)
  - Certificate issuers
  - Expiry dates
  - PDF export per domain

### 📦 Bulk Scan
- **Drag & Drop Upload**: Drop .txt files directly into the interface
- **File Browser**: Click to browse and select files
- **Batch Processing**: Scan multiple domains at once
- **File Format Support**: Plain text files with one domain per line
- **Visual Feedback**: Real-time file preview and scanning progress

### 📜 Scan History
- **Complete Audit Trail**: View all previously scanned domains
- **Search Functionality**: Filter by domain name or issuer
- **Refresh Button**: Update history with latest scans
- **Export Options**:
  - **Excel/CSV Export**: Download complete scan history as spreadsheet
  - **PDF Export**: Generate formatted PDF reports
- **Pagination**: Navigate through large datasets
- **Detailed Records**: Timestamp, status, grade, issuer, and expiry date

### ⚡ Automation & Alerts
- **Rule Creation**: Define custom automation rules
- **Trigger Conditions**:
  - Certificate expires in X days (7/30/90)
  - Security grade drops below threshold
  - New domain added
- **Actions**:
  - Send email notifications
  - Slack integration
  - Webhook triggers
  - Generate reports
  - Automated scanning
- **Scheduling**: Set up recurring scans (hourly/daily/weekly/monthly)
- **Toggle Controls**: Enable/disable rules on the fly
- **Rule Management**: Edit and delete existing automation rules

### ⚙️ Settings
- **Profile Management**: Update username and email
- **Notification Preferences**:
  - Email notifications toggle
  - Slack integration toggle
  - Webhook alerts toggle
- **Scanning Configuration**:
  - Auto-scan scheduling
  - Scan interval selection
  - Max concurrent scans limit
- **Appearance Customization**:
  - Accent color picker (5 preset colors)
  - Font size adjustment
  - Animation controls
- **API Access**: View, copy, and regenerate API keys

### 🎛️ Theme Toggle
- **iOS-Style Switch**: Smooth pill-shaped toggle
- **Sun/Moon Icons**: Visual indicators for light/dark mode
- **Persistent State**: Theme preference maintained across sessions
- **Smooth Transitions**: Animated theme changes

## 🎨 Design System

### Color Palette
- **Background**: `#0F172A` (Deep slate)
- **Primary Accent**: `#22D3EE` (Neon cyan)
- **Success**: `#10B981` (Emerald green)
- **Warning**: `#FBBF24` (Amber)
- **Danger**: `#EF4444` (Red)
- **Text Primary**: `#FFFFFF` (White)
- **Text Secondary**: `#64748B` (Slate gray)

### Typography
- **Primary Font**: Inter
- **Monospace Font**: JetBrains Mono
- **Headings**: Bold, large sizing for hierarchy
- **Body Text**: Regular weight, optimal readability

### UI Components
- **Rounded Corners**: 12-20px border radius
- **Glass Cards**: `backdrop-filter: blur(20px)` with transparency
- **Glowing Borders**: Neon accents with box shadows
- **Hover Effects**: Scale transforms and glow intensification
- **Status Badges**: Color-coded with icons (✓/⚠/✕)

## 🛠️ Tech Stack

- **React**: Component-based UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling
- **Motion (Framer Motion)**: Animation library
- **Recharts**: Data visualization
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

## 📁 Project Structure

```
/
├── App.tsx                      # Main application entry
├── components/
│   ├── GlassSidebar.tsx        # Navigation sidebar
│   ├── GlassThemeToggle.tsx    # Theme switcher
│   ├── DashboardPage.tsx       # Main dashboard view
│   ├── BulkScanPage.tsx        # Bulk upload interface
│   ├── HistoryPage.tsx         # Scan history with exports
│   ├── AutomationPage.tsx      # Automation rules management
│   ├── SettingsPage.tsx        # Application settings
│   ├── StatusCard.tsx          # KPI card component
│   └── CircularProgress.tsx    # Animated progress indicator
└── styles/
    └── globals.css             # Global styles and theme variables
```

## 🚀 Key Interactions

### Scanning Flow
1. Enter domain/IP in search bar
2. Click SCAN button (with rotating icon animation)
3. Instant result display with grade and status
4. Automatic history logging

### Bulk Scanning
1. Navigate to Bulk Scan page
2. Drag .txt file onto upload area OR click to browse
3. File preview with size information
4. Click "Start Bulk Scan" button
5. Progress indicator during processing
6. Results available in History page

### Export Workflow
1. Go to History page
2. Optional: Use search to filter results
3. Click Excel or PDF button
4. CSV file downloads automatically (Excel)
5. PDF generates with loading notification

### Automation Setup
1. Navigate to Automation & Alerts
2. Click "New Rule" button
3. Fill in rule details:
   - Name
   - Trigger condition
   - Action type
   - Schedule (optional)
4. Save rule
5. Toggle on/off as needed

## 💡 Best Practices

- **Performance**: Glassmorphism effects optimized with backdrop-filter
- **Accessibility**: Proper ARIA labels and semantic HTML
- **Responsiveness**: Grid layouts adapt to different screen sizes
- **User Feedback**: Toast notifications for all actions
- **Data Visualization**: Clear metrics and intuitive charts
- **Error Handling**: Graceful validation and error messages

## 🎯 Use Cases

- **SSL Certificate Monitoring**: Track certificate expiry dates
- **Domain Portfolio Management**: Centralized view of all domains
- **Security Compliance**: Ensure all domains meet security standards
- **Proactive Alerting**: Get notified before certificates expire
- **Bulk Operations**: Efficiently scan hundreds of domains
- **Audit Trail**: Complete history of all security scans
- **DevOps Integration**: Webhook support for CI/CD pipelines

---

Built with ❤️ for cybersecurity professionals
