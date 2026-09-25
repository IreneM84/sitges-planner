import { useEffect, useState } from 'react'
import { schedule } from './data/sitges-2026-schedule'
import './App.css'

const days = [
  { day: 8, name: 'JUE', fullName: 'Jueves' },
  { day: 9, name: 'VIE', fullName: 'Viernes' },
  { day: 10, name: 'SÁB', fullName: 'Sábado' },
  { day: 11, name: 'DOM', fullName: 'Domingo' },
  { day: 12, name: 'LUN', fullName: 'Lunes' },
  { day: 13, name: 'MAR', fullName: 'Martes' },
  { day: 14, name: 'MIÉ', fullName: 'Miércoles' },
  { day: 15, name: 'JUE', fullName: 'Jueves' },
  { day: 16, name: 'VIE', fullName: 'Viernes' },
  { day: 17, name: 'SÁB', fullName: 'Sábado' },
  { day: 18, name: 'DOM', fullName: 'Domingo' },
]
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function durationToMinutes(duration) {
  return Number.parseInt(duration, 10) || 0
}

function getSessionEnd(session) {
  return (
    timeToMinutes(session.time) +
    durationToMinutes(session.duration)
  )
}
const FESTIVAL_YEAR = 2026
const FESTIVAL_MONTH = 9

function getSessionStartDate(day, session) {
  const [hours, minutes] = session.time
    .split(':')
    .map(Number)

  return new Date(
    FESTIVAL_YEAR,
    FESTIVAL_MONTH,
    day,
    hours,
    minutes
  )
}

function getSessionEndDate(day, session) {
  return new Date(
    getSessionStartDate(day, session).getTime() +
      durationToMinutes(session.duration) * 60000
  )
}

function formatCountdown(targetDate, currentDate) {
  const difference = targetDate.getTime() - currentDate.getTime()

  if (difference <= 0) {
    return 'Comienza ahora'
  }

  const totalMinutes = Math.floor(
    difference / 60000
  )

  const days = Math.floor(
    totalMinutes / 1440
  )

  const hours = Math.floor(
    (totalMinutes % 1440) / 60
  )

  const minutes = totalMinutes % 60

  if (days > 0) {
    return `Faltan ${days} días, ${hours} h y ${minutes} min`
  }

  if (hours > 0) {
    return `Faltan ${hours} h y ${minutes} min`
  }

  return `Faltan ${minutes} min`
}

function sessionsOverlap(sessionA, sessionB) {
  const startA = timeToMinutes(sessionA.time)
  const endA = getSessionEnd(sessionA)

  const startB = timeToMinutes(sessionB.time)
  const endB = getSessionEnd(sessionB)

  return startA < endB && startB < endA
}

function getConflictingSessionIds(sessions) {
  const conflictingIds = new Set()

  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {

      if (sessionsOverlap(sessions[i], sessions[j])) {
        conflictingIds.add(sessions[i].id)
        conflictingIds.add(sessions[j].id)
      }

    }
  }

  return conflictingIds
}

function App() {
  const [selectedDay, setSelectedDay] = useState(8)

 const [currentView, setCurrentView] = useState(() => {
  const savedView = localStorage.getItem(
    'sitges-current-view'
  )

  return savedView || 'schedule'
})


const [selectedSession, setSelectedSession] = useState(null)
const [searchOpen, setSearchOpen] = useState(false)
const [searchTerm, setSearchTerm] = useState('')

useEffect(() => {
  localStorage.setItem(
    'sitges-current-view',
    currentView
  )
}, [currentView])

 const [currentTime, setCurrentTime] = useState(
  new Date()
)
  useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date())
  }, 60000)

  return () => clearInterval(timer)
}, [])

  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('sitges-favorites')

    return savedFavorites
      ? JSON.parse(savedFavorites)
      : []
  })

  const sessions = schedule[selectedDay] || []

  const allSessions = days.flatMap((day) =>
  (schedule[day.day] || []).map((session) => ({
    session,
    day: day.day,
  }))
)

const searchResults = allSessions.filter(
  ({ session }) => {
    const term = searchTerm
      .trim()
      .toLowerCase()

  if (term.length < 2) {
    return false
  }

    return (
      session.title.toLowerCase().includes(term) ||
      session.section.toLowerCase().includes(term) ||
      session.venue.toLowerCase().includes(term)
    )
  }
)

const festivalStart = new Date(
  FESTIVAL_YEAR,
  FESTIVAL_MONTH,
  8,
  0,
  0
)

