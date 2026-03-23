
// mutation name
const SET_WALLPAPER = 'SET_WALLPAPER';
const RESET_WALLPAPER = 'RESET_WALLPAPER';

import { DEFAULT_WALLPAPER, clearWallpaper, loadWallpaper, saveWallpaper } from '@/services/wallpaperStorage'

const state = {
	wallpaper: loadWallpaper()
};

const mutations = {
	[SET_WALLPAPER] (state, wallpaper) {
		state.wallpaper = wallpaper
	},
  [RESET_WALLPAPER] (state) {
    state.wallpaper = DEFAULT_WALLPAPER
  }
};

const actions = {
  $setWallpaper({ commit }, wallpaper) {
    if (wallpaper && wallpaper.type && wallpaper.value) {
      saveWallpaper(wallpaper)
      commit(SET_WALLPAPER, wallpaper)
    }
  },
  $resetWallpaper({ commit }) {
    clearWallpaper()
    commit(RESET_WALLPAPER)
  }
};

const getters = {
	$currentWallpaper (state) {
		return state.wallpaper
	},
  $currentWallpaperStyle (state) {
    if (state.wallpaper.type === 'image') {
      return {
        backgroundImage: `url(${state.wallpaper.value})`,
        backgroundColor: 'rgba(255, 255, 255, 0.68)'
      }
    }

    return {
      backgroundImage: 'none',
      backgroundColor: state.wallpaper.value
    }
	}
};

export default {
	state,
	mutations,
	actions,
	getters
};
