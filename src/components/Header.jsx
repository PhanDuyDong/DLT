import React from 'react';
import { Heart, Plus } from 'lucide-react';
import './Header.css';

function Header({ onAddClick }) {
  return (
    <div className="header-card">
      <div className="header-content">
        <div className="header-title">
          <Heart className="heart-icon" size={32} />
          <h1>Lịch Hẹn Hò Của Đông và Tâm Tâm</h1>
        </div>
        <button onClick={onAddClick} className="btn-add">
          <Plus size={20} />
          Thêm Kế Hoạch
        </button>
      </div>
    </div>
  );
}

export default Header;