const festivalEnd = new Date(
  FESTIVAL_YEAR,
  FESTIVAL_MONTH,
  18,
  23,
  59,
  59
)

const upcomingSessions = allSessions
  .filter(({ day, session }) => {
    return getSessionStartDate(day, session) > currentTime
  })
  .sort(
    (a, b) =>
      getSessionStartDate(a.day, a.session) -
      getSessionStartDate(b.day, b.session)
  )

const currentSessions = allSessions.filter(
  ({ day, session }) => {
    const start = getSessionStartDate(day, session)
    const end = getSessionEndDate(day, session)

    return (
      currentTime >= start &&
      currentTime < end
    )
  }
)

const isBeforeFestival = currentTime < festivalStart

const isFestivalActive =
  currentTime >= festivalStart &&
  currentTime <= festivalEnd

const nextSession =
  upcomingSessions.length > 0
    ? upcomingSessions[0]
    : null

    const nextSessionCountdown = nextSession
  ? formatCountdown(
      getSessionStartDate(
        nextSession.day,
        nextSession.session
      ),
      currentTime
    )
  : null

const nextNowSessions = upcomingSessions.slice(0, 3)

const nowSessions = [
  ...currentSessions,
  ...nextNowSessions,
]

const selectedDayInfo = days.find(
    (day) => day.day === selectedDay
  )

const favoriteSessions = days
  .map((day) => {
    const sessions = (schedule[day.day] || []).filter(
      (session) => favorites.includes(session.id)
    )

    return {
      ...day,
      sessions,
      conflictingIds: getConflictingSessionIds(sessions),
    }
  })
  .filter((day) => day.sessions.length > 0)

  const openSession = (session, day) => {
  setSelectedSession({
    session,
    day,
  })
}
  const toggleFavorite = (sessionId) => {
    setFavorites((currentFavorites) => {
      const isFavorite = currentFavorites.includes(sessionId)

      const updatedFavorites = isFavorite
        ? currentFavorites.filter((id) => id !== sessionId)
        : [...currentFavorites, sessionId]

      localStorage.setItem(
        'sitges-favorites',
        JSON.stringify(updatedFavorites)
      )

      return updatedFavorites
    })
  }

  const openFavorite = (day) => {
    setSelectedDay(day)
    setCurrentView('schedule')
  }

 const renderSession = (
  session,
  day,
  conflictingIds = new Set()
) => {
    const isFavorite = favorites.includes(session.id)
    const hasConflict = conflictingIds.has(session.id)
 

    return (
      <div
        className="timeline-item"
        key={session.id}
      >
        <div className="timeline-time">
          {session.time}
        </div>

        <div className="timeline-track">
         <span
  className={`timeline-dot ${
    hasConflict ? 'has-conflict' : ''
  }`}
/>
        </div>

<article
  className={`session-card ${
    session.featured ? 'featured' : ''
  } ${
    hasConflict ? 'has-conflict' : ''
  }`}

onClick={() => {
  openSession(session, day)
}}
        >
          
<div
  className={`session-image ${session.image}`}
  style={{
    backgroundImage: `url(${session.poster})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  <span />
</div>

         <div className="session-details">
  <span className="session-section">
    {session.section}
  </span>

  <h2>
    {session.title}
  </h2>

        {session.filmTitles?.length > 1 && (
          <ul className="session-film-list">
            {session.filmTitles.map((filmTitle) => (
              <li key={filmTitle}>
                {filmTitle}
              </li>
            ))}
          </ul>
        )}

        <div className="session-meta">
          <span>
            ◉ {session.venue}
          </span>

          <span className="meta-separator">
            |
          </span>

          <span>
            ◷ {session.duration}
          </span>
        </div>
      </div>

          <button
            className={`favorite-button ${
              isFavorite ? 'active' : ''
            }`}
            aria-label={
              isFavorite
                ? 'Quitar de favoritos'
                : 'Añadir a favoritos'
            }
            onClick={(event) => {
              event.stopPropagation()
              toggleFavorite(session.id)
            }}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </article>
      </div>
    )
  }

  return (
    <div className="app">

      <header className="top-header">

        <div className="brand">

          <div className="brand-symbol">♠</div>

          <div className="brand-text">

            <div className="brand-name">
              SITGES <span>59 FESTIVAL</span>
            </div>

            <div className="brand-description">
              FESTIVAL INTERNACIONAL DE CINEMA FANTÀSTIC DE CATALUNYA
            </div>

          </div>

        </div>

        <div className="header-actions">

          <button
            className="header-icon"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            ⌕
          </button>

          <button
            className="header-icon"
            aria-label="Favoritos"
            onClick={() => setCurrentView('favorites')}
          >
            ★
          </button>

        </div>

      </header>

      {searchOpen && (
  <section className="search-panel">
    <div className="search-box">
      <span className="search-icon">
        ⌕
      </span>

      <input
        type="text"
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(event.target.value)
        }
        placeholder="Buscar películas, secciones o salas..."
        autoFocus
      />

      <button
        className="search-close"
        aria-label="Cerrar búsqueda"
        onClick={() => {
          setSearchOpen(false)
          setSearchTerm('')
        }}
      >
        ×
      </button>
    </div>
    {searchTerm.trim().length >= 2 && (
      <div className="search-results">
        {searchResults.length === 0 ? (
          <p className="search-empty">
            No se han encontrado sesiones.
          </p>
        ) : (

          searchResults.map(({ session, day }) => {
            const dayInfo = days.find(
              (item) => item.day === day
            )

            return (
              <div
                className="search-result"
                key={session.id}
                onClick={() => {
                  setSelectedSession({
                    session,
                    day,
                  })
                  setSearchOpen(false)
                  setSearchTerm('')
                }}
              >
                <div className="search-result-date">
                  <strong>
                    {dayInfo?.fullName} {day} octubre
                  </strong>

                  <span>
                    {session.time}
                  </span>
                </div>

                <div className="search-result-info">
                  <strong>
                    {session.title}
                  </strong>

                  <span>
                    {session.section} · {session.venue}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    )}
  </section>
)}

      <main className="main">

        {currentView === 'schedule' && (
          <>
            <section className="program-header">

              <div>

                <span className="section-label">
                  PROGRAMACIÓN
                </span>

                <h1>
                  {selectedDayInfo.fullName} {selectedDay} octubre
                </h1>

              </div>

              <button className="today-button">
                HOY
              </button>

            </section>

            <section className="day-selector">

              {days.map((day) => (
                <button
                  key={day.day}
                  className={`day ${
                    selectedDay === day.day
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setSelectedDay(day.day)}
                >
                  <strong>{day.day}</strong>
                  <span>{day.name}</span>
                </button>
              ))}

            </section>

            <section className="schedule">

              {sessions.map((session) =>
                renderSession(session, selectedDay)
              )}

              {sessions.length === 0 && (
                <div className="empty-state">
                  <span>✦</span>

                  <h2>
                    Sin programación
                  </h2>

                  <p>
                    Todavía no hay sesiones disponibles
                    para este día.
                  </p>
                </div>
              )}

            </section>
          </>
        )}

