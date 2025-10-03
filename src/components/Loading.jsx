import React from 'react';
import { Heart } from 'lucide-react';
import './Loading.css';

function Loading() {
  return (
    <div className="loading-container">
      <Heart className="heart-icon loading" size={48} />
      <h2>Đang tải dữ liệu...</h2>
    </div>
  );
}

export default Loading;