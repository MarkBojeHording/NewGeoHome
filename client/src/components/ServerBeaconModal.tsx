import { useState, useEffect } from 'react'
import { X, Server, Settings, Users, Shield, Activity, Database, Network, Terminal } from 'lucide-react'

interface ServerBeaconModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ServerBeaconModal({ isOpen, onClose }: ServerBeaconModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [serverStatus, setServerStatus] = useState('online')
  const [connectionCount, setConnectionCount] = useState(42)
  const [cpuUsage, setCpuUsage] = useState(23)
  const [memoryUsage, setMemoryUsage] = useState(67)

  // Simulate real-time updates
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      setConnectionCount(prev => prev + Math.floor(Math.random() * 3) - 1)
      setCpuUsage(prev => Math.max(0, Math.min(100, prev + Math.floor(Math.random() * 6) - 3)))
      setMemoryUsage(prev => Math.max(0, Math.min(100, prev + Math.floor(Math.random() * 4) - 2)))
    }, 2000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'connections', label: 'Connections', icon: Network },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'console', label: 'Console', icon: Terminal }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-5 w-5 text-green-400" />
                  <span className="text-orange-100 font-semibold">Server Status</span>
                </div>
                <div className={`text-lg font-bold ${serverStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                  {serverStatus.toUpperCase()}
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-orange-100 font-semibold">Active Connections</span>
                </div>
                <div className="text-lg font-bold text-blue-400">{connectionCount}</div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-yellow-400" />
                  <span className="text-orange-100 font-semibold">CPU Usage</span>
                </div>
                <div className="text-lg font-bold text-yellow-400">{cpuUsage}%</div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
              <h3 className="text-orange-100 font-semibold mb-3">System Metrics</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>CPU Usage</span>
                    <span>{cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Memory Usage</span>
                    <span>{memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'connections':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
              <h3 className="text-orange-100 font-semibold mb-3">Active Connections</h3>
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 px-3 bg-gray-700 rounded">
                    <span className="text-gray-300">192.168.1.{100 + i}</span>
                    <span className="text-green-400 text-sm">Connected</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'database':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
              <h3 className="text-orange-100 font-semibold mb-3">Database Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-300 text-sm">Status:</span>
                  <div className="text-green-400 font-semibold">CONNECTED</div>
                </div>
                <div>
                  <span className="text-gray-300 text-sm">Records:</span>
                  <div className="text-blue-400 font-semibold">1,247</div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-orange-600/30">
              <h3 className="text-orange-100 font-semibold mb-3">Server Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Port</label>
                  <input 
                    type="number" 
                    value="5000" 
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Max Connections</label>
                  <input 
                    type="number" 
                    value="100" 
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'console':
        return (
          <div className="space-y-4">
            <div className="bg-black p-4 rounded-lg border border-orange-600/30 font-mono text-sm">
              <div className="text-green-400 mb-2">[INFO] ServerBeacon v1.0.0 initialized</div>
              <div className="text-blue-400 mb-2">[DEBUG] Database connection established</div>
              <div className="text-yellow-400 mb-2">[WARN] High memory usage detected</div>
              <div className="text-green-400 mb-2">[INFO] {connectionCount} active connections</div>
              <div className="text-gray-400">$ _</div>
            </div>
          </div>
        )
      
      default:
        return <div>Tab content not found</div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border-2 border-orange-600/50 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-900/30 via-gray-800 to-orange-900/30 p-4 border-b border-orange-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-400" />
              <h2 className="text-xl font-bold text-orange-100">ServerBeacon Admin Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              data-testid="button-close-serverbeacon"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 border-b border-orange-600/30">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-orange-100 border-b-2 border-orange-500 bg-orange-900/20'
                      : 'text-gray-400 hover:text-orange-100 hover:bg-gray-700'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}