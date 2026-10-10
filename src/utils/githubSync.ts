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
    scheduledCount: number;
    appTheme: string;
  };
  members: TeamMember[];
  tasks: TaskAssignment[];
}

const STORAGE_KEY_CONFIG = 'sinodal_github_sync_config_v1';

export function getSavedGitHubConfig(): GitHubSyncConfig {
  let envToken = '';
  let envOwner = '';
  let envRepo = 'sinodal-katedral-medan';
  let envBranch = 'main';

  try {
    envToken = (import.meta.env.VITE_GITHUB_TOKEN as string) || '';
    envOwner = (import.meta.env.VITE_GITHUB_OWNER as string) || '';
    envRepo = (import.meta.env.VITE_GITHUB_REPO as string) || 'sinodal-katedral-medan';
    envBranch = (import.meta.env.VITE_GITHUB_BRANCH as string) || 'main';
  } catch {}

  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        token: parsed.token || envToken,
        owner: parsed.owner || envOwner,
        repo: parsed.repo || envRepo,
        branch: parsed.branch || envBranch,
        filePath: parsed.filePath || 'data/sinodal_database.json',
        gistId: parsed.gistId || '',
        syncMode: parsed.syncMode || 'repo',
        lastSyncedAt: parsed.lastSyncedAt,
        autoSyncEnabled: parsed.autoSyncEnabled !== false,
      };
    }
  } catch (e) {
    console.warn('Failed to load GitHub config', e);
  }

  return {
    token: envToken,
    owner: envOwner,
    repo: envRepo,
    branch: envBranch,
    filePath: 'data/sinodal_database.json',
    gistId: '',
    syncMode: 'repo',
    autoSyncEnabled: true,
  };
}

/**
 * Tes koneksi ke GitHub untuk memverifikasi token dan hak akses repository
 */
export async function testGitHubConnection(config: GitHubSyncConfig): Promise<{
  success: boolean;
  message: string;
  userName?: string;
  repoFullName?: string;
}> {
  if (!config.token.trim()) {
    return { success: false, message: 'Token GitHub (Personal Access Token) belum diisi.' };
  }

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${config.token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      if (userRes.status === 401) {
        return { success: false, message: 'Token GitHub tidak valid atau telah kedaluwarsa (401 Unauthorized).' };
      }
      return { success: false, message: `Gagal verifikasi token (HTTP ${userRes.status})` };
    }

    const userData = await userRes.json();
    const userName = userData.login;

    if (config.syncMode === 'repo' && config.owner && config.repo) {
      const repoRes = await fetch(
        `https://api.github.com/repos/${config.owner.trim()}/${config.repo.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${config.token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!repoRes.ok) {
        return {
          success: false,
          userName,
          message: `Token valid (user: ${userName}), namun repository "${config.owner}/${config.repo}" tidak dapat diakses (HTTP ${repoRes.status}). Pastikan nama repo tepat dan token memiliki izin scope 'repo'.`,
        };
      }

      const repoData = await repoRes.json();
      return {
        success: true,
        userName,
        repoFullName: repoData.full_name,
        message: `Terhubung sukses! Akun: ${userName}, Repo: ${repoData.full_name}`,
      };
    }

    return {
      success: true,
      userName,
      message: `Token GitHub valid atas nama akun: ${userName}.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghubungi server GitHub. Periksa koneksi internet.',
    };
  }
}

export function saveGitHubConfig(config: GitHubSyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save GitHub config', e);
  }
}

/**
 * Modern UTF-8 safe base64 encoding (supports all Indonesian characters, special symbols, and emoji)
 */
