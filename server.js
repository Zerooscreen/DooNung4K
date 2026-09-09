const express = require('express');
const path = require('path');
const { 
  getPopularMovies, 
  getPopularTV, 
  getMovieDetails, 
  getTVDetails, 
  searchMulti 
} = require('./tmdb');
const { 
  head, 
  layout, 
  posterCard, 
  genreRow, 
  trailerBlock, 
  castGrid, 
  similarGrid, 
  watchButton, 
  movieJsonLd, 
  tvJsonLd, 
  sideBannerAd, 
  nativeBannerAd 
} = require('./render');

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = 'https://doonung4k.com'; // Sesuaikan dengan domain Anda jika ada

// Static folder untuk CSS, JS client (style.css, app.js)
app.use(express.static(path.join(__dirname, 'public')));

// 1. Homepage & Movie List (/ atau /movie)
app.get(['/', '/movie'], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const movies = await getPopularMovies(page);
    
    const headHtml = head({
      title: 'ดูหนังออนไลน์ หนังใหม่ 2026 - DooNung4K',
      description: 'ศูนย์รวมข้อมูลหนังใหม่ รีวิว เรื่องย่อ ตัวอย่างหนังอัปเดตล่าสุด',
      url: `${DOMAIN}/movie`
    });

    const bodyHtml = `
      <section class="hero-section">
        <h1>หนังยอดนิยม (Popular Movies)</h1>
      </section>
      <div class="content-container">
        <div class="main-content">
          <div class="grid">
            ${(movies.results || []).map(item => posterCard(item, 'movie')).join('')}
          </div>
          ${nativeBannerAd()}
        </div>
        <aside class="sidebar">
          ${sideBannerAd()}
        </aside>
      </div>
    `;

    res.send(layout({ headHtml, bodyHtml, activeTab: 'movie' }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 2. TV Series List (/tv)
app.get('/tv', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const tvShows = await getPopularTV(page);

    const headHtml = head({
      title: 'ซีรีส์ใหม่ ซีรีส์ยอดนิยม 2026 - DooNung4K',
      description: 'อัปเดตซีรีส์เกาหลี ซีรีส์ฝรั่ง เรื่องย่อและข้อมูลนักแสดง',
      url: `${DOMAIN}/tv`
    });

    const bodyHtml = `
      <section class="hero-section">
        <h1>ซีรีส์ยอดนิยม (Popular TV Shows)</h1>
      </section>
      <div class="content-container">
        <div class="main-content">
          <div class="grid">
            ${(tvShows.results || []).map(item => posterCard(item, 'tv')).join('')}
          </div>
          ${nativeBannerAd()}
        </div>
        <aside class="sidebar">
          ${sideBannerAd()}
        </aside>
      </div>
    `;

    res.send(layout({ headHtml, bodyHtml, activeTab: 'tv' }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 3. Detail Movie (/movie/:id/:slug)
app.get('/movie/:id/:slug?', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await getMovieDetails(id);

    if (!movie || movie.success === false) {
      return res.status(404).send('Movie Not Found');
    }

    const currentUrl = `${DOMAIN}/movie/${movie.id}`;
    const headHtml = head({
      title: `${movie.title} - เรื่องย่อ ตัวอย่างหนัง | DooNung4K`,
      description: movie.overview || '',
      url: currentUrl,
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
      type: 'video.movie'
    }) + movieJsonLd(movie, currentUrl);

    const bodyHtml = `
      <div class="detail-container">
        <div class="detail-header">
          <h1>${movie.title}</h1>
          ${genreRow(movie.genres)}
          ${watchButton(movie.id, 'movie')}
        </div>
        <p class="overview">${movie.overview || 'ไม่มีข้อมูลเรื่องย่อ'}</p>
        
        <h2>ตัวอย่างหนัง (Trailer)</h2>
        ${trailerBlock(movie.videos)}
        
        ${nativeBannerAd()}

        <h2>นักแสดง (Cast)</h2>
        ${castGrid(movie.credits)}

        <h2>เรื่องที่คล้ายกัน (Similar Movies)</h2>
        ${similarGrid(movie.similar ? movie.similar.results : [], 'movie')}
      </div>
    `;

    res.send(layout({ headHtml, bodyHtml, activeTab: 'movie' }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 4. Detail TV Series (/tv/:id/:slug)
app.get('/tv/:id/:slug?', async (req, res) => {
  try {
    const { id } = req.params;
    const tv = await getTVDetails(id);

    if (!tv || tv.success === false) {
      return res.status(404).send('TV Show Not Found');
    }

    const currentUrl = `${DOMAIN}/tv/${tv.id}`;
    const headHtml = head({
      title: `${tv.name} - เรื่องย่อ ตัวอย่างซีรีส์ | DooNung4K`,
      description: tv.overview || '',
      url: currentUrl,
      image: tv.poster_path ? `https://image.tmdb.org/t/p/w780${tv.poster_path}` : undefined,
      type: 'video.tv_show'
    }) + tvJsonLd(tv, currentUrl);

    const bodyHtml = `
      <div class="detail-container">
        <div class="detail-header">
          <h1>${tv.name}</h1>
          ${genreRow(tv.genres)}
          ${watchButton(tv.id, 'tv')}
        </div>
        <p class="overview">${tv.overview || 'ไม่มีข้อมูลเรื่องย่อ'}</p>

        <h2>ตัวอย่างซีรีส์ (Trailer)</h2>
        ${trailerBlock(tv.videos)}

        ${nativeBannerAd()}

        <h2>นักแสดง (Cast)</h2>
        ${castGrid(tv.credits)}

        <h2>เรื่องที่คล้ายกัน (Similar Shows)</h2>
        ${similarGrid(tv.similar ? tv.similar.results : [], 'tv')}
      </div>
    `;

    res.send(layout({ headHtml, bodyHtml, activeTab: 'tv' }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 5. Watch Page (/watch/:type/:id)
app.get('/watch/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const isMovie = type === 'movie';
    const data = isMovie ? await getMovieDetails(id) : await getTVDetails(id);
    const title = data.title || data.name || 'Watch';

    const headHtml = head({
      title: `ดูออนไลน์ - ${title} | DooNung4K`,
      description: `รับชม ${title} ออนไลน์แบบ FULL HD`,
      url: `${DOMAIN}/watch/${type}/${id}`
    });

    const playerUrl = isMovie 
      ? `https://vidsrc.to/embed/movie/${id}`
      : `https://vidsrc.to/embed/tv/${id}`;

    const bodyHtml = `
      <div class="watch-container" style="max-width: 1000px; margin: 0 auto; padding: 20px;">
        <h1>${title}</h1>
        <div class="player-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 20px;">
          <iframe src="${playerUrl}" style="position: absolute; top:0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen></iframe>
        </div>
        ${nativeBannerAd()}
      </div>
    `;

    res.send(layout({ headHtml, bodyHtml, activeTab: type }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 6. API Search endpoint (Untuk live search client-side)
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ results: [] });
    const results = await searchMulti(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
