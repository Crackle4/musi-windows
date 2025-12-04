const apiKey = ''; // <-- Put your YouTube Data API v3 key here if you want search to work
let youtubePlayer;
let currentIndex = -1;
let queue = [];

// Setup UI handlers
document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('newPlaylist').addEventListener('click', newPlaylist);
document.getElementById('importFiles').addEventListener('click', importFiles);
document.getElementById('playPause').addEventListener('click', togglePlay);
document.getElementById('next').addEventListener('click', nextTrack);
document.getElementById('prev').addEventListener('click', prevTrack);
document.getElementById('savePlaylistBtn').addEventListener('click', savePlaylist);
document.getElementById('resetEq').addEventListener('click', resetEQ);

async function performSearch() {
  const q = document.getElementById('searchInput').value;
  if (!q) return alert('Enter a search term');
  if (!apiKey) return alert('No YouTube API key set. See README.');
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(q)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data.items || [];
  const container = document.getElementById('searchResults');
  container.innerHTML = '';
  results.forEach(item => {
    const el = document.createElement('div');
    el.className = 'result';
    el.textContent = item.snippet.title;
    el.onclick = () => addToQueue({ type:'youtube', id: item.id.videoId, title: item.snippet.title });
    container.appendChild(el);
  });
}

// Queue handling
function addToQueue(track) {
  queue.push(track);
  renderQueue();
  if (currentIndex === -1) { currentIndex = 0; playCurrent(); }
}

function renderQueue() {
  const ul = document.getElementById('queue');
  ul.innerHTML = '';
  queue.forEach((t, i) => {
    const li = document.createElement('li');
    li.textContent = `${i+1}. ${t.title || t.id || t.url}`;
    li.onclick = () => { currentIndex = i; playCurrent(); };
    ul.appendChild(li);
  });
  document.getElementById('nowPlaying').textContent = (currentIndex>=0 && queue[currentIndex]) ? 'Now: ' + (queue[currentIndex].title||queue[currentIndex].id||queue[currentIndex].url) : 'Nothing playing';
}

// Playback
function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player('yt-player', {
    height: '0',
    width: '0',
    events: {
      'onStateChange': onYTStateChange
    }
  });
}

function playCurrent() {
  if (currentIndex < 0 || currentIndex >= queue.length) return;
  const t = queue[currentIndex];
  if (t.type === 'youtube') {
    document.getElementById('youtubePlayer').style.display = 'block';
    document.getElementById('audio').style.display = 'none';
    youtubePlayer.loadVideoById(t.id);
  } else if (t.type === 'file' || t.type === 'stream') {
    document.getElementById('youtubePlayer').style.display = 'none';
    document.getElementById('audio').style.display = 'block';
    const audio = document.getElementById('audio');
    audio.src = t.url;
    audio.play();
  }
  renderQueue();
}

function togglePlay() {
  const audio = document.getElementById('audio');
  if (document.getElementById('youtubePlayer').style.display === 'block') {
    const state = youtubePlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) { youtubePlayer.pauseVideo(); } else { youtubePlayer.playVideo(); }
  } else {
    if (audio.paused) audio.play(); else audio.pause();
  }
}

function nextTrack() {
  if (currentIndex+1 < queue.length) { currentIndex++; playCurrent(); } else { console.log('end'); }
}
function prevTrack() {
  if (currentIndex>0) { currentIndex--; playCurrent(); } else { const audio = document.getElementById('audio'); audio.currentTime = 0; }
}

function onYTStateChange(e) {
  if (e.data === 0) { nextTrack(); }
}

async function importFiles() {
  const paths = await window.electronAPI.pickFiles();
  if (!paths || paths.length===0) return;
  const path = require('path');
  paths.forEach(p => {
    addToQueue({ type:'file', url: 'file://'+p, title: path.basename(p) });
  });
}

async function newPlaylist() {
  const name = prompt('Playlist name');
  if (!name) return;
  const id = 'pl-' + Date.now();
  const tracksJson = JSON.stringify(queue);
  await window.electronAPI.savePlaylist(id, name, tracksJson);
  loadPlaylists();
}

async function savePlaylist() {
  const name = prompt('Save playlist as...');
  if (!name) return;
  const id = 'pl-' + Date.now();
  const tracksJson = JSON.stringify(queue);
  await window.electronAPI.savePlaylist(id, name, tracksJson);
  loadPlaylists();
}

async function loadPlaylists() {
  const rows = await window.electronAPI.loadPlaylists();
  const container = document.getElementById('playlists');
  container.innerHTML = '';
  rows.forEach(r => {
    const div = document.createElement('div');
    div.textContent = r.name;
    div.onclick = () => {
      try {
        const t = JSON.parse(r.tracks);
        queue = t;
        currentIndex = 0;
        playCurrent();
      } catch(e){ console.error(e); }
    };
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.style.marginLeft='8px';
    del.onclick = async (ev) => { ev.stopPropagation(); await window.electronAPI.deletePlaylist(r.id); loadPlaylists(); };
    div.appendChild(del);
    container.appendChild(div);
  });
}

async function resetEQ() {
  alert('Reset EQ (not implemented in this starter)');
}

loadPlaylists();
renderQueue();
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
