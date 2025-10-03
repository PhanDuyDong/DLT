import React, { useState, useEffect } from 'react';
import { Heart, Camera, MapPin, Utensils, Film, Plus, X, Edit2, Trash2, Wifi, WifiOff } from 'lucide-react';
import './App.css';
import { database } from './firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    images: []
  });
  const [editingId, setEditingId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const eventTypes = {
    food: { icon: Utensils, label: 'Ăn uống', color: '#f43f5e' },
    movie: { icon: Film, label: 'Xem phim', color: '#a855f7' },
    travel: { icon: MapPin, label: 'Đi chơi', color: '#3b82f6' }
  };

  // Lắng nghe dữ liệu từ Firebase Realtime Database
  useEffect(() => {
    const eventsRef = ref(database, 'events');
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedEvents = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
          date: new Date(value.date)
        }));
        setEvents(loadedEvents);
      } else {
        setEvents([]);
      }
      setLoading(false);
      setIsOnline(true);
    }, (error) => {
      console.error('Firebase error:', error);
      setIsOnline(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Hàm nén ảnh cho mobile (Đã tối ưu để có thể bỏ qua bước nén 2 lần nếu cần)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Tính toán kích thước mới (giữ tỷ lệ)
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          // Vẽ ảnh lên canvas với kích thước mới
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Chuyển canvas thành blob với chất lượng nén 0.8 (Tốt cho chất lượng và dung lượng)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Logic nén lại nếu vẫn quá lớn (giữ lại để tối ưu dung lượng)
                if (blob.size > 500000) { 
                  canvas.toBlob(
                    (compressedBlob) => {
                      resolve(compressedBlob || blob);
                    },
                    'image/jpeg',
                    0.6 // Giảm chất lượng nén lần 2
                  );
                } else {
                  resolve(blob);
                }
              } else {
                reject(new Error('Không thể nén ảnh'));
              }
            },
            'image/jpeg',
            0.8
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Không thể load ảnh. Ảnh có thể không hợp lệ (như định dạng HEIC không được hỗ trợ đầy đủ)'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Hàm xử lý upload ảnh (Đã sửa lỗi logic bất đồng bộ và tối ưu cho Firebase)
  const handleImageUpload = async (e, isForEvent = false) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];
    const targetId = isForEvent ? showEventDetail?.id : null;

    for (const file of files) {
        try {
            // Kiểm tra định dạng file
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh!');
                continue;
            }

            console.log('Original file size:', file.size, 'bytes');

            // 1. Nén ảnh: Chờ hàm nén hoàn tất
            const compressedFile = await compressImage(file);
            console.log('Compressed file size:', compressedFile.size, 'bytes');
            
            // 2. Đọc file Blob đã nén thành Base64
            const base64Image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (readerEvent) => resolve(readerEvent.target.result);
                reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh.'));
                reader.readAsDataURL(compressedFile); // Đọc Blob đã nén
            });
            
            uploadedImages.push(base64Image);

        } catch (error) {
            console.error('Error processing image:', error);
            alert('Lỗi khi xử lý ảnh. Vui lòng thử lại với ảnh JPEG/PNG khác hoặc định dạng HEIC đã được chuyển đổi: ' + error.message);
        }
    }
    
    // 3. Cập nhật State và Firebase sau khi tất cả các file đã được xử lý
    if (uploadedImages.length > 0) {
        try {
            if (isForEvent && targetId) {
                // Cập nhật ảnh cho event hiện tại
                const updatedImages = [...(showEventDetail.images || []), ...uploadedImages];
                const eventRef = ref(database, `events/${targetId}`);
                await update(eventRef, { images: updatedImages });
                // Cập nhật local state (showEventDetail) để hiển thị ngay lập tức
                setShowEventDetail(prev => prev ? { ...prev, images: updatedImages } : null);
            } else {
                // Thêm ảnh vào form event mới
                setNewEvent(prev => ({ 
                    ...prev, 
                    images: [...(prev.images || []), ...uploadedImages] 
                }));
            }
        } catch (error) {
            console.error('Error updating event with images:', error);
            alert('Lỗi khi lưu ảnh lên Firebase!');
        }
    }
    
    setUploading(false);
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };


  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // getDay() trả về 0 cho Chủ Nhật, 1 cho Thứ Hai, ...
    const startingDayOfWeek = firstDay.getDay(); 
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleAddEvent = async () => {
    if (newEvent.title.trim()) {
      try {
        const eventData = {
          ...newEvent,
          // Đảm bảo images luôn là mảng, ngay cả khi undefined
          images: newEvent.images || []
        };

        if (editingId) {
          const eventRef = ref(database, `events/${editingId}`);
          await update(eventRef, eventData);
          setEditingId(null);
        } else {
          const eventsRef = ref(database, 'events');
          await push(eventsRef, eventData);
        }

        // Reset form
        setNewEvent({ 
          title: '', 
          type: 'food', 
          description: '', 
          date: new Date().toISOString().split('T')[0],
          images: [] 
        });
        setShowModal(false);
      } catch (error) {
        console.error('Error saving event:', error);
        alert('Lỗi khi lưu sự kiện. Vui lòng thử lại!');
      }
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sự kiện này?')) {
      try {
        const eventRef = ref(database, `events/${id}`);
        await remove(eventRef);
        setShowEventDetail(null);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Lỗi khi xóa sự kiện!');
      }
    }
  };

  const handleEditEvent = (event) => {
    setNewEvent({
      ...event,
      // Khi edit, event.date là object Date, cần chuyển lại string cho input type="date"
      date: event.date.toISOString().split('T')[0]
    });
    setEditingId(event.id);
    setShowEventDetail(null);
    setShowModal(true);
  };

  const removeImage = async (index, isForEvent = false) => {
    try {
      if (isForEvent && showEventDetail) {
        const updatedImages = showEventDetail.images.filter((_, i) => i !== index);
        const eventRef = ref(database, `events/${showEventDetail.id}`);
        await update(eventRef, { images: updatedImages });
        setShowEventDetail({ ...showEventDetail, images: updatedImages });
      } else {
        setNewEvent(prev => ({ 
          ...prev, 
          images: (prev.images || []).filter((_, i) => i !== index) 
        }));
      }
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Lỗi khi xóa ảnh!');
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <Heart className="heart-icon loading" size={48} />
          <h2>Đang tải dữ liệu...</h2>
        </div>
        </div>
    );
  }

  return (
    <div className="app-container">
      {/* Indicator trạng thái kết nối */}
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

      <div className="content-wrapper">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-title">
              <Heart className="heart-icon" size={32} />
              <h1>Lịch Hẹn Hò Của Đông và Tâm Tâm</h1>
            </div>
            <button 
                onClick={() => {
                    setEditingId(null);
                    setNewEvent({ 
                        title: '', 
                        type: 'food', 
                        description: '', 
                        date: new Date().toISOString().split('T')[0],
                        images: [] 
                    });
                    setShowModal(true);
                }} 
                className="btn-add"
            >
              <Plus size={20} />
              Thêm Kế Hoạch
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="calendar-card">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="nav-btn">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="month-title">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={handleNextMonth} className="nav-btn">
              <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="calendar-grid">
            {dayNames.map(day => (
              <div key={day} className="day-name">{day}</div>
            ))}
            
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="calendar-day empty" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                  <div className="day-number">{day}</div>
                  <div className="events-list">
                    {dayEvents.slice(0, 2).map(event => {
                      const EventIcon = eventTypes[event.type]?.icon || Heart;
                      const eventColor = eventTypes[event.type]?.color || '#94a3b8';
                      return (
                        <div
                          key={event.id}
                          onClick={() => setShowEventDetail(event)}
                          className="event-badge"
                          style={{ backgroundColor: eventColor }}
                        >
                          <EventIcon size={10} />
                          <span>{event.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div 
                        className="more-events"
                        onClick={() => {
                            // Mở chi tiết sự kiện đầu tiên để xem tất cả
                            if (dayEvents.length > 0) setShowEventDetail(dayEvents[0]);
                        }}
                      >
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Chỉnh Sửa Kế Hoạch' : 'Thêm Kế Hoạch Mới'}</h3>
              <button onClick={() => {
                setShowModal(false);
                setEditingId(null);
                setNewEvent({ 
                  title: '', 
                  type: 'food', 
                  description: '', 
                  date: new Date().toISOString().split('T')[0],
                  images: [] 
                });
              }} className="close-btn">
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
                  // Đã loại bỏ 'capture="environment"' để cho phép truy cập thư viện dễ dàng hơn
                  onChange={(e) => handleImageUpload(e, false)}
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
                          onClick={() => removeImage(idx, false)} 
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
                onClick={handleAddEvent} 
                className="btn-submit"
                disabled={uploading || !newEvent.title.trim()}
              >
                {uploading ? 'Đang xử lý...' : (editingId ? 'Cập Nhật' : 'Thêm Kế Hoạch')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && (
        <div className="modal-overlay">
          <div className="modal-content detail-modal">
            <div className="detail-header">
              <div className="detail-title">
                {/* Sử dụng optional chaining để tránh lỗi nếu event.type không hợp lệ */}
                {React.createElement(eventTypes[showEventDetail.type]?.icon || Heart, { 
                  size: 32,
                  style: { color: eventTypes[showEventDetail.type]?.color || '#94a3b8' }
                })}
                <div>
                  <h3>{showEventDetail.title}</h3>
                  <p>{showEventDetail.date.toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="detail-actions">
                <button 
                  onClick={() => handleEditEvent(showEventDetail)} 
                  className="action-btn"
                  type="button"
                >
                  <Edit2 size={20} style={{ color: '#3b82f6' }} />
                </button>
                <button 
                  onClick={() => handleDeleteEvent(showEventDetail.id)} 
                  className="action-btn"
                  type="button"
                >
                  <Trash2 size={20} style={{ color: '#ef4444' }} />
                </button>
                <button 
                  onClick={() => setShowEventDetail(null)} 
                  className="action-btn"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {showEventDetail.description && (
              <div className="detail-description">
                <p>{showEventDetail.description}</p>
              </div>
            )}

            <div className="detail-images">
              <div className="images-header">
                <h4>
                  <Camera size={20} />
                  Ảnh Kỷ Niệm ({showEventDetail.images ? showEventDetail.images.length : 0})
                </h4>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  // Đã loại bỏ 'capture="environment"' để cho phép truy cập thư viện dễ dàng hơn
                  onChange={(e) => handleImageUpload(e, true)}
                  className="file-input"
                  id="event-image-upload"
                  disabled={uploading}
                />
                <label htmlFor="event-image-upload" className="add-image-link">
                  <Plus size={16} />
                  {uploading ? 'Đang xử lý...' : 'Thêm ảnh'}
                </label>
              </div>
              
              {(showEventDetail.images && showEventDetail.images.length > 0) ? (
                <div className="image-grid large">
                  {showEventDetail.images.map((img, idx) => (
                    <div key={idx} className="image-item">
                      <img src={img} alt="" />
                      <button 
                        onClick={() => removeImage(idx, true)} 
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;