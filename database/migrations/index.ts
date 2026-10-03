import type { Migration } from '../types';
import { migration as m001 } from './001_initial_master_data';
import { migration as m002 } from './002_add_app_menus_master';
import { migration as m003 } from './003_add_stats_menu_and_regions';
import { migration as m004 } from './004_update_focus_naming_canonical';
import { migration as m005 } from './005_remove_stats_menu';
import { migration as m006 } from './006_add_buah_percakapan_menu';

export const allMigrations: Migration[] = [
  m001,
  m002,
  m003,
  m004,
  m005,
  m006,
];
