# GeoHome + ServerBeacon Integration

A comprehensive tactical mapping and server monitoring system for Rust game servers, combining GeoHome's tactical map interface with ServerBeacon's server management capabilities.

## 🎯 Project Overview

**GeoHome** serves as the user-facing tactical map interface where players can:
- Mark and track enemy/friendly bases
- Create detailed reports and task assignments
- Monitor player activity and base status
- Use advanced features like heat maps and decay timers

**ServerBeacon** provides the admin backend for:
- Monitoring multiple Rust servers via BattleMetrics API
- Real-time player tracking and activity monitoring
- Server status management and configuration
- Multi-tenant support for up to 1,000 users

## 🚀 Features

### Tactical Map (GeoHome)
- **Interactive Grid System**: 26x26 coordinate grid with base markers
- **Base Management**: Add, edit, and categorize enemy/friendly bases
- **Report System**: Create detailed reports with screenshots and notes
- **Task Management**: Assign and track pickup, repair, and resource tasks
- **Player Tracking**: Monitor online/offline player counts per base
- **Heat Maps**: Visual activity overlays with configurable radius and intensity
- **Decay Timers**: Track base decay with automatic countdown timers
- **Group Coordination**: Link subordinate bases to main bases

### Server Monitoring (ServerBeacon)
- **Multi-Server Support**: Monitor unlimited Rust servers
- **Real-time Updates**: WebSocket-based live data streaming
- **Player Activity Tracking**: Monitor player sessions and movements
- **BattleMetrics Integration**: Direct API integration for server data
- **Admin Interface**: Web-based server management dashboard

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GeoHome       │    │   ServerBeacon   │    │   BattleMetrics │
│   Frontend      │◄──►│   Backend        │◄──►│   API           │
│   (React/TS)    │    │   (Express/TS)   │    │   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   PostgreSQL    │    │   WebSocket      │
│   Database      │    │   Manager        │
└─────────────────┘    └──────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Real-time**: WebSockets + BattleMetrics API
- **Build Tools**: Vite + ESBuild
- **Authentication**: Session-based with PostgreSQL storage

## 📦 Installation

### Prerequisites
- Node.js 20+ 
- PostgreSQL 14+
- BattleMetrics API key

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/MarkBojeHording/GeoHome.git
   cd GeoHome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp ENV_EXAMPLE.txt .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   npm run start:server
   
   # Terminal 2: Start frontend
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/geohome

# BattleMetrics API
BATTLEMETRICS_API_KEY=your_api_key_here

# Server Configuration
PORT=3002
NODE_ENV=development
```

## 🚀 Deployment

### Replit Deployment
The project is configured for easy deployment on Replit:
- Automatic environment detection
- Built-in PostgreSQL support
- WebSocket compatibility
- Production-ready build scripts

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📱 Usage

### For Players (GeoHome)
1. **Access the tactical map** at `http://localhost:3000`
2. **Add bases** by right-clicking on the map
3. **Create reports** for enemy encounters and base activities
4. **Assign tasks** for resource collection and base maintenance
5. **Monitor player activity** with real-time updates

### For Admins (ServerBeacon)
1. **Access admin panel** at `http://localhost:3000/admin`
2. **Add servers** to monitor via BattleMetrics
3. **Configure monitoring** parameters and alerts
4. **View real-time data** from all monitored servers
5. **Manage player tracking** and activity monitoring

## 🔒 Security Features

- **Session Management**: Secure PostgreSQL-based sessions
- **Input Validation**: Comprehensive data validation and sanitization
- **API Rate Limiting**: Built-in protection against abuse
- **Multi-tenancy**: Isolated data access per group
- **Environment Isolation**: Secure configuration management

## 📊 Performance

- **Real-time Updates**: WebSocket-based live data streaming
- **Efficient Queries**: Optimized database queries with proper indexing
- **Caching**: React Query for intelligent data caching
- **Lazy Loading**: Component-based code splitting
- **Optimized Builds**: Vite-based fast development and production builds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the component interaction guide in `COMPONENT_INTERACTIONS.md`

## 🔮 Roadmap

- [ ] Enhanced player profiling system
- [ ] Advanced analytics and reporting
- [ ] Mobile-responsive design improvements
- [ ] Additional game server support
- [ ] Real-time collaboration features
- [ ] Advanced permission system

---

**Built with ❤️ for the Rust gaming community**
