/**
 * Utility helper functions for formatting dates, currencies, and numbers
 */

/**
 * Format date to Vietnamese format: ngày/tháng/năm (DD/MM/YYYY)
 * Robust against timezone skew and handles YYYY-MM-DD, DD/MM/YYYY, ISO strings, etc.
 */
export function formatDateVN(dateStr: string | undefined | null): string {
  if (!dateStr) return '---';
  const str = String(dateStr).trim();
  if (!str) return '---';

  // 1. Matches Vietnamese formula "ngày 10 tháng 05 năm 2014" or "10 tháng 5 năm 2014"
  const textFormulaMatch = str.match(/(?:ngày\s+)?(\d{1,2})\s*(?:tháng|\/|-|\.)\s*(\d{1,2})\s*(?:năm|\/|-|\.)\s*(\d{4})/i);
  if (textFormulaMatch) {
    const [, d, m, y] = textFormulaMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // 2. Matches YYYY-MM-DD or YYYY/MM/DD (e.g. 2014-04-12)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // 3. Matches DD/MM/YYYY or DD-MM-YYYY (e.g. 12/04/2014)
  const dmyMatch = str.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // 4. Fallback for Date objects or other parsable strings
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return str;
  }
}

/**
 * Định dạng ngày theo công thức văn bản hành chính: "ngày DD tháng MM năm YYYY"
 * hoặc "[Địa danh], ngày DD tháng MM năm YYYY"
 */
export function formatDateFormulaVN(
  dateVal?: string | Date | null,
  includeLocation = false,
  location = 'Đông Thạnh'
): string {
  if (!dateVal) return '';
  let d: Date;
  if (dateVal instanceof Date) {
    d = dateVal;
  } else {
    const str = String(dateVal).trim();
    // Match "ngày 10 tháng 5 năm 2014"
    const textFormulaMatch = str.match(/(?:ngày\s+)?(\d{1,2})\s*(?:tháng|\/|-|\.)\s*(\d{1,2})\s*(?:năm|\/|-|\.)\s*(\d{4})/i);
    if (textFormulaMatch) {
      d = new Date(parseInt(textFormulaMatch[3], 10), parseInt(textFormulaMatch[2], 10) - 1, parseInt(textFormulaMatch[1], 10));
    } else {
      const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (ymdMatch) {
        d = new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
      } else {
        const dmyMatch = str.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})/);
        if (dmyMatch) {
          d = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
        } else {
          d = new Date(str);
        }
      }
    }
  }

  if (isNaN(d.getTime())) return String(dateVal);

  const day = String(d.getDate()).padStart(2, '0');
  const month = d.getMonth() + 1;
  const monthStr = month < 3 ? String(month).padStart(2, '0') : String(month);
  const year = d.getFullYear();

  const formula = `ngày ${day} tháng ${monthStr} năm ${year}`;
  return includeLocation && location ? `${location}, ${formula}` : formula;
}

/**
 * Normalize any date input (DD/MM/YYYY, YYYY-MM-DD, Excel serial number, Date, công thức ngày tháng) to ISO YYYY-MM-DD
 */
