import React from 'react';
import { X, Camera } from 'lucide-react';
import './EventModal.css';

function EventModal({ 
  newEvent, 
  setNewEvent, 
  eventTypes, 
  onSubmit, 
  onClose, 
  onImageUpload, 
  onRemoveImage,
  isEditing,
  uploading 
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEditing ? 'Chỉnh Sửa Kế Hoạch' : 'Thêm Kế Hoạch Mới'}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Tiêu đề</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="VD: Dinner lãng mạn"
            />
          </div>

          <div className="form-group">
            <label>Loại hoạt động</label>
            <div className="event-types">
              {Object.entries(eventTypes).map(([key, { icon: Icon, label, color }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, type: key })}
                  className={`type-btn ${newEvent.type === key ? 'active' : ''}`}
                  style={newEvent.type === key ? { backgroundColor: color, color: 'white' } : {}}
                >
                  <Icon size={20} />
                  <div>{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Ngày</label>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              rows="3"
              placeholder="Thêm ghi chú..."
            />
          </div>

          <div className="form-group">
            <label>Hình ảnh</label>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onImageUpload(e, false)}
              className="file-input"
              id="image-upload"
              disabled={uploading}
            />
            <label htmlFor="image-upload" className="file-label">
              <Camera size={20} />
              {uploading ? 'Đang xử lý...' : 'Chụp ảnh hoặc chọn từ thư viện'}
            </label>
            
            {newEvent.images && newEvent.images.length > 0 && (
              <div className="image-grid">
                {newEvent.images.map((img, idx) => (
                  <div key={idx} className="image-item">
                    <img src={img} alt="" />
                    <button 
                      type="button"
                      onClick={() => onRemoveImage(idx, false)} 
                      className="remove-image"
                      disabled={uploading}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="upload-info">
              <span>Ảnh sẽ được tự động nén để tối ưu tốc độ</span>
            </div>
          </div>

          <button 
            onClick={onSubmit} 
            className="btn-submit"
            disabled={uploading || !newEvent.title.trim()}
          >
            {uploading ? 'Đang xử lý...' : (isEditing ? 'Cập Nhật' : 'Thêm Kế Hoạch')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventModal;