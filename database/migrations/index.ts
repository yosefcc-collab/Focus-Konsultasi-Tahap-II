import type { Migration } from '../types';
import { migration as m001 } from './001_initial_master_data';
import { migration as m002 } from './002_add_app_menus_master';
import { migration as m003 } from './003_add_stats_menu_and_regions';

export const allMigrations: Migration[] = [
  m001,
  m002,
  m003,
];