function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (e) {
    // Fallback
    return window.btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Modern UTF-8 safe base64 decoding
 */
function base64ToUtf8(base64: string): string {
  try {
    const cleaned = base64.replace(/\s/g, '');
    const binary = window.atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    // Fallback
    const cleaned = base64.replace(/\s/g, '');
    return decodeURIComponent(escape(window.atob(cleaned)));
  }
}

/**
 * Prepare full structured database payload with all Lingkungan and Kategorial schedule fields
 */
export function buildDatabasePayload(
  tasks: TaskAssignment[],
  members: TeamMember[],
  isFinalMasterLocked: boolean,
  finalMasterDate?: string
): SynodalDatabasePayload {
  // Clean tasks: preserve 100% of all schedule fields while safely removing huge base64 photos
  // to avoid GitHub's strict 1MB Contents API limit
  const sanitizedTasks: TaskAssignment[] = tasks.map((t) => {
    const clean: TaskAssignment = {
      id: t.id,
      namaDpl: t.namaDpl,
      category: t.category,
      focusId: t.focusId,
      focusKonsultasi: t.focusKonsultasi,
      fasilitator: t.fasilitator,
      notulen: t.notulen,
      // Jadwal Lingkungan & Kategorial
      tanggalKonsultasi: t.tanggalKonsultasi || '',
      hari: t.hari || '',
      jam: t.jam || '',
      kontakPic: t.kontakPic || '',
      status: t.status || 'belum_ditentukan',
      // Pelaksanaan
      terlaksana: Boolean(t.terlaksana),
      tempat: t.tempat || t.lokasiPelaksanaan || '',
      lokasiPelaksanaan: t.lokasiPelaksanaan || t.tempat || '',
      jumlahPeserta: t.jumlahPeserta !== undefined ? t.jumlahPeserta : '',
      catatan: t.catatan || '',
      fotoNama: t.fotoNama || (t.fotoDokumentasi ? 'dokumentasi-tersimpan-lokal' : ''),
      updatedAt: t.updatedAt || new Date().toISOString(),
      locked: Boolean(t.locked),
      lockedAt: t.lockedAt || '',
    };
    return clean;
  });

  const scheduledCount = sanitizedTasks.filter(
    (t) => Boolean(t.tanggalKonsultasi) || t.status === 'terjadwal' || t.status === 'selesai'
  ).length;

  return {
    appName: 'Tim Sinodal - Penugasan Konsultasi & Jadwal Lingkungan/Kategorial',
    paroki: 'Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan',
    version: '2.0.0-final-master',
    syncedAt: new Date().toISOString(),
    syncedBy: 'Koordinator Tim Sinodal Katedral Medan',
    settings: {
      isFinalMasterLocked,
      finalMasterDate: finalMasterDate || '',
      totalTasks: sanitizedTasks.length,
      totalMembers: members.length,
      scheduledCount,
      appTheme: 'katedral-red-amber',
    },
    members,
    tasks: sanitizedTasks,
  };
}

/**
 * Fetch latest file SHA from GitHub with cache-busting to prevent 409 Conflict
 */
async function fetchLatestFileSha(
  apiUrl: string,
  token: string,
  branch: string
): Promise<string | undefined> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}&_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch (err) {
    console.warn('Failed fetching latest file SHA:', err);
  }
  return undefined;
}

/**
 * Push database to GitHub Repository with auto 409 conflict resolution
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

  // 1. Get current SHA with cache busting
  let existingSha = await fetchLatestFileSha(apiUrl, config.token.trim(), cleanBranch);

  // 2. Prepare payload content
  const jsonContent = JSON.stringify(payload, null, 2);
  const base64Content = utf8ToBase64(jsonContent);

  const scheduledCount = payload.tasks.filter((t) => Boolean(t.tanggalKonsultasi)).length;
  const defaultMsg = `Sync jadwal (${scheduledCount} terjadwal) & data Tim Sinodal Katedral Medan [${new Date().toLocaleDateString('id-ID')}]`;
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
  let putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commitBody),
  });

  // 4. Handle 409 Conflict: auto-fetch latest SHA and retry once
  if (putRes.status === 409) {
    console.warn('GitHub returned 409 Conflict (stale SHA). Retrying with fresh SHA...');
    const freshSha = await fetchLatestFileSha(apiUrl, config.token.trim(), cleanBranch);
    if (freshSha) {
      commitBody.sha = freshSha;
      putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitBody),
      });
    }
  }

  if (!putRes.ok) {
    const errorJson = await putRes.json().catch(() => ({ message: putRes.statusText }));
    throw new Error(errorJson.message || `Gagal sync ke GitHub (Status ${putRes.status})`);
  }

  const result = await putRes.json();
  const commitUrl = result?.commit?.html_url || `https://github.com/${cleanOwner}/${cleanRepo}`;

  return {
    success: true,
    commitUrl,
    message: `Berhasil sinkronisasi ke GitHub! (${scheduledCount} kunjungan terjadwal tersimpan aman).`,
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
  const timestamp = Date.now();
  const apiUrl = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${cleanPath}?ref=${encodeURIComponent(cleanBranch)}&_t=${timestamp}`;

  const res = await fetch(apiUrl, {
    cache: 'no-store',
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
    throw new Error('Konten file di GitHub kosong.');
  }

  const jsonString = base64ToUtf8(data.content);
  const parsed: SynodalDatabasePayload = JSON.parse(jsonString);

  if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
    throw new Error('Format file di GitHub tidak memiliki daftar tugas/kunjungan yang valid.');
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
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Gagal mengambil data dari GitHub Gist.');
  }

  const data = await res.json();
  const fileName = 'sinodal_database_katedral_medan.json';
  const fileObj = data.files?.[fileName] || Object.values(data.files || {})[0] as any;

  if (!fileObj || !fileObj.content) {
    throw new Error('Konten database tidak ditemukan di Gist ini.');
  }

  const parsed: SynodalDatabasePayload = JSON.parse(fileObj.content);
  return {
    tasks: parsed.tasks,
    members: parsed.members || [],
    settings: parsed.settings,
    syncedAt: parsed.syncedAt,
  };
}

/**
 * Otomatis menyinkronkan data tugas & jadwal ke GitHub
 */
export async function triggerAutoSyncToGitHub(
  tasks: TaskAssignment[],
  members: TeamMember[],
  isFinalMasterLocked: boolean,
  finalMasterDate: string | undefined,
  changeDescription: string = 'Pembaruan data jadwal'
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
      message: 'Token GitHub belum dikonfigurasi. Data tersimpan di memori perangkat lokal dan Cloud Firestore.',
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
