// Вставь свой API Key
const API_KEY = 'aeae175d'; 

const randomKeywords = ['love', 'star', 'war', 'night', 'dark', 'man', 'girl', 'king', 'dead', 'life', 'time', 'fire', 'blue', 'red', 'city', 'world', 'dream', 'fast', 'last', 'lost', 'secret', 'black', 'white', 'house', 'game', 'blood', 'moon', 'sun', 'road', 'home'];

// Обновленный словарь жанров
const genreTranslations = {
  'action': 'Action',
  'comedy': 'Comedy',
  'horror': 'Horror',
  'sci-fi': 'Sci-Fi',
  'drama': 'Drama',
  'thriller': 'Thriller',
  'animation': 'Animation',
  'documentary': 'Documentary',
  'family': 'Family',
  'romance': 'Romance'
};

const spinBtn = document.getElementById('spinBtn');
const genreSelect = document.getElementById('genreSelect');
const movieCard = document.getElementById('movieCard');
const skeletonCard = document.getElementById('skeletonCard');
const moviePoster = document.getElementById('moviePoster');
const movieTitle = document.getElementById('movieTitle');
const movieYear = document.getElementById('movieYear');
const movieRating = document.getElementById('movieRating');
const moviePlot = document.getElementById('moviePlot');
const trailerBtn = document.getElementById('trailerBtn');
const favBtn = document.getElementById('favBtn');
const skipBtn = document.getElementById('skipBtn');
const favoritesList = document.getElementById('favoritesList');

// Элементы модального окна трейлера
const trailerModal = document.getElementById('trailerModal');
const closeTrailerBtn = document.getElementById('closeTrailerBtn');
const trailerContainer = document.getElementById('trailerContainer');

let currentMovie = null;
let favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
let blacklist = JSON.parse(localStorage.getItem('movieBlacklist')) || [];

// --- Функции для работы с избранным ---
function updateFavoritesUI() {
  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-msg">Список пока пуст...</p>';
    return;
  }

  favoritesList.innerHTML = '';
  favorites.forEach(movie => {
    const div = document.createElement('div');
    div.className = 'fav-item';
    div.innerHTML = `
      <button class="remove-fav-btn" onclick="removeFromFavorites('${movie.imdbID}', event)">✕</button>
      <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/150x220?text=No+Poster'}" alt="${movie.Title}">
      <div class="fav-item-info">
        <div class="fav-item-title" title="${movie.Title}">${movie.Title}</div>
        <div class="fav-item-year">${movie.Year}</div>
      </div>
    `;
    favoritesList.appendChild(div);
  });
}

window.removeFromFavorites = function(imdbID, event) {
  event.stopPropagation();
  favorites = favorites.filter(m => m.imdbID !== imdbID);
  localStorage.setItem('movieFavorites', JSON.stringify(favorites));
  updateFavoritesUI();
  
  if (currentMovie && currentMovie.imdbID === imdbID) {
    updateFavButtonState();
  }
}

function updateFavButtonState() {
  if (!currentMovie) return;
  const isFav = favorites.some(m => m.imdbID === currentMovie.imdbID);
  if (isFav) {
    favBtn.textContent = '❤️ В избранном';
    favBtn.classList.add('active');
  } else {
    favBtn.textContent = '🤍 В избранное';
    favBtn.classList.remove('active');
  }
}

favBtn.addEventListener('click', () => {
  if (!currentMovie) return;
  
  const index = favorites.findIndex(m => m.imdbID === currentMovie.imdbID);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(currentMovie);
  }
  
  localStorage.setItem('movieFavorites', JSON.stringify(favorites));
  updateFavoritesUI();
  updateFavButtonState();

  favBtn.classList.add('pop');
  setTimeout(() => favBtn.classList.remove('pop'), 400);
});

// --- Обработчик кнопки "Пропустить" ---
skipBtn.addEventListener('click', () => {
  if (!currentMovie) return;
  
  if (!blacklist.includes(currentMovie.imdbID)) {
    blacklist.push(currentMovie.imdbID);
    localStorage.setItem('movieBlacklist', JSON.stringify(blacklist));
  }
  
  spinBtn.click();
});

// --- Основная логика рулетки ---
spinBtn.addEventListener('click', async () => {
  spinBtn.disabled = true;
  spinBtn.textContent = 'Ищем...';
  
  movieCard.classList.add('hidden');
  skeletonCard.classList.remove('hidden');

  const selectedGenre = genreSelect.value;
  let attempts = 0;
  let foundMovie = null;

  while (attempts < 10 && !foundMovie) {
    attempts++;
    try {
      const randomWord = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
      const searchResponse = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${randomWord}&type=movie`);
      const searchData = await searchResponse.json();

      if (searchData.Response === "True" && searchData.Search) {
        const shuffled = searchData.Search.sort(() => 0.5 - Math.random());
        
        for (let item of shuffled) {
          if (blacklist.includes(item.imdbID)) continue; 

          const detailsResponse = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${item.imdbID}&plot=short`);
          const detailsData = await detailsResponse.json();
          
          if (!selectedGenre || (detailsData.Genre && detailsData.Genre.includes(genreTranslations[selectedGenre]))) {
            foundMovie = detailsData;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Ошибка попытки:", error);
    }
  }

  skeletonCard.classList.add('hidden');

  if (foundMovie) {
    currentMovie = foundMovie;
    
    moviePoster.src = foundMovie.Poster !== 'N/A' ? foundMovie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    movieTitle.textContent = foundMovie.Title;
    movieYear.textContent = foundMovie.Year;
    movieRating.textContent = `⭐ ${foundMovie.imdbRating !== 'N/A' ? foundMovie.imdbRating : 'N/A'}`;
    moviePlot.textContent = foundMovie.Plot !== 'N/A' ? foundMovie.Plot : 'Описание отсутствует.';
    
    // Настраиваем кнопку трейлера
    trailerBtn.href = "#";
    trailerBtn.classList.remove('hidden');
    trailerBtn.dataset.query = `${foundMovie.Title} ${foundMovie.Year} trailer`;

    updateFavButtonState();
    movieCard.classList.remove('hidden');
    
    movieCard.classList.remove('animate-spin');
    void movieCard.offsetWidth;
    movieCard.classList.add('animate-spin');
  } else {
    alert("Не удалось найти новый фильм. Попробуй другой жанр.");
  }

  spinBtn.disabled = false;
  spinBtn.textContent = 'Крутить рулетку';
});

// --- Логика трейлера ---
trailerBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const query = trailerBtn.dataset.query;
  
  // Встраиваем поиск YouTube напрямую в iframe
  const searchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
  
  trailerContainer.innerHTML = `<iframe src="${searchUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  trailerModal.style.display = 'flex';
});

closeTrailerBtn.addEventListener('click', () => {
  trailerModal.style.display = 'none';
  trailerContainer.innerHTML = ''; // Останавливаем видео
});

trailerModal.addEventListener('click', (e) => {
  if (e.target === trailerModal) {
    trailerModal.style.display = 'none';
    trailerContainer.innerHTML = '';
  }
});

// Инициализация
updateFavoritesUI();