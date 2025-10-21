import React, { useState, useEffect, useRef } from 'react';
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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [scale, setScale] = useState(1);
  const imageRef = useRef(null);
  
  const EventIcon = eventTypes[event.type]?.icon || Heart;
  const eventColor = eventTypes[event.type]?.color || '#94a3b8';
  
  const minSwipeDistance = 50;
  
  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    setScale(1);
    // Ngăn scroll body khi mở lightbox
    document.body.style.overflow = 'hidden';
  };
  
  const closeLightbox = () => {
    setLightboxOpen(false);
    setScale(1);
    // Cho phép scroll lại
    document.body.style.overflow = '';
  };
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === event.images.length - 1 ? 0 : prev + 1
    );
    setScale(1);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? event.images.length - 1 : prev - 1
    );
    setScale(1);
  };
  
  // Touch handlers cho swipe
  const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && event.images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && event.images.length > 1) {
      prevImage();
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentImageIndex]);
  
  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
            
            <div 
              className="lightbox-content" 
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="lightbox-image-container">
                <img 
                  ref={imageRef}
                  src={event.images[currentImageIndex]} 
                  alt=""
                  className="lightbox-image"
                  style={{
                    transform: `scale(${scale})`,
                    transition: scale === 1 ? 'transform 0.3s ease' : 'none'
                  }}
                />
              </div>
              {event.images.length > 1 && (
                <div className="lightbox-counter">
                  {currentImageIndex + 1} / {event.images.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetail;
