// Конфигурация API OMDB
const API_KEY = 'bb57df9e';                       
const BASE_URL = 'https://www.omdbapi.com/';

// Хранилище в LocalStorage (Буду смотреть и Рецензии)
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let reviews = JSON.parse(localStorage.getItem('reviews')) || [];

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMainPage();
    initSearch();
    initReviewForm();
    updateWatchlistUI();
});

// Инициализация кликов навигации
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const logoBtn = document.getElementById('logo-btn');
    const navWatchlistBtn = document.getElementById('nav-watchlist-btn');
    const profileBtn = document.getElementById('nav-profile-btn');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            switchPage(target);
        });
    });

    if (logoBtn) logoBtn.addEventListener('click', () => switchPage('main-page'));
    if (navWatchlistBtn) navWatchlistBtn.addEventListener('click', () => switchPage('watchlist-page'));
    if (profileBtn) profileBtn.addEventListener('click', () => switchPage('watchlist-page'));

    // Закрытие модального окна
    const closeTrailerBtn = document.getElementById('close-trailer');
    if (closeTrailerBtn) {
        closeTrailerBtn.addEventListener('click', closeModal);
    }
}

// Переключение страниц (Главная / Личный кабинет)
function switchPage(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    const targetLink = document.querySelector(`.nav-link[data-target="${pageId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
          
    if (pageId === 'watchlist-page') {
        updateWatchlistUI();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Загрузка данных для главной страницы через OMDB
async function initMainPage() {
    try {
        // 1. Загружаем фильм для Главного баннера (например, Интерстеллар)
        const heroMovie = await fetchMovieByTitle('Interstellar');
        if (heroMovie) renderHero(heroMovie);

        // 2. Загружаем фильмы для блока "Смотрят сегодня"
        const feat1 = await fetchMovieByTitle('Succession');
        const feat2 = await fetchMovieByTitle('Jurassic World');
        const featuredMovies = [feat1, feat2].filter(m => m !== null);
        renderFeaturedGrid(featuredMovies);

        // 3. Загружаем фильм для Широкой карточки
        const wideMovie = await fetchMovieByTitle('Dune: Part Two');
        if (wideMovie) renderWideCard(wideMovie);

        // 4. Загружаем новинки/постеры недели (поиск по ключевому слову 2024-2025 годов)
        const textSearchRes = await fetch(`${BASE_URL}/?apikey=${API_KEY}&s=marvel&type=movie`);
        const searchData = await textSearchRes.json();
        if (searchData.Search) {
            // Берем первые 3 фильма для сетки новинок
            renderPostersGrid(searchData.Search.slice(0, 3));
        }

    } catch (error) {
        console.error("Ошибка загрузки данных из OMDB API:", error);
    }
}

// Вспомогательная функция получения полных данных о фильме по названию
async function fetchMovieByTitle(title) {
    try {
        const res = await fetch(`${BASE_URL}/?apikey=${API_KEY}&t=${encodeURIComponent(title)}&plot=short`);
        const data = await res.json();
        return data.Response === "True" ? data : null;
    } catch (err) {
        return null;
    }
}

// Рендер Херо-баннера
function renderHero(movie) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const poster = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/1200x700?text=No+Image';
    
    heroSection.innerHTML = `
        <div class="hero-film-bg" style="background-image: url('${poster}'); background-size: cover; background-position: center 20%;"></div>
        <div class="hero-bg"></div>
        <div class="hero-content page">
            <div class="hero-eyebrow">Выбор редакции · Популярное</div>
            <h1 class="hero-title">${movie.Title}</h1>
            <div class="hero-meta">
                <span class="hero-rating">${movie.imdbRating}</span>
                <div class="hero-sep"></div>
                <span class="hero-info">${movie.Year} · ${movie.Runtime}</span>
                <div class="hero-sep"></div>
                <span class="hero-genre">${movie.Genre.split(',')[0]}</span>
            </div>
            <div class="hero-actions">
                <button class="btn-play" onclick="openOMDBModal('${escapeHtml(movie.Title)}', '${movie.imdbRating}', '${escapeHtml(movie.Plot)}')">
                    Подробнее
                </button>
                <button class="btn-add" onclick="toggleWatchlist('${movie.imdbID}', '${escapeHtml(movie.Title)}', '${movie.Poster}', '${movie.Year}')">+</button>
            </div>
        </div>
    `;
}

// Рендер Сетки популярных фильмов (Featured Grid)
function renderFeaturedGrid(movies) {
    const grid = document.querySelector('.featured-grid');
    if (!grid) return;

    grid.innerHTML = movies.map(movie => {
        const poster = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/600x300?text=No+Image';
        return `
            <div class="featured-card">
                <div class="fc-thumb" style="background-image: url('${poster}'); background-size: cover; background-position: center;"></div>
                <div class="fc-gradient"></div><div class="fc-overlay"></div>
                <div class="fc-play-btn" onclick="openOMDBModal('${escapeHtml(movie.Title)}', '${movie.imdbRating}', '${escapeHtml(movie.Plot)}')">
                    <span style="color:black; font-weight:bold; font-size:12px;">INFO</span>
                </div>
                <div class="fc-content">
                    <div class="fc-badge">${movie.Type === 'series' ? 'Сериал' : 'Фильм'}</div>
                    <div class="fc-title">${movie.Title}</div>
                    <div class="fc-meta">
                        <span class="fc-rating">${movie.imdbRating}</span>
                        <span>${movie.Year}</span>
                        <button class="inline-fav-btn" onclick="toggleWatchlist('${movie.imdbID}', '${escapeHtml(movie.Title)}', '${movie.Poster}', '${movie.Year}')">+</button>
                    </div>
                    <div class="fc-desc">${movie.Plot !== 'N/A' ? movie.Plot.substring(0, 100) + '...' : 'Описание отсутствует.'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Рендер Широкой карточки (Wide Card)
function renderWideCard(movie) {
    const wideCard = document.querySelector('.wide-card');
    if (!wideCard) return;

    const poster = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/1000x400?text=No+Image';

    wideCard.innerHTML = `
        <div class="wc-thumb" style="background-image: url('${poster}'); background-size: cover; background-position: center 30%;"></div>
        <div class="wc-gradient"></div>
        <div class="wc-content">
            <div class="wc-eyebrow">Редакция советует · Хит</div>
            <div class="wc-title">${movie.Title}</div>
            <div class="wc-stats">
                <div class="wc-score">${movie.imdbRating}</div>
                <div class="wc-imdb">Голосов: <b>${movie.imdbVotes}</b></div>
            </div>
            <div class="wc-meta">${movie.Year} · ${movie.Genre}</div>
            <div class="wc-desc">${movie.Plot !== 'N/A' ? movie.Plot.substring(0, 160) + '...' : 'Описание отсутствует.'}</div>
            <div class="wc-actions">
                <button class="btn-play" onclick="openOMDBModal('${escapeHtml(movie.Title)}', '${movie.imdbRating}', '${escapeHtml(movie.Plot)}')">
                    О фильме
                </button>
                <button class="btn-info" onclick="toggleWatchlist('${movie.imdbID}', '${escapeHtml(movie.Title)}', '${movie.Poster}', '${movie.Year}')">Буду смотреть</button>
            </div>
        </div>
    `;
}

// Рендер обычных постеров новинок (Posters Grid)
function renderPostersGrid(movies) {
    const grid = document.querySelector('.posters-grid-layout');
    if (!grid) return;

    grid.innerHTML = movies.map(movie => {
        const poster = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
        return `
            <div class="poster-card-custom">
                <div class="pcc-wrap">
                    <img src="${poster}" alt="${movie.Title}">
                    <div class="pcc-badge high">IDDb</div>
                    <button class="pcc-add" onclick="toggleWatchlist('${movie.imdbID}', '${escapeHtml(movie.Title)}', '${movie.Poster}', '${movie.Year}')">+</button>
                    <div class="pcc-play" onclick="openOMDBModal('${escapeHtml(movie.Title)}', 'N/A', 'Год выпуска: ${movie.Year}')">ℹ</div>
                </div>
                <div class="pcc-title">${movie.Title}</div>
                <div class="pcc-sub">${movie.Year} · Кино</div>
            </div>
        `;
    }).join('');
}

// Динамический поиск по OMDB API
function initSearch() {
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results-box');

    if (!input || !resultsContainer) return;

    input.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) { // OMDB требует минимум 3 символа для поиска
            resultsContainer.classList.remove('active');
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.Response === "True" && data.Search) {
                resultsContainer.innerHTML = data.Search.slice(0, 5).map(movie => {
                    const img = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/35x50?text=No';
                    return `
                        <div class="search-item" onclick="openOMDBModal('${escapeHtml(movie.Title)}', 'OMDB', 'Тип: ${movie.Type}. Год: ${movie.Year}')">
                            <img src="${img}" alt="">
                            <div>
                                <h5>${movie.Title}</h5>
                                <p>${movie.Year} • ${movie.Type}</p>
                            </div>
                        </div>
                    `;
                }).join('');
                resultsContainer.classList.add('active');
            } else {
                resultsContainer.innerHTML = '<div class="empty-msg">Ничего не найдено</div>';
                resultsContainer.classList.add('active');
            }
        } catch (err) {
            console.error(err);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search-box')) {
            resultsContainer.classList.remove('active');
        }
    });
}

