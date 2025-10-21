import React, { useState } from 'react';
import { Heart, X, Edit2, Trash2, Camera, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import './EventDetail.css';

function EventDetail({
  event,
  eventTypes,
  onClose,
  onEdit,
  onDelete,
  onImageUpload,
  onRemoveImage,
  uploading
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const EventIcon = eventTypes[event.type]?.icon || Heart;
  const eventColor = eventTypes[event.type]?.color || '#94a3b8';
  
  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };
  
  const closeLightbox = () => {
    setLightboxOpen(false);
  };
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === event.images.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? event.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content detail-modal">
        <div className="detail-header">
          <div className="detail-title">
            <EventIcon size={32} style={{ color: eventColor }} />
            <div>
              <h3>{event.title}</h3>
              <p>{event.date.toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          <div className="detail-actions">
            <button onClick={() => onEdit(event)} className="action-btn" type="button">
              <Edit2 size={20} style={{ color: '#3b82f6' }} />
            </button>
            <button onClick={() => onDelete(event.id)} className="action-btn" type="button">
              <Trash2 size={20} style={{ color: '#ef4444' }} />
            </button>
            <button onClick={onClose} className="action-btn" type="button">
              <X size={24} />
            </button>
          </div>
        </div>

        {event.description && (
          <div className="detail-description">
            <p>{event.description}</p>
          </div>
        )}

        <div className="detail-images">
          <div className="images-header">
            <h4>
              <Camera size={20} />
              Ảnh Kỷ Niệm ({event.images ? event.images.length : 0})
            </h4>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onImageUpload(e, true)}
              className="file-input"
              id="event-image-upload"
              disabled={uploading}
            />
            <label htmlFor="event-image-upload" className="add-image-link">
              <Plus size={16} />
              {uploading ? 'Đang xử lý...' : 'Thêm ảnh'}
            </label>
          </div>
         
          {(event.images && event.images.length > 0) ? (
            <div className="image-grid large">
              {event.images.map((img, idx) => (
                <div key={idx} className="image-item">
                  <img 
                    src={img} 
                    alt="" 
                    onClick={() => openLightbox(idx)}
                  />
                  <button
                    onClick={() => onRemoveImage(idx, true)}
                    className="remove-image"
                    type="button"
                    disabled={uploading}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-images">
              <Camera size={48} />
              <p>Chưa có ảnh kỷ niệm</p>
            </div>
          )}
        </div>

        {/* Lightbox Viewer */}
        {lightboxOpen && event.images && (
          <div className="lightbox-overlay" onClick={closeLightbox}>
            <button className="lightbox-close" onClick={closeLightbox} type="button">
              <X size={32} />
            </button>
            
            {event.images.length > 1 && (
              <>
                <button 
                  className="lightbox-nav lightbox-prev" 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  type="button"
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  className="lightbox-nav lightbox-next" 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  type="button"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img 
                src={event.images[currentImageIndex]} 
                alt=""
                className="lightbox-image"
              />
              <div className="lightbox-counter">
                {currentImageIndex + 1} / {event.images.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetail;
