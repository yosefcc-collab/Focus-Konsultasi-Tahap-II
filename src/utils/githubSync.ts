import { TaskAssignment, TeamMember } from '../types';

export interface GitHubSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  gistId?: string;
  syncMode: 'repo' | 'gist';
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
}

export interface SynodalDatabasePayload {
  appName: string;
  paroki: string;
  version: string;
  syncedAt: string;
  syncedBy: string;
  settings: {
    isFinalMasterLocked: boolean;
    finalMasterDate?: string;
    totalTasks: number;
    totalMembers: number;
    appTheme: string;
  };
  members: TeamMember[];
  tasks: TaskAssignment[];
}

const STORAGE_KEY_CONFIG = 'sinodal_github_sync_config_v1';

export function getSavedGitHubConfig(): GitHubSyncConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        autoSyncEnabled: parsed.autoSyncEnabled !== false,
      };
    }
  } catch (e) {
    console.warn('Failed to load GitHub config', e);
  }

  return {
    token: '',
    owner: '',
    repo: 'sinodal-katedral-medan',
    branch: 'main',
    filePath: 'data/sinodal_database.json',
    gistId: '',
    syncMode: 'repo',
    autoSyncEnabled: true,
  };
}

export function saveGitHubConfig(config: GitHubSyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save GitHub config', e);
  }
}

/**
 * Encode string to base64 safely supporting UTF-8 / Indonesian characters
 */
function utf8ToBase64(str: string): string {
  return window.btoa(unescape(encodeURIComponent(str)));
}

/**
 * Decode base64 to UTF-8 string safely
 */
function base64ToUtf8(base64: string): string {
  const cleaned = base64.replace(/\s/g, '');
  return decodeURIComponent(escape(window.atob(cleaned)));
}

/**
 * Prepare full structured database payload
 */
export function buildDatabasePayload(
  tasks: TaskAssignment[],
  members: TeamMember[],
  isFinalMasterLocked: boolean,
  finalMasterDate?: string
): SynodalDatabasePayload {
  return {
    appName: 'Tim Sinodal - Penugasan Konsultasi & Jadwal',
    paroki: 'Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan',
    version: '2.0.0-final-master',
    syncedAt: new Date().toISOString(),
    syncedBy: 'Koordinator Tim Sinodal Katedral Medan',
    settings: {
      isFinalMasterLocked,
      finalMasterDate: finalMasterDate || '',
      totalTasks: tasks.length,
      totalMembers: members.length,
      appTheme: 'katedral-red-amber',
    },
    members,
    tasks,
  };
}

/**
 * Push database to GitHub Repository
 */
export async function pushToGitHubRepo(
  config: GitHubSyncConfig,
  payload: SynodalDatabasePayload,
  customCommitMessage?: string
): Promise<{ success: boolean; commitUrl?: string; message: string }> {
  if (!config.token) {
    throw new Error('Token GitHub (Personal Access Token) belum diisi.');
  }
  if (!config.owner || !config.repo) {
    throw new Error('Nama Pemilik (Owner) dan Nama Repository GitHub harus diisi.');
  }

  const cleanOwner = config.owner.trim();
  const cleanRepo = config.repo.trim();
  const cleanBranch = (config.branch || 'main').trim();
  const cleanPath = (config.filePath || 'data/sinodal_database.json').replace(/^\/+/, '').trim();

  const apiUrl = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}`;

  // 1. Check if file already exists to get its SHA
  let existingSha: string | undefined = undefined;
  try {
    const checkRes = await fetch(`${apiUrl}?ref=${cleanBranch}`, {
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (checkRes.ok) {
      const fileData = await checkRes.json();
      existingSha = fileData.sha;
    }
  } catch (err) {
    console.warn('File check warning:', err);
  }

  // 2. Prepare payload content
  const jsonContent = JSON.stringify(payload, null, 2);
  const base64Content = utf8ToBase64(jsonContent);

  const defaultMsg = `Sync database petugas & pengaturan Tim Sinodal Katedral Medan [${new Date().toLocaleDateString('id-ID')}]`;
  const commitMsg = customCommitMessage
    ? `${customCommitMessage} [${new Date().toLocaleDateString('id-ID')}]`
    : defaultMsg;

  const commitBody: any = {
    message: commitMsg,
    content: base64Content,
    branch: cleanBranch,
  };

  if (existingSha) {
    commitBody.sha = existingSha;
  }

  // 3. Send PUT request
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commitBody),
  });

  if (!putRes.ok) {
    const errorJson = await putRes.json().catch(() => ({ message: putRes.statusText }));
    throw new Error(errorJson.message || `Gagal sync ke GitHub (Status ${putRes.status})`);
  }

  const result = await putRes.json();
  const commitUrl = result?.commit?.html_url || `https://github.com/${cleanOwner}/${cleanRepo}`;

  return {
    success: true,
    commitUrl,
    message: `Berhasil sinkronisasi database (${payload.tasks.length} sasaran, ${payload.members.length} petugas) ke GitHub!`,
  };
}

/**
 * Pull database from GitHub Repository
 */
