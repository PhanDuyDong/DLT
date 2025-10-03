import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import './SyncIndicator.css';

function SyncIndicator({ isOnline }) {
  return (
    <div className="sync-indicator">
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span className="sync-dot"></span>
          <span>Đã kết nối</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span className="sync-dot offline"></span>
          <span>Mất kết nối</span>
        </>
      )}
    </div>
  );
}

export default SyncIndicator;