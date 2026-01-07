import React, { useState, useEffect } from 'react';
import { cacheManager } from '../api/cacheManager';
import { logger } from '../api/logger';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import './APIDebugDashboard.scss'; // Assuming you might want one

const APIDebugDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('network');
  const [metrics, setMetrics] = useState({
    cacheStats: cacheManager.getStats(),
    logs: logger.getLogs(),
    isOnline: true
  });
  
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const interval = setInterval(() => {
      if (isVisible) {
        setMetrics({
          cacheStats: cacheManager.getStats(),
          logs: logger.getLogs(),
          isOnline
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible, isOnline]);

  if (!import.meta.env.DEV && !window.SHOW_DEBUG) return null;

  return (
    <div className={`debug-dashboard ${isVisible ? 'open' : 'closed'}`}>
      <button 
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? 'Close Debug' : '🐞 API Debug'}
      </button>

      {isVisible && (
        <div className="debug-content">
          <div className="debug-tabs">
            <button onClick={() => setActiveTab('network')} className={activeTab === 'network' ? 'active' : ''}>Network</button>
            <button onClick={() => setActiveTab('cache')} className={activeTab === 'cache' ? 'active' : ''}>Cache</button>
            <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'active' : ''}>Logs</button>
          </div>

          <div className="debug-panel">
            {activeTab === 'network' && (
              <div>
                <h3>Network Status</h3>
                <div className={`status-indicator ${metrics.isOnline ? 'online' : 'offline'}`}>
                  {metrics.isOnline ? 'Online' : 'Offline'}
                </div>
                <div className="stats-row">
                   <span>Retry Queue:</span>
                   {/* exposing queue size might require getter in retryManager */}
                   <span>Active</span> 
                </div>
              </div>
            )}

            {activeTab === 'cache' && (
              <div>
                <h3>Cache Statistics</h3>
                <pre>{JSON.stringify(metrics.cacheStats, null, 2)}</pre>
                <button onClick={() => cacheManager.clear()}>Clear Cache</button>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <h3>Recent Logs</h3>
                <div className="logs-list">
                  {metrics.logs.map((log, i) => (
                    <div key={i} className={`log-entry ${log.level}`}>
                      <span className="time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="msg">{log.message}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => logger.clearLogs()}>Clear Logs</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIDebugDashboard;