export async function pullFromGitHubRepo(
  config: GitHubSyncConfig
): Promise<{
  tasks: TaskAssignment[];
  members: TeamMember[];
  settings?: any;
  syncedAt?: string;
}> {
  if (!config.token) {
    throw new Error('Token GitHub (Personal Access Token) belum diisi.');
  }
  if (!config.owner || !config.repo) {
    throw new Error('Nama Pemilik (Owner) dan Nama Repository GitHub harus diisi.');
  }

  const cleanOwner = config.owner.trim();
  const cleanRepo = config.repo.trim();
  const cleanBranch = (config.branch || 'main').trim();
  const cleanPath = (config.filePath || 'data/sinodal_database.json').replace(/^\/+/, '').trim();

  const apiUrl = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?ref=${cleanBranch}`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${config.token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`File ${cleanPath} belum ditemukan di repository ${cleanOwner}/${cleanRepo} (cabang ${cleanBranch}).`);
    }
    const errorJson = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorJson.message || `Gagal mengambil data dari GitHub (Status ${res.status})`);
  }

  const data = await res.json();
  if (!data.content) {
    throw new Error('Konten file kosong.');
  }

  const jsonString = base64ToUtf8(data.content);
  const parsed: SynodalDatabasePayload = JSON.parse(jsonString);

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error('Format file di GitHub tidak memiliki daftar tugas/sasaran yang valid.');
  }

  return {
    tasks: parsed.tasks,
    members: parsed.members || [],
    settings: parsed.settings,
    syncedAt: parsed.syncedAt,
  };
}

/**
 * Push to GitHub Gist
 */
export async function pushToGitHubGist(
  config: GitHubSyncConfig,
  payload: SynodalDatabasePayload
): Promise<{ success: boolean; gistId: string; gistUrl: string; message: string }> {
  if (!config.token) {
    throw new Error('Token GitHub (Personal Access Token) belum diisi.');
  }

  const jsonContent = JSON.stringify(payload, null, 2);
  const gistId = config.gistId?.trim();
  const fileName = 'sinodal_database_katedral_medan.json';

  if (gistId) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Database Petugas & Pengaturan Tim Sinodal Paroki Katedral Medan',
        files: {
          [fileName]: { content: jsonContent },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Gagal update Gist GitHub.');
    }

    const result = await res.json();
    return {
      success: true,
      gistId,
      gistUrl: result.html_url,
      message: 'Berhasil sync data ke GitHub Gist!',
    };
  } else {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Database Petugas & Pengaturan Tim Sinodal Paroki Katedral Medan',
        public: false,
        files: {
          [fileName]: { content: jsonContent },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Gagal membuat Gist GitHub baru.');
    }

    const result = await res.json();
    return {
      success: true,
      gistId: result.id,
      gistUrl: result.html_url,
      message: `Berhasil membuat Gist baru (ID: ${result.id}) dan mengunggah database!`,
    };
  }
}

/**
 * Pull from GitHub Gist
 */
export async function pullFromGitHubGist(
  config: GitHubSyncConfig
): Promise<{
  tasks: TaskAssignment[];
  members: TeamMember[];
  settings?: any;
  syncedAt?: string;
}> {
  if (!config.token) {
    throw new Error('Token GitHub belum diisi.');
  }
  if (!config.gistId) {
    throw new Error('Gist ID belum diisi.');
  }

  const res = await fetch(`https://api.github.com/gists/${config.gistId.trim()}`, {
    headers: {
      Authorization: `Bearer ${config.token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error('Gist tidak ditemukan atau token tidak memiliki izin.');
  }

  const data = await res.json();
  const fileKey = Object.keys(data.files || {})[0];
  if (!fileKey || !data.files[fileKey].content) {
    throw new Error('File dalam Gist tidak ditemukan.');
  }

  const parsed = JSON.parse(data.files[fileKey].content);
  return {
    tasks: parsed.tasks,
    members: parsed.members || [],
    settings: parsed.settings,
    syncedAt: parsed.syncedAt,
  };
}

/**
 * Otomatis menyinkronkan data petugas & pengaturan ke GitHub
 * jika konfigurasi GitHub aktif.
 */
export async function triggerAutoSyncToGitHub(
  tasks: TaskAssignment[],
  members: TeamMember[],
  isFinalMasterLocked: boolean,
  finalMasterDate: string | undefined,
  changeDescription: string = 'Pembaruan data petugas'
): Promise<{
  attempted: boolean;
  success?: boolean;
  message?: string;
  error?: string;
  syncedAt?: string;
}> {
  const config = getSavedGitHubConfig();

  // Jika autoSync dimatikan pengguna atau token belum diisi
  if (config.autoSyncEnabled === false || !config.token.trim()) {
    return {
      attempted: false,
      message: 'Token GitHub belum dikonfigurasi. Data tersimpan di memori perangkat lokal.',
    };
  }

  // Jika mode repo tapi owner/repo belum diisi
  if (config.syncMode === 'repo' && (!config.owner.trim() || !config.repo.trim())) {
    return {
      attempted: false,
      message: 'Owner/Repo GitHub belum lengkap.',
    };
  }

  try {
    const payload = buildDatabasePayload(tasks, members, isFinalMasterLocked, finalMasterDate);

    if (config.syncMode === 'repo') {
      const res = await pushToGitHubRepo(config, payload, `Auto-Sync: ${changeDescription}`);
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      config.lastSyncedAt = now;
      saveGitHubConfig(config);
      return {
        attempted: true,
        success: true,
        message: `Tersinkron otomatis ke GitHub (${now}): ${changeDescription}`,
        syncedAt: now,
      };
    } else {
      const res = await pushToGitHubGist(config, payload);
      config.gistId = res.gistId;
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      config.lastSyncedAt = now;
      saveGitHubConfig(config);
      return {
        attempted: true,
        success: true,
        message: `Tersinkron otomatis ke GitHub Gist (${now})`,
        syncedAt: now,
      };
    }
  } catch (err: any) {
    console.error('Auto-sync to GitHub error:', err);
    return {
      attempted: true,
      success: false,
      error: err.message || 'Gagal auto-sync ke GitHub',
    };
  }
}