{currentView === 'now' && (
  <>
    <section className="program-header">
      <div>
        <span className="section-label">
          AHORA
        </span>

        <h1>
          {isBeforeFestival
            ? 'El festival está a punto de empezar'
            : 'Lo que está pasando'}
        </h1>
      </div>
    </section>

    {isBeforeFestival && nextSession && (
      <>
        <section className="now-next">
          <span className="now-label">
            PRÓXIMA SESIÓN
          </span>

          <strong className="now-countdown">
            {nextSessionCountdown}
          </strong>

          <p>
            {days.find(
              (day) => day.day === nextSession.day
            )?.fullName}{' '}
            {nextSession.day} octubre ·{' '}
            {nextSession.session.time}
          </p>
        </section>

        <section className="schedule">
          {renderSession(
            nextSession.session,
            nextSession.day
          )}
        </section>
      </>
    )}

    {isFestivalActive && (
      <section className="schedule">
        {currentSessions.length > 0 && (
          <div className="now-section-label">
            EN CURSO
          </div>
        )}

        {currentSessions.map(
          ({ session, day }) =>
            renderSession(
              session,
              day,
             )
        )}

        {nextNowSessions.length > 0 && (
          <div className="now-section-label">
            SIGUIENTES
          </div>
        )}

{nextNowSessions.map(
  ({ session, day }, index) => {
    const previousSession =
      nextNowSessions[index - 1]

    const showDay =
      index === 0 ||
      previousSession.day !== day

    const dayInfo = days.find(
      (item) => item.day === day
    )

    return (
      <div key={session.id}>
        {showDay && (
          <div className="now-day-label">
            {dayInfo?.fullName} {day} octubre
          </div>
        )}

        {renderSession(
          session,
          day
        )}
      </div>
    )
  }
)}
      </section>
    )}
  </>
)}
        {currentView === 'favorites' && (
          <>
<section className="favorites-header">

  <span className="section-label">
    MI FESTIVAL
  </span>

  <div className="favorites-title-row">

    <h1>
      Tus favoritos
    </h1>

    <span className="favorites-total">
      {favorites.length === 1
        ? '1 sesión guardada'
        : `${favorites.length} sesiones guardadas`}
    </span>

  </div>

</section>

            {favoriteSessions.length === 0 && (
              <div className="empty-state">

                <h2>
                  Tu festival empieza aquí
                </h2>

                <p>
                  Marca películas con ☆ para crear
                  tu agenda personal.
                </p>

                <button
                  className="empty-action"
                  onClick={() =>
                    setCurrentView('schedule')
                  }
                >
                  VER PROGRAMACIÓN
                </button>

              </div>
            )}

            {favoriteSessions.map((day) => (
              <section
                className="favorite-day"
                key={day.day}
              >

                <div className="favorite-day-header">

                  <div className="favorite-day-title">

                    <h2>
                      {day.fullName} {day.day} octubre
                    </h2>

                    {day.conflictingIds.size > 0 && (
                      <span className="conflict-summary">
                        Hay sesiones que se solapan
                      </span>
                    )}

                  </div>

                  <span className="favorite-count">
                    {day.sessions.length}
                  </span>

                </div>

                <div className="schedule">
              {day.sessions.map((session) =>
                renderSession(
                  session,
                  day.day,
                  day.conflictingIds
                )
              )}
                </div>

              </section>
            ))}

          </>
        )}

      </main>

      {selectedSession && (
        <div
          className="session-detail-overlay"
          onClick={() => setSelectedSession(null)}
        >
          <article
            className="session-detail"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="session-detail-close"
              aria-label="Cerrar"
              onClick={() => setSelectedSession(null)}
            >
              ×
            </button>

<div
  className={`session-detail-image ${selectedSession.session.image}`}
  style={{
    backgroundImage: `url(${selectedSession.session.poster})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  <span />
</div>

            <div className="session-detail-content">
              <span className="session-section">
                {selectedSession.session.section}
              </span>

              <h2>
                {selectedSession.session.title}
              </h2>

            <div className="session-detail-date">
              {days.find(
                (day) => day.day === selectedSession.day
              )?.fullName}{' '}
              {selectedSession.day} octubre ·{' '}
              {selectedSession.session.time}
            </div>

                {selectedSession.session.filmTitles?.length > 1 ? (
                  <div className="session-detail-films">
                    <span className="session-detail-films-label">
                      PELÍCULAS DE LA SESIÓN
                    </span>

                    <ul>
                      {selectedSession.session.filmTitles.map(
                        (filmTitle) => (
                          <li key={filmTitle}>
                            {filmTitle}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : (
                  <>
                    <div className="session-detail-extra">
                      <span>
                        🎥 {selectedSession.session.director}
                      </span>

                      <span>
                        🌍 {selectedSession.session.country}
                      </span>

                      <span>
                        📅 {selectedSession.session.year}
                      </span>

                      <span>
                        🎭 {selectedSession.session.genre}
                      </span>
                    </div>

                    <p className="session-detail-synopsis">
                      {selectedSession.session.synopsis}
                    </p>
                  </>
                )}

                <div className="session-detail-meta">
                  <span>
                    ◉ {selectedSession.session.venue}
                  </span>

                  <span>
                    ◷ {selectedSession.session.duration}
                  </span>
                </div>

              <button
                className={`session-detail-favorite ${
                  favorites.includes(
                    selectedSession.session.id
                  )
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  toggleFavorite(
                    selectedSession.session.id
                  )
                }
              >
                {favorites.includes(
                  selectedSession.session.id
                )
                  ? '★ Quitar de favoritos'
                  : '☆ Añadir a favoritos'}
              </button>
            </div>
          </article>
        </div>
      )}
      <nav className="bottom-nav">

        <button
          className={`nav-item ${
            currentView === 'schedule'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentView('schedule')
          }
        >
          <span className="nav-icon">
            ▣
          </span>

          <strong>
            Programa
          </strong>
        </button>

        <button
          className={`nav-item ${
            currentView === 'favorites'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentView('favorites')
          }
        >
          <span className="nav-icon">
            ★
          </span>

          <strong>
            Favoritos
          </strong>
        </button>

        <button
  className={`nav-item ${
    currentView === 'now'
      ? 'active'
      : ''
  }`}
  onClick={() =>
    setCurrentView('now')
  }
>
  <span className="nav-icon">
    ◉
  </span>

  <strong>
    Ahora
  </strong>
</button>

      </nav>

    </div>
  )
}

export default App