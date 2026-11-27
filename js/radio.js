/* ==========================================================================
   HIGHWAY CAR RADIO — OFFICIAL YOUTUBE EMBED PLAYER (YT IFrame API)
   - Zero cookies shared; streams strictly via user's own browser session
   - Supports watch, youtu.be, music.youtube.com, shorts, live & playlists
   - Persists volume & saved station presets cleanly in localStorage
   - Panic-pauses & hides immediately when Calculator disguise (`) activates
   ========================================================================== */

(function (root) {
  'use strict';

  const RADIO_STORAGE_KEY = 'highway_radio_v1';
  const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
  const PLAYLIST_ID_RE = /^[A-Za-z0-9_-]{10,}$/;
  const SAFE_PLAYLIST_PREFIX_RE = /^(PL|OLAK|UU|LL|FL)/;

  /**
   * Parse a YouTube URL or bare video/playlist ID into a structured target.
   * Returns { type: 'video', videoId } or { type: 'playlist', listId, videoId } or null.
   */
  function parseYouTubeInput(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (VIDEO_ID_RE.test(trimmed)) {
      return { type: 'video', videoId: trimmed };
    }
    if (SAFE_PLAYLIST_PREFIX_RE.test(trimmed) && PLAYLIST_ID_RE.test(trimmed)) {
      return { type: 'playlist', listId: trimmed, videoId: null };
    }

    let urlObj = null;
    try {
      const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      urlObj = new URL(withProto);
    } catch (e) {
      return null;
    }

    const host = (urlObj.hostname || '').toLowerCase().replace(/^www\./, '');
    const isYtHost =
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'youtu.be';
    if (!isYtHost) return null;

    let videoId = null;
    const parts = (urlObj.pathname || '').split('/').filter(Boolean);

    if (host === 'youtu.be') {
      if (parts[0] && VIDEO_ID_RE.test(parts[0])) {
        videoId = parts[0];
      }
    } else {
      const qv = urlObj.searchParams.get('v');
      if (qv && VIDEO_ID_RE.test(qv)) {
        videoId = qv;
      } else if (
        parts.length >= 2 &&
        (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') &&
        VIDEO_ID_RE.test(parts[1])
      ) {
        videoId = parts[1];
      }
    }

    const rawList = urlObj.searchParams.get('list');
    if (rawList && PLAYLIST_ID_RE.test(rawList)) {
      if (/^RD/.test(rawList) && videoId) {
        return { type: 'video', videoId };
      }
      if (SAFE_PLAYLIST_PREFIX_RE.test(rawList) || !videoId) {
        return { type: 'playlist', listId: rawList, videoId: videoId || null };
      }
    }

    if (videoId) {
      return { type: 'video', videoId };
    }
    return null;
  }

  function formatFallbackTitle(parsed) {
    if (!parsed) return 'Car Radio';
    if (parsed.type === 'playlist') {
      return `Playlist (${parsed.listId.slice(0, 10)}...)`;
    }
    return `YouTube (${parsed.videoId})`;
  }

  class HighwayRadio {
    constructor() {
      this.open = false;
      this.compact = false;
      this.volume = 60;
      this.presets = [];
      this.currentSource = null;
      this.pendingLoad = null;
      this.playing = false;
      this.title = '';
      this.statusText = 'Paste a YouTube link or ID';
      this.isError = false;

      this.apiRequested = false;
      this.playerReady = false;
      this.player = null;
      this.dom = null;
      this.onUpdate = null;

      this._loadState();
    }

    _loadState() {
      try {
        if (typeof localStorage === 'undefined') return;
        const raw = localStorage.getItem(RADIO_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        if (typeof parsed.volume === 'number' && isFinite(parsed.volume)) {
          this.volume = Math.max(0, Math.min(100, Math.round(parsed.volume)));
        }
        if (Array.isArray(parsed.presets)) {
          const clean = [];
          for (let i = 0; i < parsed.presets.length && clean.length < 12; i++) {
            const p = parsed.presets[i];
            if (!p || typeof p.raw !== 'string') continue;
            const ok = parseYouTubeInput(p.raw);
            if (!ok) continue;
            clean.push({
              title: typeof p.title === 'string' && p.title.trim() ? p.title.trim().slice(0, 60) : formatFallbackTitle(ok),
              raw: p.raw.trim(),
              parsed: ok
            });
          }
          this.presets = clean;
        }
      } catch (e) {}
    }

    _saveState() {
      try {
        if (typeof localStorage === 'undefined') return;
        const payload = {
          volume: this.volume,
          presets: this.presets.map((p) => ({
            title: p.title,
            raw: p.raw
          }))
        };
        localStorage.setItem(RADIO_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {}
    }

    bindDOM(domMap, callbacks) {
      this.dom = domMap || {};
      this.onUpdate = callbacks && typeof callbacks.onUpdate === 'function' ? callbacks.onUpdate : null;

      const blurBtn = (btn, fn) => {
        if (!btn) return;
        btn.addEventListener('click', (ev) => {
          btn.blur();
          fn(ev);
        });
      };

      blurBtn(this.dom.btnClose, () => this.closePanel());
      blurBtn(this.dom.btnCompact, () => this.toggleCompact());
      blurBtn(this.dom.btnPlay, () => this.togglePlayPause());
      blurBtn(this.dom.btnPrev, () => this.prevTrack());
      blurBtn(this.dom.btnNext, () => this.nextTrack());
      blurBtn(this.dom.btnSave, () => this.saveCurrentPreset());
      blurBtn(this.dom.btnLoad, () => {
        const val = this.dom.urlInput ? this.dom.urlInput.value : '';
        this.loadInput(val);
      });

      if (this.dom.urlInput) {
        this.dom.urlInput.addEventListener('keydown', (e) => {
          if (e.code === 'Enter') {
            e.preventDefault();
            this.loadInput(this.dom.urlInput.value);
            this.dom.urlInput.blur();
          }
        });
      }

      if (this.dom.volumeSlider) {
        this.dom.volumeSlider.value = String(this.volume);
        this.dom.volumeSlider.addEventListener('input', () => {
          this.setVolume(parseInt(this.dom.volumeSlider.value, 10));
        });
        this.dom.volumeSlider.addEventListener('change', () => this.dom.volumeSlider.blur());
        this.dom.volumeSlider.addEventListener('pointerup', () => this.dom.volumeSlider.blur());
      }

      this._renderPresets();
      this._syncDOM();
    }

    ensureApiLoaded() {
      if (this.player) return;
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      if (window.YT && window.YT.Player) {
        this._createPlayer();
        return;
      }

      if (this.apiRequested) return;
      this.apiRequested = true;

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === 'function') {
          try {
            prevReady();
          } catch (e) {}
        }
        this._createPlayer();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(tag, firstScript);
        } else if (document.head) {
          document.head.appendChild(tag);
        }
      }
    }

    _createPlayer() {
      if (this.player || !this.dom || !this.dom.ytMount) return;
      if (typeof window === 'undefined' || !window.YT || !window.YT.Player) return;

      const playerVars = {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1
      };
      if (window.location && /^https?:$/i.test(window.location.protocol)) {
        playerVars.origin = window.location.origin;
      }

      this.player = new window.YT.Player(this.dom.ytMount, {
        width: '100%',
        height: '142',
        playerVars,
        events: {
          onReady: () => {
            this.playerReady = true;
            try {
              this.player.setVolume(this.volume);
            } catch (e) {}
            if (this.pendingLoad) {
              const next = this.pendingLoad;
              this.pendingLoad = null;
              this._applyParsedLoad(next);
            }
          },
          onStateChange: (ev) => this._handlePlayerState(ev),
          onError: (ev) => this._handlePlayerError(ev)
        }
      });
    }

    _handlePlayerState(ev) {
      const code = ev ? ev.data : -1;
      const PS = typeof window !== 'undefined' && window.YT ? window.YT.PlayerState : null;
      const PLAYING = PS ? PS.PLAYING : 1;
      const PAUSED = PS ? PS.PAUSED : 2;
      const BUFFERING = PS ? PS.BUFFERING : 3;
      const ENDED = PS ? PS.ENDED : 0;

      if (code === PLAYING) {
        this.playing = true;
        this.isError = false;
        this.statusText = 'Playing';
        try {
          const data = this.player && this.player.getVideoData ? this.player.getVideoData() : null;
          if (data && data.title) {
            this.title = data.title;
            if (this.currentSource) {
              this.currentSource.title = data.title;
              // Refresh matching preset title if saved under generic name
              const match = this.presets.find((p) => p.raw === this.currentSource.raw);
              if (match && match.title !== data.title) {
                match.title = data.title.slice(0, 60);
                this._saveState();
                this._renderPresets();
              }
            }
          }
        } catch (e) {}
      } else if (code === PAUSED) {
        this.playing = false;
        this.statusText = 'Paused';
      } else if (code === BUFFERING) {
        this.isError = false;
        this.statusText = 'Buffering...';
      } else if (code === ENDED) {
        this.playing = false;
        this.statusText = 'Ended';
        if (this.presets.length > 1) {
          const idx = this.currentSource
            ? this.presets.findIndex((p) => p.raw === this.currentSource.raw)
            : -1;
          const nextIdx = (idx + 1) % this.presets.length;
          this.loadPreset(nextIdx);
          return;
        }
      }
      this._syncDOM();
    }

    _handlePlayerError(ev) {
      const code = ev ? ev.data : 0;
      this.playing = false;
      this.isError = true;
      if (code === 101 || code === 150) {
        this.statusText = 'Embed blocked by uploader — try another video or topic upload';
      } else if (code === 100) {
        this.statusText = 'Video not found or private';
      } else if (code === 2) {
        this.statusText = 'Invalid YouTube video/playlist ID';
      } else {
        this.statusText = 'Playback error — try another link';
      }
      this._syncDOM();
    }

    _applyParsedLoad(parsed) {
      if (!this.player || !this.playerReady || !parsed) return;
      try {
        if (parsed.type === 'playlist') {
          this.player.loadPlaylist({
            list: parsed.listId,
            listType: 'playlist',
            index: 0
          });
        } else {
          this.player.loadVideoById(parsed.videoId);
        }
        this.player.setVolume(this.volume);
      } catch (e) {}
    }

    loadInput(rawStr, customTitle) {
      const parsed = parseYouTubeInput(rawStr);
      if (!parsed) {
        this.isError = true;
        this.statusText = 'Invalid YouTube link or ID';
        this._syncDOM();
        return false;
      }

      const cleanRaw = rawStr.trim();
      const label = customTitle && customTitle.trim() ? customTitle.trim() : formatFallbackTitle(parsed);
      this.currentSource = { raw: cleanRaw, parsed, title: label };
      this.title = label;
      this.isError = false;
      this.statusText = 'Loading...';
      if (!this.open) this.open = true;

      this.ensureApiLoaded();
      if (this.player && this.playerReady) {
        this._applyParsedLoad(parsed);
      } else {
        this.pendingLoad = parsed;
      }

      this._syncDOM();
      return true;
    }

    openPanel() {
      this.open = true;
      this.ensureApiLoaded();
      this._syncDOM();
    }

    closePanel() {
      this.open = false;
      if (this.player && this.playerReady && typeof this.player.pauseVideo === 'function') {
        try {
          this.player.pauseVideo();
        } catch (e) {}
      }
      this.playing = false;
      if (this.currentSource) {
        this.statusText = 'Paused';
      }
      this._syncDOM();
    }

    togglePanel() {
      if (this.open) this.closePanel();
      else this.openPanel();
    }

    toggleCompact() {
      this.compact = !this.compact;
      this._syncDOM();
    }

    onCalculatorLock() {
      if (!this.open && !this.playing) return;
      this.closePanel();
    }

    togglePlayPause() {
      if (!this.currentSource) {
        this.openPanel();
        this.isError = false;
        this.statusText = 'Paste a YouTube link first';
        this._syncDOM();
        if (this.dom && this.dom.urlInput) this.dom.urlInput.focus();
        return;
      }
      if (!this.open) this.openPanel();
      if (!this.player || !this.playerReady) return;
      try {
        if (this.playing) {
          this.player.pauseVideo();
        } else {
          this.player.playVideo();
        }
      } catch (e) {}
    }

    nextTrack() {
      if (
        this.currentSource &&
        this.currentSource.parsed.type === 'playlist' &&
        this.player &&
        this.playerReady &&
        typeof this.player.nextVideo === 'function'
      ) {
        try {
          this.player.nextVideo();
          return;
        } catch (e) {}
      }
      if (this.presets.length > 0) {
        const idx = this.currentSource
          ? this.presets.findIndex((p) => p.raw === this.currentSource.raw)
          : -1;
        const nextIdx = (idx + 1) % this.presets.length;
        this.loadPreset(nextIdx);
      }
    }

    prevTrack() {
      if (
        this.currentSource &&
        this.currentSource.parsed.type === 'playlist' &&
        this.player &&
        this.playerReady &&
        typeof this.player.previousVideo === 'function'
      ) {
        try {
          this.player.previousVideo();
          return;
        } catch (e) {}
      }
      if (this.presets.length > 0) {
        const idx = this.currentSource
          ? this.presets.findIndex((p) => p.raw === this.currentSource.raw)
          : 0;
        const prevIdx = (idx - 1 + this.presets.length) % this.presets.length;
        this.loadPreset(prevIdx);
      }
    }

    setVolume(vol) {
      const clamped = Math.max(0, Math.min(100, isFinite(vol) ? Math.round(vol) : 60));
      this.volume = clamped;
      if (this.player && this.playerReady && typeof this.player.setVolume === 'function') {
        try {
          this.player.setVolume(clamped);
        } catch (e) {}
      }
      if (this.dom && this.dom.volumeSlider) {
        this.dom.volumeSlider.value = String(clamped);
      }
      this._saveState();
    }

    saveCurrentPreset() {
      if (!this.currentSource) {
        this.isError = false;
        this.statusText = 'Load a track before saving';
        this._syncDOM();
        return false;
      }
      const existing = this.presets.findIndex((p) => p.raw === this.currentSource.raw);
      const entry = {
        title: (this.title || this.currentSource.title || formatFallbackTitle(this.currentSource.parsed)).slice(0, 60),
        raw: this.currentSource.raw,
        parsed: this.currentSource.parsed
      };
      if (existing >= 0) {
        this.presets[existing] = entry;
      } else {
        this.presets.unshift(entry);
        if (this.presets.length > 12) this.presets.length = 12;
      }
      this._saveState();
      this._renderPresets();
      this.isError = false;
      this.statusText = 'Saved preset';
      this._syncDOM();
      return true;
    }

    removePreset(index) {
      if (index < 0 || index >= this.presets.length) return;
      this.presets.splice(index, 1);
      this._saveState();
      this._renderPresets();
      this._syncDOM();
    }

    loadPreset(index) {
      const p = this.presets[index];
      if (!p) return false;
      if (this.dom && this.dom.urlInput) {
        this.dom.urlInput.value = p.raw;
      }
      return this.loadInput(p.raw, p.title);
    }

    _renderPresets() {
      if (!this.dom || !this.dom.presetsList) return;
      const list = this.dom.presetsList;
      while (list.firstChild) list.removeChild(list.firstChild);
      if (this.presets.length === 0) return;

      for (let i = 0; i < this.presets.length; i++) {
        const p = this.presets[i];
        const chip = document.createElement('div');
        chip.className = 'radio-preset-chip';

        const loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'radio-preset-play';
        loadBtn.textContent = p.title;
        loadBtn.title = p.raw;
        loadBtn.addEventListener('click', () => {
          loadBtn.blur();
          this.loadPreset(i);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'radio-preset-del';
        delBtn.textContent = '×';
        delBtn.title = 'Remove preset';
        delBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          delBtn.blur();
          this.removePreset(i);
        });

        chip.appendChild(loadBtn);
        chip.appendChild(delBtn);
        list.appendChild(chip);
      }
    }

    getState() {
      return {
        open: this.open,
        compact: this.compact,
        playing: this.playing,
        title: this.title,
        statusText: this.statusText,
        isError: this.isError,
        volume: this.volume,
        presets: this.presets.slice(),
        hasTrack: !!this.currentSource
      };
    }

    _syncDOM() {
      if (this.dom) {
        if (this.dom.dock) {
          this.dom.dock.classList.toggle('hidden', !this.open);
          this.dom.dock.classList.toggle('compact', !!this.compact);
        }
        if (this.dom.btnCompact) {
          this.dom.btnCompact.textContent = this.compact ? '▸' : '▾';
        }
        const wrap = this.dom.ytWrap || (this.dom.ytMount && this.dom.ytMount.parentElement);
        if (wrap) {
          wrap.classList.toggle('empty', !this.currentSource);
        }
        if (this.dom.emptyHint) {
          this.dom.emptyHint.classList.toggle('hidden', !!this.currentSource);
        }
        if (this.dom.nowPlaying) {
          this.dom.nowPlaying.textContent = this.title || 'No station loaded';
        }
        if (this.dom.btnPlay) {
          this.dom.btnPlay.textContent = this.playing ? '❚❚' : '▶';
          this.dom.btnPlay.title = this.playing ? 'Pause' : 'Play';
        }
        if (this.dom.status) {
          this.dom.status.textContent = this.statusText || '';
          this.dom.status.classList.toggle('error', !!this.isError);
        }
      }
      if (this.onUpdate) {
        this.onUpdate(this.getState());
      }
    }
  }

  const api = {
    HighwayRadio,
    parseYouTubeInput,
    RADIO_STORAGE_KEY
  };

  if (typeof window !== 'undefined') {
    window.HighwayRadio = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root && (typeof window === 'undefined' || root !== window)) {
    root.HighwayRadio = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
