// =====================================================================
//  audioKeys.js — Catálogo de audio del juego.
//  Cada clave se usa en AudioManager y el PreloadScene carga los archivos
//  a partir de esta lista (loader de assets de audio).
//  Todos los .wav fueron sintetizados con tools/generate_audio.py
//  (audio original, sin derechos de autor).
// =====================================================================

export const MUSIC = {
  MENU: 'music_menu',
  AMBIENT: 'music_ambient',
  ENDING: 'music_ending'
};

export const SFX = {
  CLICK: 'sfx_click',
  PICKUP: 'sfx_pickup',
  BATTERY: 'sfx_battery',
  FLASH_CLICK: 'sfx_flash_click',
  HISS: 'sfx_hiss',
  GROWL: 'sfx_growl',
  JUMPSCARE: 'sfx_jumpscare',
  PHONE_RING: 'sfx_phone_ring',
  PHONE_BUZZ: 'sfx_phone_buzz',
  THUNDER: 'sfx_thunder',
  DOOR: 'sfx_door',
  GENERATOR_START: 'sfx_generator_start',
  GENERATOR_HUM: 'sfx_generator_hum',
  SUCCESS: 'sfx_success',
  ERROR: 'sfx_error',
  HEARTBEAT: 'sfx_heartbeat',
  PAPER: 'sfx_paper',
  FOOTSTEP: 'sfx_footstep',
  BLIP: 'sfx_blip',
  TAPE: 'sfx_tape'
};

// clave -> ruta relativa a public/ (el loader usa setPath('assets/')).
export const AUDIO_FILES = {
  [MUSIC.MENU]: 'audio/music/menu_lullaby.wav',
  [MUSIC.AMBIENT]: 'audio/music/ambient_drone.wav',
  [MUSIC.ENDING]: 'audio/music/ending_light.wav',
  [SFX.CLICK]: 'audio/sounds/click.wav',
  [SFX.PICKUP]: 'audio/sounds/pickup.wav',
  [SFX.BATTERY]: 'audio/sounds/battery.wav',
  [SFX.FLASH_CLICK]: 'audio/sounds/flash_click.wav',
  [SFX.HISS]: 'audio/sounds/hiss.wav',
  [SFX.GROWL]: 'audio/sounds/growl.wav',
  [SFX.JUMPSCARE]: 'audio/sounds/jumpscare.wav',
  [SFX.PHONE_RING]: 'audio/sounds/phone_ring.wav',
  [SFX.PHONE_BUZZ]: 'audio/sounds/phone_buzz.wav',
  [SFX.THUNDER]: 'audio/sounds/thunder.wav',
  [SFX.DOOR]: 'audio/sounds/door.wav',
  [SFX.GENERATOR_START]: 'audio/sounds/generator_start.wav',
  [SFX.GENERATOR_HUM]: 'audio/sounds/generator_hum.wav',
  [SFX.SUCCESS]: 'audio/sounds/success.wav',
  [SFX.ERROR]: 'audio/sounds/error.wav',
  [SFX.HEARTBEAT]: 'audio/sounds/heartbeat.wav',
  [SFX.PAPER]: 'audio/sounds/paper.wav',
  [SFX.FOOTSTEP]: 'audio/sounds/footstep.wav',
  [SFX.BLIP]: 'audio/sounds/blip.wav',
  [SFX.TAPE]: 'audio/sounds/tape.wav'
};
