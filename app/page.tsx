'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './globals.css';

// TypeScript interfaces
interface Badge {
  src: string;
  alt: string;
}

interface Notification {
  type: 'share' | 'like' | 'calendar';
  message?: string;
}

interface CalendarEvent {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  guests: string;
  reminder: string;
}

export default function Home() {
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [dateTime, setDateTime] = useState({ date: 'Loading...', time: '00:00:00' });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [linkCardsVisible, setLinkCardsVisible] = useState(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);
  
  // Event form refs
  const eventTitleRef = useRef<HTMLInputElement>(null);
  const eventDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const eventDateRef = useRef<HTMLInputElement>(null);
  const eventStartTimeRef = useRef<HTMLInputElement>(null);
  const eventEndTimeRef = useRef<HTMLInputElement>(null);
  const eventLocationRef = useRef<HTMLInputElement>(null);
  const eventGuestsRef = useRef<HTMLInputElement>(null);
  const eventReminderRef = useRef<HTMLSelectElement>(null);

  // Configuration
  const PAGE_ID = 'jesse-roper';
  const badges: Badge[] = [
    { src: "https://github.com/sudo-self/sudo-self/assets/119916323/591566e1-cd9a-445c-9d0b-82ca60b4c37f", alt: "Pull Shark" },
    { src: "https://github.com/sudo-self/sudo-self/assets/119916323/9d692e82-ae9f-4703-9355-74a0e8bebbfe", alt: "Quickdraw" },
    { src: "https://github.com/sudo-self/sudo-self/assets/119916323/5c4f6626-7c67-4277-97a6-b67b77d08953", alt: "Starstruck" },
    { src: "https://github.com/sudo-self/sudo-self/assets/119916323/f135932f-d44f-4bb9-b72a-ac23219112bc", alt: "Yolo" },
    { src: "https://github.com/user-attachments/assets/4962670c-d88b-4bfd-8697-753044e16c33", alt: "Dev.to" },
    { src: "https://github.com/user-attachments/assets/3aa8db8c-ec26-4248-85a2-a147c1b74e06", alt: "Dev.to" },
    { src: "https://github.com/user-attachments/assets/a3a9c3b1-4389-4ccb-a6d7-c48ef81ea222", alt: "Dev.to" },
    { src: "https://pub-c1de1cb456e74d6bbbee111ba9e6c757.r2.dev/Android%20studio.svg", alt: "Android Studio" },
    { src: "https://pub-c1de1cb456e74d6bbbee111ba9e6c757.r2.dev/gdeveloper.svg", alt: "GDE Badge" },
    { src: "https://pub-c1de1cb456e74d6bbbee111ba9e6c757.r2.dev/firebase.svg", alt: "Firebase Badge" },
    { src: "https://pub-c1de1cb456e74d6bbbee111ba9e6c757.r2.dev/Image%205.png", alt: "dev.to" },
    { src: "https://avatars.githubusercontent.com/u/119916323?v=4", alt: "GitHub Profile" },
  ];

  // Theme toggle - FIXED: Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  // Date and time with fetchLikeCount integration
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      };
      const dateString = now.toLocaleDateString('en-US', dateOptions);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeString = `${hours}:${minutes}:${seconds}`;
      setDateTime({ date: dateString, time: timeString });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Link cards animation
  useEffect(() => {
    setLinkCardsVisible(true);
  }, []);

  // Like functionality - FIXED: Added fetch on mount
  const fetchLikeCount = useCallback(async () => {
    setIsLoadingLikes(true);
    try {
      const response = await fetch(`/api/likes/${PAGE_ID}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Handle different response structures
          let likes = 0;
          let hasLiked = false;
          
          if (data.likes !== undefined) {
            likes = data.likes;
          } else if (data.page?.like_count !== undefined) {
            likes = data.page.like_count;
          }
          
          if (data.hasLiked !== undefined) {
            hasLiked = data.hasLiked;
          } else if (data.page?.hasLiked !== undefined) {
            hasLiked = data.page.hasLiked;
          }
          
          setCurrentLikes(likes);
          setIsLiked(hasLiked);
        } else {
          // API returned success: false
          fallbackToLocalStorage();
        }
      } else {
        // HTTP error
        fallbackToLocalStorage();
      }
    } catch (error) {
      // Network error
      fallbackToLocalStorage();
    } finally {
      setIsLoadingLikes(false);
    }
  }, []);

  // FIXED: Fetch like count on component mount
  useEffect(() => {
    fetchLikeCount();
  }, [fetchLikeCount]);

  // Helper function for localStorage fallback
  const fallbackToLocalStorage = () => {
    const savedLikes = localStorage.getItem(`likes-${PAGE_ID}`);
    const savedLiked = localStorage.getItem(`liked-${PAGE_ID}`);
    setCurrentLikes(savedLikes ? parseInt(savedLikes) : 0);
    setIsLiked(savedLiked === 'true');
  };

  const addLike = async () => {
    if (isLiked) return;
    
    // Optimistic update
    setIsLiked(true);
    const newLikes = currentLikes + 1;
    setCurrentLikes(newLikes);
    
    // Show notification
    showNotification({ type: 'like' });
    
    // Save to localStorage as fallback
    localStorage.setItem(`liked-${PAGE_ID}`, 'true');
    localStorage.setItem(`likes-${PAGE_ID}`, newLikes.toString());
    
    // Send to API
    try {
      const response = await fetch(`/api/likes/${PAGE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Update with data from API response
          let apiLikes = newLikes;
          let apiHasLiked = true;
          
          if (data.likes !== undefined) {
            apiLikes = data.likes;
          } else if (data.page?.like_count !== undefined) {
            apiLikes = data.page.like_count;
          }
          
          if (data.hasLiked !== undefined) {
            apiHasLiked = data.hasLiked;
          } else if (data.page?.hasLiked !== undefined) {
            apiHasLiked = data.page.hasLiked;
          }
          
          setCurrentLikes(apiLikes);
          setIsLiked(apiHasLiked);
          
          // Update localStorage with correct value
          localStorage.setItem(`likes-${PAGE_ID}`, apiLikes.toString());
        }
      }
    } catch (error) {
      // Network error - keep localStorage as fallback
      console.error('Error adding like:', error);
    }
  };

  const removeLike = async () => {
    if (!isLiked) return;
    
    // Optimistic update
    setIsLiked(false);
    const newLikes = Math.max(0, currentLikes - 1);
    setCurrentLikes(newLikes);
    
    // Remove from localStorage
    localStorage.removeItem(`liked-${PAGE_ID}`);
    localStorage.setItem(`likes-${PAGE_ID}`, newLikes.toString());
    
    // Send to API
    try {
      const response = await fetch(`/api/likes/${PAGE_ID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Update with data from API response
          let apiLikes = newLikes;
          let apiHasLiked = false;
          
          if (data.likes !== undefined) {
            apiLikes = data.likes;
          } else if (data.page?.like_count !== undefined) {
            apiLikes = data.page.like_count;
          }
          
          if (data.hasLiked !== undefined) {
            apiHasLiked = data.hasLiked;
          } else if (data.page?.hasLiked !== undefined) {
            apiHasLiked = data.page.hasLiked;
          }
          
          setCurrentLikes(apiLikes);
          setIsLiked(apiHasLiked);
          
          // Update localStorage
          if (apiLikes === 0) {
            localStorage.removeItem(`likes-${PAGE_ID}`);
          } else {
            localStorage.setItem(`likes-${PAGE_ID}`, apiLikes.toString());
          }
        } else if (data.error === 'User has not liked this page') {
          // Revert optimistic update if API says user hasn't liked
          setIsLiked(false);
          setCurrentLikes(newLikes);
        }
      }
    } catch (error) {
      console.error('Error removing like:', error);
    }
  };

  // Notification system
  const showNotification = useCallback((notification: Notification) => {
    setNotification(notification);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: 'Jesse Roper - Software Engineer',
      text: 'Check out Jesse Roper\'s professional portfolio and links',
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showNotification({ type: 'share' });
      }
    } catch (err) {
      console.log('Error sharing:', err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        showNotification({ type: 'share' });
      } catch (clipboardErr) {
        alert(`Share this link:\n${window.location.href}`);
      }
    }
  };

  // Calendar functions
  const generateCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      const prevMonthDay = new Date(year, month, 0 - (firstDayIndex - i - 1)).getDate();
      days.push(
        <div key={`prev-${i}`} className="calendar-day other-month">
          {prevMonthDay}
        </div>
      );
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = year === today.getFullYear() && month === today.getMonth() && i === today.getDate();
      const isSelected = year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate();
      
      days.push(
        <div
          key={`current-${i}`}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            setSelectedDate(new Date(year, month, i));
            setShowCalendar(false);
            setShowEventModal(true);
          }}
        >
          {i}
        </div>
      );
    }
    
    // Next month days
    const totalCells = 42;
    const cellsFilled = firstDayIndex + daysInMonth;
    const remainingCells = totalCells - cellsFilled;
    
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div key={`next-${i}`} className="calendar-day other-month">
          {i}
        </div>
      );
    }
    
    return days;
  };

  // Format month-year for calendar header
  const formatMonthYear = (date: Date) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentCalendarDate(today);
    setSelectedDate(today);
  };

  // Event form functions
  const prefillEventForm = () => {
    const now = new Date();
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const endHour = (now.getHours() + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (eventDateRef.current) eventDateRef.current.value = formattedDate;
    if (eventStartTimeRef.current) eventStartTimeRef.current.value = startTime;
    if (eventEndTimeRef.current) eventEndTimeRef.current.value = endTime;
  };

  const getEventData = (): CalendarEvent => {
    return {
      title: eventTitleRef.current?.value || 'Meeting with Jesse Roper',
      description: eventDescriptionRef.current?.value || 'Discuss opportunities.',
      date: eventDateRef.current?.value || selectedDate.toISOString().split('T')[0],
      startTime: eventStartTimeRef.current?.value || '09:00',
      endTime: eventEndTimeRef.current?.value || '10:00',
      location: eventLocationRef.current?.value || '',
      guests: eventGuestsRef.current?.value || '',
      reminder: eventReminderRef.current?.value || '10'
    };
  };

  const generateICS = () => {
    const event = getEventData();
    
    const startDateTime = `${event.date.replace(/-/g, '')}T${event.startTime.replace(/:/g, '')}00`;
    const endDateTime = `${event.date.replace(/-/g, '')}T${event.endTime.replace(/:/g, '')}00`;
    const eventId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jesse Roper//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventId}@links.jessejesse.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
    ];
    
    if (parseInt(event.reminder) > 0) {
      icsContent.push(
        'BEGIN:VALARM',
        `TRIGGER:-PT${event.reminder}M`,
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${event.title}`,
        'END:VALARM'
      );
    }
    
    icsContent.push('END:VEVENT', 'END:VCALENDAR');
    
    return icsContent.join('\n');
  };

  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-${selectedDate.toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification({ type: 'calendar', message: 'Event downloaded as .ics file!' });
  };

  const addToCalendar = () => {
    const event = getEventData();
    
    // Create Google Calendar URL
    const startDateTime = `${event.date}T${event.startTime}:00`;
    const endDateTime = `${event.date}T${event.endTime}:00`;
    
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('details', event.description);
    googleCalendarUrl.searchParams.set('dates', `${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}`);
    if (event.location) {
      googleCalendarUrl.searchParams.set('location', event.location);
    }
    
    // Open in new tab
    window.open(googleCalendarUrl.toString(), '_blank');
    
    // Also offer ICS download as fallback
    downloadICS();
  };

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCalendar(false);
        setShowEventModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Initialize event form when modal opens
  useEffect(() => {
    if (showEventModal) {
      prefillEventForm();
    }
  }, [showEventModal]);

  return (
    <>
      {/* Top Controls */}
      <div className="top-left-controls">
        <div className="theme-toggle" id="themeToggle" onClick={toggleTheme}>
          <div className="toggle-circle">
            <i className={isDarkMode ? "fas fa-moon" : "fas fa-sun"}></i>
          </div>
        </div>

        {/* Like Button */}
        <div
          className={`like-button ${isLiked ? 'liked' : ''} ${currentLikes > 0 ? 'has-likes' : ''}`}
          id="likeButton"
          title={isLiked ? "Unlike this page" : "Like this page"}
          onClick={isLiked ? removeLike : addLike}
          style={{ position: 'relative' }}
        >
          <i className={isLiked ? "fas fa-heart" : "far fa-heart"}></i>
          {currentLikes > 0 && (
            <span className="like-count" id="likeCount">{currentLikes}</span>
          )}
          {isLoadingLikes && (
            <span className="like-count" style={{ background: '#64748b', fontSize: '8px' }}>
              <i className="fas fa-spinner fa-spin"></i>
            </span>
          )}
        </div>

        <div className="share-button" id="shareButton" title="Share this page" onClick={handleShare}>
          <i className="fas fa-share-alt"></i>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`${notification.type}-notification show`}>
          <i className={`fas fa-${notification.type === 'share' ? 'check-circle' : notification.type === 'like' ? 'heart' : 'calendar-check'}`}></i>
          <span>
            {notification.type === 'share' ? 'Link copied to clipboard!' :
             notification.type === 'like' ? 'Thank you for the like!' :
             notification.message || 'Event added to calendar!'}
          </span>
        </div>
      )}

      {/* DateTime Display */}
      <div
        className="datetime-display"
        id="datetimeDisplay"
        onClick={() => setShowCalendar(true)}
        title="Click to open calendar"
      >
        <span className="date" id="dateDisplay">{dateTime.date}</span>
        <span className="time" id="timeDisplay">{dateTime.time}</span>
      </div>
      <br />

      {/* Calendar Modal */}
      {showCalendar && (
        <>
          <div className="modal-overlay show" onClick={() => setShowCalendar(false)}></div>
          <div className="calendar-modal show" id="calendarModal">
            <div className="calendar-header">
              <button className="calendar-nav" id="prevMonth" onClick={goToPreviousMonth} aria-label="Previous month">
                <i className="fas fa-chevron-left"></i>
              </button>
              <h3 id="currentMonthYear">{formatMonthYear(currentCalendarDate)}</h3>
              <button className="calendar-nav" id="nextMonth" onClick={goToNextMonth} aria-label="Next month">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className="calendar-weekdays">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="calendar-days" id="calendarDays">
              {generateCalendarDays()}
            </div>

            <div className="calendar-footer">
              <button className="calendar-btn" id="todayBtn" onClick={goToToday}>
                Today
              </button>
              <button className="calendar-btn primary" id="createEventBtn" onClick={() => {
                setShowCalendar(false);
                setShowEventModal(true);
              }}>
                <i className="fas fa-calendar-plus"></i> Create Event
              </button>
              <button className="calendar-btn" id="closeCalendar" onClick={() => setShowCalendar(false)} aria-label="Close calendar">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <>
          <div className="modal-overlay show" onClick={() => setShowEventModal(false)}></div>
          <div className="event-modal show" id="eventModal">
            <div className="event-header">
              <h3>Create Calendar Event</h3>
              <button className="close-event" id="closeEvent" onClick={() => setShowEventModal(false)} aria-label="Close event modal">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="event-form">
              <div className="form-group">
                <label htmlFor="eventTitle">Event Title</label>
                <input
                  type="text"
                  id="eventTitle"
                  placeholder="Meeting with Jesse Roper"
                  defaultValue="Meeting with Jesse Roper"
                  ref={eventTitleRef}
                  aria-label="Event title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventDescription">Description</label>
                <textarea
                  id="eventDescription"
                  rows={3}
                  placeholder="Discuss opportunities..."
                  defaultValue="Discuss opportunities."
                  ref={eventDescriptionRef}
                  aria-label="Event description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eventDate">Date</label>
                  <input
                    type="date"
                    id="eventDate"
                    ref={eventDateRef}
                    aria-label="Event date"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="eventStartTime">Start Time</label>
                  <input
                    type="time"
                    id="eventStartTime"
                    ref={eventStartTimeRef}
                    aria-label="Event start time"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="eventEndTime">End Time</label>
                  <input
                    type="time"
                    id="eventEndTime"
                    ref={eventEndTimeRef}
                    aria-label="Event end time"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="eventLocation">Location</label>
                <input
                  type="text"
                  id="eventLocation"
                  placeholder="Zoom / Google Meet / In-person"
                  ref={eventLocationRef}
                  aria-label="Event location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventGuests">Guests (Optional)</label>
                <input
                  type="email"
                  id="eventGuests"
                  placeholder="email addresses separated by commas"
                  ref={eventGuestsRef}
                  aria-label="Event guests"
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventReminder">Reminder</label>
                <select id="eventReminder" defaultValue="10" ref={eventReminderRef} aria-label="Event reminder">
                  <option value="0">None</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                </select>
              </div>
            </div>

            <div className="event-footer">
              <button className="event-btn" id="downloadICS" onClick={downloadICS} aria-label="Download ICS file">
                <i className="fas fa-download"></i> Download .ics
              </button>
              <button className="event-btn primary" id="addToCalendar" onClick={addToCalendar} aria-label="Add to Google Calendar">
                <i className="fas fa-calendar-plus"></i> Add to Calendar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="container">
        <header>
          <div className="profile-pic">
            <img
              src="/apple-touch-icon.png"
              alt="Jesse Roper Profile Photo"
              loading="lazy"
            />
          </div>

          <h1>Jesse Roper</h1>
          <br />
          <div className="code-badge">Software Engineer</div>
          <br />

          <br />
          <div className="education">
            <i className="fas fa-graduation-cap"></i>
            B.S. Information Technology, CTU
          </div>
        </header>

        <div className="content">
          <div className="links-section">
            <h2 className="section-title"><i className="fas fa-link"></i>Links</h2>

            <a
              href="https://x.com/lightfighter719"
              className="link-card"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                opacity: linkCardsVisible ? 1 : 0,
                transform: linkCardsVisible ? 'translateY(0)' : 'translateY(20px)'
              }}
              aria-label="Visit Jesse's X (Twitter) profile"
            >
              <div className="link-icon">
                <i className="fa-solid fa-x"></i>
              </div>
              <div className="link-text">
                <div className="link-title">@Lightfighter719</div>
                <div className="link-description">Find me on X</div>
              </div>
              <div className="link-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </a>

            <a
              href="https://linkedin.com/in/jesse-roper"
              className="link-card"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                opacity: linkCardsVisible ? 1 : 0,
                transform: linkCardsVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '0.1s'
              }}
              aria-label="Visit Jesse's LinkedIn profile"
            >
              <div className="link-icon">
                <i className="fab fa-linkedin-in"></i>
              </div>
              <div className="link-text">
                <div className="link-title">LinkedIn Profile</div>
                <div className="link-description">Professional Networking</div>
              </div>
              <div className="link-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </a>

            <a
              href="https://github.com/sudo-self"
              className="link-card"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                opacity: linkCardsVisible ? 1 : 0,
                transform: linkCardsVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '0.2s'
              }}
              aria-label="Visit Jesse's GitHub profile"
            >
              <div className="link-icon">
                <i className="fab fa-github"></i>
              </div>
              <div className="link-text">
                <div className="link-title">GitHub Portfolio</div>
                <div className="link-description">Software projects</div>
              </div>
              <div className="link-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </a>

            <a
              href="mailto:jesse@jessejesse.com"
              className="link-card"
              style={{
                opacity: linkCardsVisible ? 1 : 0,
                transform: linkCardsVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '0.3s'
              }}
              aria-label="Email Jesse"
            >
              <div className="link-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="link-text">
                <div className="link-title">Contact Me</div>
                <div className="link-description">Email for inquiries or opportunities</div>
              </div>
              <div className="link-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </a>
          </div>
        </div>

        <div className="education">
          <i className="fas fa-globe"></i>&nbsp;
          Developer Badges
        </div>

        <footer>
          <div className="developer-badges-row" id="developerBadgesRow">
            {badges.map((badge, index) => (
              <div key={index} className="badge-item" title={badge.alt}>
                <img
                  src={badge.src}
                  alt={badge.alt}
                  title={badge.alt}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuN2VtIj5Ob3QgRm91bmQ8L3RleHQ+PC9zdmc+';
                    target.alt = 'Image not available';
                  }}
                />
                <div className="badge-tooltip">{badge.alt}</div>
              </div>
            ))}
          </div>

          <div className="footer-likes">
            <span id="footerLikeCount">{currentLikes}</span> visitors liked this page
          </div>
        </footer>
      </div>
    </>
  );
}
