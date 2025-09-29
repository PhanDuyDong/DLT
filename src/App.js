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
    date: new Date().toISOString().split('T')[0], // Lưu dưới dạng string
    images: []
  });
  const [editingId, setEditingId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const eventTypes = {
    food: { icon: Utensils, label: 'Ăn uống', color: '#f43f5e' },
    movie: { icon: Film, label: 'Xem phim', color: '#a855f7' },
    travel: { icon: MapPin, label: 'Đi chơi', color: '#3b82f6' }
  };

  // Lắng nghe dữ liệu từ Firebase Realtime Database
  useEffect(() => {
    const eventsRef = ref(database, 'events');
    
    // Lắng nghe thay đổi dữ liệu realtime
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Chuyển đổi object thành array
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

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
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
          date: newEvent.date, // Đã là string
          images: newEvent.images || []
        };

        if (editingId) {
          // Cập nhật event
          const eventRef = ref(database, `events/${editingId}`);
          await update(eventRef, eventData);
          setEditingId(null);
        } else {
          // Thêm event mới
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

  const handleImageUpload = async (e, isForEvent = false) => {
    const files = Array.from(e.target.files);
    
    // Giới hạn kích thước file
    const maxSize = 500000; // 500KB
    
    for (const file of files) {
      if (file.size > maxSize) {
        alert('Hình ảnh quá lớn! Vui lòng chọn hình nhỏ hơn 500KB.');
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const base64Image = readerEvent.target.result;
        
        if (isForEvent && showEventDetail) {
          // Cập nhật ảnh cho event hiện tại
          const updatedImages = [...(showEventDetail.images || []), base64Image];
          const eventRef = ref(database, `events/${showEventDetail.id}`);
          await update(eventRef, { images: updatedImages });
          setShowEventDetail({ ...showEventDetail, images: updatedImages });
        } else {
          // Thêm ảnh vào form event mới
          setNewEvent({ ...newEvent, images: [...(newEvent.images || []), base64Image] });
        }
      };
      reader.readAsDataURL(file);
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
      date: event.date.toISOString().split('T')[0]
    });
    setEditingId(event.id);
    setShowEventDetail(null);
    setShowModal(true);
  };

  const removeImage = async (index, isForEvent = false) => {
    if (isForEvent && showEventDetail) {
      const updatedImages = showEventDetail.images.filter((_, i) => i !== index);
      const eventRef = ref(database, `events/${showEventDetail.id}`);
      await update(eventRef, { images: updatedImages });
      setShowEventDetail({ ...showEventDetail, images: updatedImages });
    } else {
      setNewEvent({ ...newEvent, images: newEvent.images.filter((_, i) => i !== index) });
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
              <h1>Lịch Hẹn Hò Của Chúng Ta</h1>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-add">
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
                    {dayEvents.map(event => {
                      const EventIcon = eventTypes[event.type].icon;
                      return (
                        <div
                          key={event.id}
                          onClick={() => setShowEventDetail(event)}
                          className="event-badge"
                          style={{ backgroundColor: eventTypes[event.type].color }}
                        >
                          <EventIcon size={12} />
                          <span>{event.title}</span>
                        </div>
                      );
                    })}
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
                <label>Hình ảnh (Max: 500KB/ảnh)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, false)}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="file-label">
                  <Camera size={20} />
                  Thêm ảnh kỷ niệm
                </label>
                
                {newEvent.images && newEvent.images.length > 0 && (
                  <div className="image-grid">
                    {newEvent.images.map((img, idx) => (
                      <div key={idx} className="image-item">
                        <img src={img} alt="" />
                        <button onClick={() => removeImage(idx, false)} className="remove-image">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleAddEvent} className="btn-submit">
                {editingId ? 'Cập Nhật' : 'Thêm Kế Hoạch'}
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
                {React.createElement(eventTypes[showEventDetail.type].icon, { 
                  size: 32,
                  style: { color: eventTypes[showEventDetail.type].color }
                })}
                <div>
                  <h3>{showEventDetail.title}</h3>
                  <p>{showEventDetail.date.toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="detail-actions">
                <button onClick={() => handleEditEvent(showEventDetail)} className="action-btn">
                  <Edit2 size={20} style={{ color: '#3b82f6' }} />
                </button>
                <button onClick={() => handleDeleteEvent(showEventDetail.id)} className="action-btn">
                  <Trash2 size={20} style={{ color: '#ef4444' }} />
                </button>
                <button onClick={() => setShowEventDetail(null)} className="action-btn">
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
                  onChange={(e) => handleImageUpload(e, true)}
                  className="file-input"
                  id="event-image-upload"
                />
                <label htmlFor="event-image-upload" className="add-image-link">
                  <Plus size={16} />
                  Thêm ảnh
                </label>
              </div>
              
              {showEventDetail.images && showEventDetail.images.length > 0 ? (
                <div className="image-grid large">
                  {showEventDetail.images.map((img, idx) => (
                    <div key={idx} className="image-item">
                      <img src={img} alt="" />
                      <button onClick={() => removeImage(idx, true)} className="remove-image">
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