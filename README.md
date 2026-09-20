# YouTube Channel Analyzer

A modern, fullstack YouTube channel intelligence and analytics platform built with Node.js, Express, Handlebars, and the YouTube Data API v3. Delivers actionable creator metrics, CPM revenue modeling, engagement benchmarks, SEO tag analysis, and an embedded video theater modal.

---

## Live Demo & Links

- Live Preview: [youtube-channel-analyzer.azurewebsites.net](https://youtube-channel-analyzer.azurewebsites.net/)
- Portfolio: [ferilsunu.com](https://ferilsunu.com)
- GitHub Repository: [github.com/ferilsunu/YouTube-Channel-Analyzer](https://github.com/ferilsunu/YouTube-Channel-Analyzer)
- API Reference: [Google YouTube Data API v3](https://developers.google.com/youtube/v3/docs)

---

## Key Features

- **Channel Intelligence Overview**: Real-time subscriber count, lifetime video views, total uploaded videos, country origin, and channel creation date.
- **Estimated CPM Revenue Modeling**: Dynamic projected monthly and annual creator earnings based on view velocity and industry CPM benchmarks.
- **Engagement & Performance Metrics**: Average views per video, like-to-view ratios, comment engagement rates, and upload consistency scores.
- **Recent Uploads & Video Theater**: Interactive grid of recent video uploads with direct embedded YouTube playback modal.
- **SEO & Tag Analytics**: Top performing keywords and channel tags extracted to evaluate discoverability.
- **Modern Glassmorphic UI**: Ultra-clean responsive interface with vector Lucide icons, glassmorphism cards, and fluid layouts for mobile, tablet, and desktop.
- **RESTful API Endpoint**: Dedicated `/api/analyze?q={channel}` JSON endpoint for programmatic channel metrics access.
- **Security & Performance Hardening**: Express `x-powered-by` header disabled, input validation, and asynchronous native fetch requests.

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Templating Engine**: Express-Handlebars with custom helpers
- **Icons & Graphics**: Lucide vector icons, SVG graphics
- **Styling**: Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism)
- **Data Source**: Google YouTube Data API v3
- **Environment**: Dotenv configuration

---

## Project Structure

```text
YouTube-Channel-Analyzer/
├── controllers/
│   └── index.js              # Controller actions for web and JSON API
├── routers/
│   └── index.js              # Express routing definitions
├── services/
│   └── youtubeService.js     # YouTube Data API v3 integration and metrics calculations
├── views/
│   ├── layouts/
│   │   └── dashboardLayout.handlebars  # Main app layout with header and modal
│   └── dashboard.handlebars            # Dashboard view with metrics and video grid
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css     # Modern responsive styles and glassmorphism theme
│   │   ├── js/
│   │   │   ├── dashboard.js  # Client-side video modal and interactions
│   │   │   └── lucide.min.js # Vector icon engine
│   │   └── images/           # App logo and static assets
├── app.js                    # Express application entry point
├── package.json              # Project dependencies and start scripts
└── README.md                 # Project documentation
```

---

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- NPM (Node Package Manager)
- YouTube Data API v3 Key ([Google Cloud Console](https://console.cloud.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ferilsunu/YouTube-Channel-Analyzer.git
   cd YouTube-Channel-Analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   API_KEY=your_youtube_data_api_v3_key
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3001
   ```

---

## API Documentation

### Analyze Channel (JSON Endpoint)

Returns structured channel statistics, recent videos, engagement benchmarks, and calculated earnings.

- **Endpoint**: `GET /api/analyze`
- **Query Parameters**:
  - `q` (string, required): YouTube channel username, custom handle (e.g. `@mkbhd`), or channel ID.

#### Example Request:
```bash
curl "http://localhost:3001/api/analyze?q=mkbhd"
```

#### Example Response:
```json
{
  "success": true,
  "data": {
    "channel": {
      "id": "UCBJycsmduvYEL83R_U4JriQ",
      "title": "Marques Brownlee",
      "customUrl": "@mkbhd",
      "subscribers": 18500000,
      "views": 4150000000,
      "videoCount": 1650
    },
    "metrics": {
      "avgViewsPerVideo": 2515151,
      "engagementRate": "4.8%",
      "estimatedMonthlyEarnings": "$12,500 - $35,000"
    },
    "recentVideos": [...]
  }
}
```

---

## License

This project is licensed under the ISC License.

Developed by [Feril Sunu](https://ferilsunu.com).
