// Вставь свой API Key
const API_KEY = 'aeae175d'; 

// Случайные слова для поиска (добавил больше слов для разнообразия)
const randomKeywords = ['love', 'star', 'war', 'night', 'dark', 'man', 'girl', 'king', 'dead', 'life', 'time', 'fire', 'blue', 'red', 'city', 'world', 'dream', 'fast', 'last', 'lost', 'secret', 'black', 'white', 'house', 'game', 'blood', 'moon', 'sun', 'road', 'home'];

// Словарь для перевода жанров на английский (для API)
const genreTranslations = {
  'action': 'Action',
  'comedy': 'Comedy',
  'horror': 'Horror',
  'sci-fi': 'Sci-Fi',
  'drama': 'Drama',
  'thriller': 'Thriller'
};

const spinBtn = document.getElementById('spinBtn');
const genreSelect = document.getElementById('genreSelect');
const movieCard = document.getElementById('movieCard');
const moviePoster = document.getElementById('moviePoster');
const movieTitle = document.getElementById('movieTitle');
const movieYear = document.getElementById('movieYear');
const movieRating = document.getElementById('movieRating');
const moviePlot = document.getElementById('moviePlot');
const trailerBtn = document.getElementById('trailerBtn');
const favBtn = document.getElementById('favBtn');
const favoritesList = document.getElementById('favoritesList');

// Текущий фильм на экране
let currentMovie = null;
// Список избранного из localStorage
let favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];

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
  event.stopPropagation(); // Чтобы не срабатывал клик по карточке
  favorites = favorites.filter(m => m.imdbID !== imdbID);
  localStorage.setItem('movieFavorites', JSON.stringify(favorites));
  updateFavoritesUI();
  
  // Если мы удалили текущий фильм, обновляем кнопку
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
    // Удаляем
    favorites.splice(index, 1);
  } else {
    // Добавляем
    favorites.push(currentMovie);
  }
  
  localStorage.setItem('movieFavorites', JSON.stringify(favorites));
  updateFavoritesUI();
  updateFavButtonState();
});

// --- Основная логика рулетки ---
spinBtn.addEventListener('click', async () => {
  spinBtn.disabled = true;
  spinBtn.textContent = 'Ищем...';
  movieCard.classList.add('hidden');

  const selectedGenre = genreSelect.value;
  
  // Делаем до 5 попыток найти фильм (чтобы не зависало, если слово неудачное)
  let attempts = 0;
  let foundMovie = null;

  while (attempts < 5 && !foundMovie) {
    attempts++;
    try {
      const randomWord = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
      
      // Формируем запрос. Если выбран жанр, ищем по слову + жанру (API OMDb не поддерживает поиск по жанру в общей выдаче, 
      // поэтому мы ищем по слову, а потом фильтруем, но для простоты опустим сложную фильтрацию, 
      // просто используем слово как основной поиск, а жанр добавим, если API позволит)
      // Примечание: OMDb API на бесплатном тарифе не ищет по жанру напрямую в поиске s=.
      // Поэтому мы просто ищем по слову, а жанр проверяем при получении деталей.
      
      const searchResponse = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${randomWord}&type=movie`);
      const searchData = await searchResponse.json();

      if (searchData.Response === "True" && searchData.Search) {
        // Перемешиваем результаты
        const shuffled = searchData.Search.sort(() => 0.5 - Math.random());
        
        // Ищем подходящий фильм
        for (let item of shuffled) {
          const detailsResponse = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${item.imdbID}&plot=short`);
          const detailsData = await detailsResponse.json();
          
          // Если жанр не выбран, или выбранный жанр есть в списке жанров фильма
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

  if (foundMovie) {
    currentMovie = foundMovie;
    
    moviePoster.src = foundMovie.Poster !== 'N/A' ? foundMovie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    movieTitle.textContent = foundMovie.Title;
    movieYear.textContent = foundMovie.Year;
    movieRating.textContent = `⭐ ${foundMovie.imdbRating !== 'N/A' ? foundMovie.imdbRating : 'N/A'}`;
    moviePlot.textContent = foundMovie.Plot !== 'N/A' ? foundMovie.Plot : 'Описание отсутствует.';
    
    // Ссылка на трейлер в YouTube
    const trailerQuery = encodeURIComponent(`${foundMovie.Title} ${foundMovie.Year} trailer`);
    trailerBtn.href = `https://www.youtube.com/results?search_query=${trailerQuery}`;
    trailerBtn.classList.remove('hidden');

    updateFavButtonState();
    movieCard.classList.remove('hidden');
  } else {
    alert("Не удалось найти фильм по этому жанру. Попробуй еще раз или выбери другой жанр.");
  }

  spinBtn.disabled = false;
  spinBtn.textContent = 'Крутить рулетку';
});

// Инициализация
updateFavoritesUI();