export function normalizeDateToISO(dateVal?: any): string {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '';
    // Avoid UTC timezone day-shift
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(dateVal).trim();
  if (!str) return '';

  // 1. Text formula: "ngày 10 tháng 05 năm 2014" or "10 tháng 5 năm 2014"
  const textFormulaMatch = str.match(/(?:ngày\s+)?(\d{1,2})\s*(?:tháng|\/|-|\.)\s*(\d{1,2})\s*(?:năm|\/|-|\.)\s*(\d{4})/i);
  if (textFormulaMatch) {
    const [, d, m, y] = textFormulaMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 2. Excel serial number (e.g. 41741 or 41741.0)
  if (/^\d{4,5}(\.\d+)?$/.test(str)) {
    const num = Math.floor(parseFloat(str));
    if (num > 1000 && num < 100000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 4. YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return str;
}

/**
 * Chuẩn hóa và hiển thị giờ theo định dạng 24 giờ (HH:mm)
 * Ví dụ: "14:35", "08:05", "2:30 PM" -> "14:30", "2026-03-30T14:35:00" -> "14:35"
 */
export function formatTime24H(timeInput?: string | Date | null): string {
  if (!timeInput) return '';
  if (timeInput instanceof Date) {
    if (isNaN(timeInput.getTime())) return '';
    const h = String(timeInput.getHours()).padStart(2, '0');
    const m = String(timeInput.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  const str = String(timeInput).trim();
  if (!str) return '';

  // Trường hợp chuỗi ISO hoặc có 'T': "2026-03-30T14:35:00"
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }

  // Trường hợp định dạng 12 giờ AM/PM: "02:30 PM", "8:15 am"
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const isPM = ampmMatch[3].toUpperCase() === 'PM';
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Trường hợp "HH:mm" hoặc "H:m" hoặc "HH:mm:ss"
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    const h = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
    const m = timeMatch[2];
    return `${h}:${m}`;
  }

  // Fallback parse Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  return str;
}

/**
 * Chuẩn hóa giờ điền tay từ người dùng thành định dạng 24 giờ (HH:mm)
 * Hỗ trợ người dùng gõ tự do bằng bàn phím:
 * - "14:30", "14.30", "14h30", "14 30" -> "14:30"
 * - "8:15", "8h15", "8.15", "8 15" -> "08:15"
 * - "8", "8h", "08" -> "08:00"
 * - "14", "14h" -> "14:00"
 * - "1430" (4 chữ số) -> "14:30"
 * - "830" (3 chữ số) -> "08:30"
 * - "2:30 PM", "8 AM" -> "14:30", "08:00"
 */
export function normalizeManualTime24H(input?: string | null): string {
  if (!input) return '';
  const str = input.trim();
  if (!str) return '';

  // 12-hour format AM/PM (VD "2:30 PM", "8 AM")
  const ampmMatch = str.match(/^(\d{1,2})(?:[:\.hH](\d{1,2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPM = ampmMatch[3].toUpperCase() === 'PM';
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    hours = Math.min(23, Math.max(0, hours));
    const m = Math.min(59, Math.max(0, minutes));
    return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Dấu phân cách :, ., h, H, khoảng trắng, gạch ngang (VD "14:30", "8:15", "14h30", "8.30")
  const separatorMatch = str.match(/^(\d{1,2})[:\.hH\s\-](\d{1,2})$/);
  if (separatorMatch) {
    const hours = Math.min(23, Math.max(0, parseInt(separatorMatch[1], 10)));
    const minutes = Math.min(59, Math.max(0, parseInt(separatorMatch[2], 10)));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 4 chữ số liền nhau (VD "1430", "0815")
  const fourDigitMatch = str.match(/^(\d{2})(\d{2})$/);
  if (fourDigitMatch) {
    const hours = Math.min(23, Math.max(0, parseInt(fourDigitMatch[1], 10)));
    const minutes = Math.min(59, Math.max(0, parseInt(fourDigitMatch[2], 10)));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 3 chữ số liền nhau (VD "830" -> 08:30)
  const threeDigitMatch = str.match(/^(\d{1})(\d{2})$/);
  if (threeDigitMatch) {
    const hours = Math.min(23, Math.max(0, parseInt(threeDigitMatch[1], 10)));
    const minutes = Math.min(59, Math.max(0, parseInt(threeDigitMatch[2], 10)));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Chỉ gõ giờ (VD "8", "14", "8h", "14h")
  const hourOnlyMatch = str.match(/^(\d{1,2})[hH]?$/);
  if (hourOnlyMatch) {
    const hours = Math.min(23, Math.max(0, parseInt(hourOnlyMatch[1], 10)));
    return `${String(hours).padStart(2, '0')}:00`;
  }

  return str;
}

/**
 * Hiển thị Ngày và Giờ theo chuẩn 24 giờ (HH:mm DD/MM/YYYY)
 * Ví dụ: "14:35 30/03/2026"
 */
export function formatDateTimeVN(dateStr?: string | Date | null, timeIn?: string | null): string {
  if (!dateStr) return '';

  // Nếu truyền riêng timeIn và dateStr (ví dụ dateStr = "2026-03-30", timeIn = "14:35")
  if (timeIn && typeof dateStr === 'string' && !dateStr.includes('T')) {
    const t = formatTime24H(timeIn);
    const d = formatDateVN(dateStr);
    return t ? `${t} ${d}` : d;
  }

  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function formatVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 đ';
  return amount.toLocaleString('vi-VN') + ' đ';
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
}

export function getDaysRemaining(expDateStr: string | undefined | null): number {
  if (!expDateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expDateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Chuẩn hóa tên lớp học: loại bỏ tiền tố thừa như "Lớp ", "Lop ", "Khối "
 * Ví dụ: "Lớp 6/1" -> "6/1", "Lop 7A1" -> "7A1", "Khối 8 - 8/2" -> "8/2"
 */
export function normalizeStudentClassName(name?: string | null): string {
  if (!name) return '';
  let s = String(name).trim();
  s = s.replace(/^(?:lớp|lop|khối|khoi)\s*[-:]*\s*/i, '');
  // If format like "Khối 7 - 7A1"
  s = s.replace(/^khối\s*\d+\s*[-–]\s*/i, '');
  return s.trim();
}

/**
 * Trích xuất khối học (Khối 6, 7, 8, 9 hoặc từ 1 đến 12) chính xác và đa năng:
 * Nhận diện từ giá trị cột Khối, tên Lớp học hoặc tên Sheet trong tệp Excel.
 * Khắc phục hoàn toàn lỗi tất cả học sinh bị gán nhầm về Khối 6 khi import.
 */
export function extractGradeFromClassOrGrade(
  gradeVal?: any,
  className?: string | null,
  sheetName?: string | null
): number {
  // 1. Kiểm tra giá trị từ cột Khối / Grade
  if (gradeVal !== undefined && gradeVal !== null) {
    if (typeof gradeVal === 'number' && !isNaN(gradeVal) && gradeVal >= 1 && gradeVal <= 12) {
      return gradeVal;
    }
    const s = String(gradeVal).trim();
    if (s) {
      // Matches "Khối 7", "K7", "7", "Khối 8", "grade 9"
      const match = s.match(/(?:khối\s*|k\s*|grade\s*)?([1-9]|1[0-2])\b/i);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (parsed >= 1 && parsed <= 12) return parsed;
      }
    }
  }

  // 2. Kiểm tra từ tên lớp học (VD: "7A1", "Lớp 7/1", "8B", "Lớp 8/2", "9A3", "6/1")
  if (className) {
    const s = String(className).trim();
    // Bắt đầu bằng tiền tố lớp hoặc trực tiếp bằng số khối 1..12
    const match = s.match(/(?:lớp\s*|lop\s*|khối\s*|k\s*)?([1-9]|1[0-2])(?=[\/A-Za-z\.\-\s]|$)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 1 && parsed <= 12) return parsed;
    }
    // Fallback: bất kỳ số 1..12 nào đứng đầu
    const anyDigit = s.match(/([1-9]|1[0-2])/);
    if (anyDigit && anyDigit[1]) {
      const parsed = parseInt(anyDigit[1], 10);
      if (parsed >= 1 && parsed <= 12) return parsed;
    }
  }

  // 3. Kiểm tra từ tên Sheet (VD: "Khối 7", "Sheet 7A", "K8", "Khối 9", "7A1")
  if (sheetName) {
    const s = String(sheetName).trim();
    const match = s.match(/(?:khối\s*|k\s*|grade\s*|sheet\s*)?([1-9]|1[0-2])\b/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 1 && parsed <= 12) return parsed;
    }
  }

  return 6; // Mặc định THCS khối 6 nếu không xác định được
}

/**
 * Lấy các thành phần ngày giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7)
 */
export function getVietnamDateParts(date: Date = new Date()): {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    let hours = getPart('hour');
    if (hours === '24') hours = '00';
    return {
      year: getPart('year'),
      month: getPart('month'),
      day: getPart('day'),
      hours: hours.padStart(2, '0'),
      minutes: getPart('minute').padStart(2, '0'),
      seconds: getPart('second').padStart(2, '0'),
    };
  } catch {
    return {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      hours: String(date.getHours()).padStart(2, '0'),
      minutes: String(date.getMinutes()).padStart(2, '0'),
      seconds: String(date.getSeconds()).padStart(2, '0'),
    };
  }
}

export function getCurrentDateISO(): string {
  const p = getVietnamDateParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function getCurrentDateVN(): string {
  const p = getVietnamDateParts(new Date());
  return `${p.day}/${p.month}/${p.year}`;
}

export function getCurrentTimeVN(): string {
  const p = getVietnamDateParts(new Date());
  return `${p.hours}:${p.minutes}`;
}

export function isoToVNDate(value?: string | null): string {
  if (!value) return '';
  const formatted = formatDateVN(value);
  return formatted === '---' ? '' : formatted;
}

export function parseVNDateToISO(vnDate?: string | null): string {
  if (!vnDate) return '';
  const iso = normalizeDateToISO(vnDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return '';
    return iso;
  }
  return '';
}

/**
 * Loại bỏ dấu tiếng Việt để hỗ trợ tìm kiếm nhanh không dấu hoặc có dấu
 */
export function removeVietnameseTones(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kiểm tra học sinh có khớp từ khóa tìm kiếm (hỗ trợ có dấu, không dấu, mã HS, lớp 6/1 hoặc 6A1, SĐT, phụ huynh)
 */
export function matchesStudentSearch(
  student: {
    fullName?: string;
    studentCode?: string;
    className?: string;
    parentName?: string;
    parentPhone?: string;
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
    citizenId?: string;
    healthInsuranceCode?: string;
  },
  query?: string | null
): boolean {
  if (!query || !query.trim()) return true;
  const rawQ = query.trim().toLowerCase();
  const normQ = removeVietnameseTones(rawQ);
  if (!normQ) return true;

  const fullNameLower = (student.fullName || '').toLowerCase();
  const fullNameNorm = removeVietnameseTones(student.fullName);
  const codeLower = (student.studentCode || '').toLowerCase();
  const classLower = (student.className || '').toLowerCase();
  const classAlt = classLower.replace(/[\/.\-]/g, 'a');
  const classSlash = classLower.replace(/[a-z.\-]/gi, '/');
  const qSlash = rawQ.replace(/[a-z.\-]/gi, '/');

  if (
    fullNameLower.includes(rawQ) ||
    fullNameNorm.includes(normQ) ||
    codeLower.includes(rawQ) ||
    classLower.includes(rawQ) ||
    classAlt.includes(rawQ) ||
    (qSlash.includes('/') && classSlash.includes(qSlash))
  ) {
    return true;
  }

  // Multi-word token matching (e.g. "tuan 6/1" or "an 6a1" or "tran anh")
  const tokens = normQ.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    const combinedNorm = `${fullNameNorm} ${codeLower} ${classLower} ${classAlt} ${classSlash}`;
    if (tokens.every((tk) => combinedNorm.includes(tk))) {
      return true;
    }
  }

  const extraFields = [
    student.parentName,
    student.parentPhone,
    student.fatherName,
    student.fatherPhone,
    student.motherName,
    student.motherPhone,
    student.citizenId,
    student.healthInsuranceCode,
  ]
    .filter(Boolean)
    .join(' ');

  if (extraFields) {
    if (extraFields.toLowerCase().includes(rawQ) || removeVietnameseTones(extraFields).includes(normQ)) {
      return true;
    }
  }

  return false;
}


