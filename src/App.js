import React, { useState, useEffect } from 'react';
import { Utensils, Film, MapPin } from 'lucide-react';
import './App.css';
import { database } from './firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';

// Components
import Header from './components/Header';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import EventDetail from './components/EventDetail';
import SyncIndicator from './components/SyncIndicator';
import Loading from './components/Loading';

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

  // Lắng nghe dữ liệu từ Firebase
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

  // Hàm nén ảnh
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
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
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size > 500000) { 
                  canvas.toBlob(
                    (compressedBlob) => {
                      resolve(compressedBlob || blob);
                    },
                    'image/jpeg',
                    0.6
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
        reject(new Error('Không thể load ảnh'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Xử lý upload ảnh
  const handleImageUpload = async (e, isForEvent = false) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];
    const targetId = isForEvent ? showEventDetail?.id : null;

    for (const file of files) {
      try {
        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn file ảnh!');
          continue;
        }

        const compressedFile = await compressImage(file);
        
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) => resolve(readerEvent.target.result);
          reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh.'));
          reader.readAsDataURL(compressedFile);
        });
        
        uploadedImages.push(base64Image);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Lỗi khi xử lý ảnh: ' + error.message);
      }
    }
    
    if (uploadedImages.length > 0) {
      try {
        if (isForEvent && targetId) {
          const updatedImages = [...(showEventDetail.images || []), ...uploadedImages];
          const eventRef = ref(database, `events/${targetId}`);
          await update(eventRef, { images: updatedImages });
          setShowEventDetail(prev => prev ? { ...prev, images: updatedImages } : null);
        } else {
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
    e.target.value = '';
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
        alert('Lỗi khi lưu sự kiện!');
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

  const handleAddClick = () => {
    setEditingId(null);
    setNewEvent({ 
      title: '', 
      type: 'food', 
      description: '', 
      date: new Date().toISOString().split('T')[0],
      images: [] 
    });
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingId(null);
    setNewEvent({ 
      title: '', 
      type: 'food', 
      description: '', 
      date: new Date().toISOString().split('T')[0],
      images: [] 
    });
  };

  if (loading) {
    return (
      <div className="app-container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="app-container">
      <SyncIndicator isOnline={isOnline} />

      <div className="content-wrapper">
        <Header onAddClick={handleAddClick} />

        <Calendar
          currentDate={currentDate}
          events={events}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onEventClick={setShowEventDetail}
          eventTypes={eventTypes}
        />
      </div>

      {showModal && (
        <EventModal
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          eventTypes={eventTypes}
          onSubmit={handleAddEvent}
          onClose={handleModalClose}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          isEditing={!!editingId}
          uploading={uploading}
        />
      )}

      {showEventDetail && (
        <EventDetail
          event={showEventDetail}
          eventTypes={eventTypes}
          onClose={() => setShowEventDetail(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          uploading={uploading}
        />
      )}
    </div>
  );
}

export default App;