// Замена логики трейлеров YouTube на Информационное модальное окно (Так как OMDB не возвращает трейлеры)
function openOMDBModal(title, rating, plot) {
    const modal = document.getElementById('trailer-modal');
    const container = document.querySelector('.video-container');
    
    if (!modal || !container) return;

    // Временно превращаем контейнер для видео в красивую карточку описания
    container.innerHTML = `
        <div style="padding: 30px; color: #fff; background: #1a1a1a; font-family: sans-serif;">
            <h2 style="font-family: 'Barlow Condensed', sans-serif; font-size: 32px; color: #c9a84c; margin-bottom: 10px;">${title}</h2>
            <p style="margin-bottom: 15px; font-weight: bold;">Рейтинг IMDb: ★ ${rating}</p>
            <p style="line-height: 1.6; color: #e8e8e8;">${plot}</p>
        </div>
    `;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('trailer-modal');
    if (modal) modal.classList.remove('active');
}

// УПРАВЛЕНИЕ СПИСКОМ "БУДУ СМОТРЕТЬ"
function toggleWatchlist(id, title, poster_path, release_date) {
    const exists = watchlist.find(m => m.id === id);
    if (!exists) {
        watchlist.push({ id, title, poster_path, release_date });
        alert(`«${title}» добавлен в список просмотра!`);
    } else {
        alert("Фильм уже есть в вашем списке.");
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistUI();
}

function removeFromWatchlist(id) {
    watchlist = watchlist.filter(m => m.id !== id);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistUI();
}

function updateWatchlistUI() {
    const container = document.getElementById('watchlist-output');
    const select = document.getElementById('review-movie-select');
    const favCount = document.getElementById('fav-count');
    const watchlistCount = document.getElementById('watchlist-count');
    
    if (favCount) favCount.textContent = watchlist.length;
    if (watchlistCount) watchlistCount.textContent = watchlist.length;

    if (container) {
        if (watchlist.length === 0) {
            container.innerHTML = '<div class="empty-msg" style="width: 100%;">Список пуст. Добавьте фильмы на главной странице.</div>';
        } else {
            container.innerHTML = watchlist.map(movie => {
                const img = movie.poster_path && movie.poster_path !== 'N/A' ? movie.poster_path : 'https://via.placeholder.com/45x65?text=No';
                return `
                    <div class="watchlist-item" style="width: 100%;">
                        <img src="${img}" alt="">
                        <div class="wi-body">
                            <h4 class="wi-title">${movie.title}</h4>
                            <p class="wi-meta">${movie.release_date || ''}</p>
                        </div>
                        <button class="btn-del" onclick="removeFromWatchlist('${movie.id}')">Удалить</button>
                    </div>
                `;
            }).join('');
        }
    }

    if (select) {
        if (watchlist.length === 0) {
            select.innerHTML = '<option value="">-- Список пуст --</option>';
        } else {
            select.innerHTML = '<option value="">-- Выберите фильм --</option>' + 
                watchlist.map(m => `<option value="${escapeHtml(m.title)}">${m.title}</option>`).join('');
        }
    }

    renderReviews();
}

// ЛОГИКА ФОРМЫ РЕЦЕНЗИЙ
function initReviewForm() {
    const form = document.getElementById('review-form');
    if(!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const movieTitle = document.getElementById('review-movie-select').value;
        const score = document.getElementById('review-score').value;
        const text = document.getElementById('review-text').value;

        if (!movieTitle) {
            alert('Пожалуйста, выберите фильм из списка.');
            return;
        }

        const newReview = {
            id: Date.now(),
            movieTitle,
            score,
            text,
            date: new Date().toLocaleDateString('ru-RU')
        };

        reviews.unshift(newReview);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        form.reset();
        renderReviews();
    });
}

function renderReviews() {
    const list = document.getElementById('reviews-output');
    if (!list) return;

    if (reviews.length === 0) {
        list.innerHTML = '<div class="empty-msg">Вы еще не оставили ни одной рецензии.</div>';
        return;
    }

    list.innerHTML = reviews.map(r => `
        <div class="review-card">
            <div class="rc-head">
                <span class="rc-movie">${r.movieTitle}</span>
                <span class="rc-score">★ ${r.score}/10</span>
            </div>
            <p class="rc-text">${r.text}</p>
            <div style="font-size:10px; color:#666; margin-top:5px; text-align:right;">${r.date}</div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if(!text) return '';
    return text.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}