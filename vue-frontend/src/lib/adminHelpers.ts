// Admin Helpers - Reusable functions for admin pages
// API URL configuration
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

// Function to check authentication
export function checkAdminAuth(): boolean {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Function to load mitra data with optional filter
export async function loadMitraData(filter: 'all' | 'approved' | 'pending' = 'all'): Promise<any[]> {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/admin/mitra`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch mitra data');
  }

  const result = await response.json();

  if (result.success && result.data) {
    let mitras = result.data;

    // Apply filter
    if (filter === 'approved') {
      mitras = mitras.filter((mitra: any) => mitra.status === 'approved');
    } else if (filter === 'pending') {
      mitras = mitras.filter((mitra: any) => mitra.status === 'pending');
    }

    return mitras;
  }

  return [];
}

// Function to render table rows - OPTIMIZED
export function renderTableRows(mitras: any[], tableBody: HTMLElement): void {
  if (mitras.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center justify-center space-y-4">
            <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <div>
              <p class="text-lg font-semibold text-gray-600">Tidak ada data</p>
              <p class="text-sm text-gray-500 mt-1">Belum ada mitra yang terdaftar</p>
            </div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // OPTIMIZED: Use string concatenation with reduced DOM manipulation
  const rows: string[] = [];
  
  for (let i = 0; i < mitras.length; i++) {
    const mitra = mitras[i];
    const statusClass = mitra.status === 'approved' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    
    const statusText = mitra.status === 'approved' ? 'Disetujui' : 'Pending';
    
    // Get sub brand - only show if RM Nusantara and has valid submenu
    const validSubBrands = ['Masakan Mas Gawa', 'Warnas', 'Mas Gaw'];
    let subBrandBadge = '-';
    
    if (mitra.paketUsaha === 'RM Nusantara' && mitra.rmNusantaraSubMenu && validSubBrands.includes(mitra.rmNusantaraSubMenu)) {
      subBrandBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
        ${mitra.rmNusantaraSubMenu}
      </span>`;
    } else {
      subBrandBadge = '<span class="text-gray-400">-</span>';
    }

    rows.push(`
      <tr class="hover:bg-orange-50/30 transition-optimized">
        <td class="px-6 py-4">
          <div class="font-medium text-gray-900">${mitra.namaMitra || mitra.nama || '-'}</div>
        </td>
        <td class="px-6 py-4 text-gray-700">${mitra.email || '-'}</td>
        <td class="px-6 py-4 text-gray-700">${mitra.noHp || '-'}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            ${mitra.paketUsaha || '-'}
          </span>
        </td>
        <td class="px-6 py-4">${subBrandBadge}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} border">
            ${statusText}
          </span>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center space-x-2">
            <button onclick="viewMitraDetail('${mitra._id}')" 
              class="inline-flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-optimized">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              Detail
            </button>
            ${mitra.status === 'pending' ? `
              <button onclick="approveMitra('${mitra._id}')" 
                class="inline-flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-optimized">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Setujui
              </button>
            ` : ''}
            <button onclick="deleteMitra('${mitra._id}')" 
              class="inline-flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-optimized">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `);
  }
  
  // Single DOM update instead of multiple
  tableBody.innerHTML = rows.join('');
}

// Function to approve mitra
export async function approveMitra(mitraId: string): Promise<boolean> {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/mitra/${mitraId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to approve mitra');
    }

    return true;
  } catch (error) {
    console.error('Error approving mitra:', error);
    return false;
  }
}

// Function to delete mitra
export async function deleteMitra(mitraId: string): Promise<boolean> {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/mitra/${mitraId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete mitra');
    }

    return true;
  } catch (error) {
    console.error('Error deleting mitra:', error);
    return false;
  }
}

// Function to get mitra detail
export async function getMitraDetail(mitraId: string): Promise<any> {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/mitra/${mitraId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch mitra detail');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching mitra detail:', error);
    return null;
  }
}

// Format currency helper
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
