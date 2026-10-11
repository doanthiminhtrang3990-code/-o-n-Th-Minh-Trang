import React, { useState, useMemo, useEffect } from 'react';
import {
  BriefcaseMedical,
  Search,
  AlertTriangle,
  Pill,
  HeartPulse,
  Activity,
  CheckCircle2,
  Clock,
  User,
  Printer,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
  X,
  FileSpreadsheet,
  Download,
  Filter,
  Phone,
  ShieldAlert,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Edit,
  History,
  Building2,
  Upload,
} from 'lucide-react';
import {
  db,
  formatDateVN,
  formatDateTimeVN,
  formatTime24H,
  getCurrentDateISO,
  normalizeManualTime24H,
  removeVietnameseTones,
} from '../services/db';
import {
  STAFF_DEPARTMENTS,
  STAFF_CLINIC_REASONS,
  STAFF_CLINIC_OUTCOMES,
} from '../services/staffData';
import { SchoolStaff, Medicine, MedicalSupply, ClinicVisit } from '../types';
import {
  exportStaffClinicVisitsExcel,
  exportStaffMembersExcel,
  downloadStandardStaffTemplateExcel,
  getFilenameDate,
} from '../services/excelService';
import { DateInputVN } from './DateInputVN';
import { StaffImportExcelModal } from './StaffImportExcelModal';

interface StaffMedicineDispenseProps {
  onSuccess?: (visit: ClinicVisit) => void;
  onNavigateToStudentClinic?: () => void;
}

export const StaffMedicineDispense: React.FC<StaffMedicineDispenseProps> = ({
  onSuccess,
  onNavigateToStudentClinic,
}) => {
  // Navigation tabs within module
  const [activeSubTab, setActiveSubTab] = useState<'dispense' | 'history' | 'directory'>('dispense');

  // DB Listeners
  const [dbTick, setDbTick] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => setDbTick((t) => t + 1));
    return () => unsub();
  }, []);

  const allStaff = useMemo(() => db.getStaffMembers(), [dbTick]);
  const allMedicines = useMemo(() => db.getMedicines(), [dbTick]);
  const allSupplies = useMemo(() => db.getMedicalSupplies(), [dbTick]);
  const staffVisits = useMemo(() => db.getStaffClinicVisits(), [dbTick]);

  // ==========================================
  // DISPENSING FORM STATE
  // ==========================================
  const [selectedStaff, setSelectedStaff] = useState<SchoolStaff | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Visit specifics
  const [visitDate, setVisitDate] = useState(() => getCurrentDateISO());
  const [timeIn, setTimeIn] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [timeOut, setTimeOut] = useState('');
  const [broughtBy, setBroughtBy] = useState('Tự đến');
  const [reason, setReason] = useState<string>('Viêm họng / Khản tiếng / Rát cổ');
  const [customReason, setCustomReason] = useState('');
  const [initialCondition, setInitialCondition] = useState('');

  // Adult Vital Signs
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState<number | ''>(37.0);
  const [pulse, setPulse] = useState<number | ''>(76);
  const [spO2, setSpO2] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');

  // Auto-populate baseline BP when staff selected
  useEffect(() => {
    if (selectedStaff) {
      if (selectedStaff.bloodPressureBaseline) {
        setBloodPressure(selectedStaff.bloodPressureBaseline);
      }
    }
  }, [selectedStaff]);

  // Medicines to dispense
  const [medicinesToDispense, setMedicinesToDispense] = useState<
    Array<{ medicineId: string; quantity: number; dosageInstructions: string }>
  >([]);

  // Supplies to use
  const [suppliesToUse, setSuppliesToUse] = useState<
    Array<{ supplyId: string; quantity: number }>
  >([]);

  // Treatment & Outcome
  const [treatment, setTreatment] = useState('Đã cấp thuốc & hướng dẫn liều dùng');
  const [outcome, setOutcome] = useState('Đã cấp thuốc & về tiếp tục giảng dạy / làm việc');
  const [performer, setPerformer] = useState(() => db.getCurrentUser()?.fullName || 'Cán bộ Y tế');
  const [notes, setNotes] = useState('');

  // Submitting & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedVisit, setSavedVisit] = useState<ClinicVisit | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Staff Management Modals & Forms (Import, Add, Edit, Delete)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<SchoolStaff | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<SchoolStaff | null>(null);

  // Staff Form state
  const [staffFormCode, setStaffFormCode] = useState('');
  const [staffFormFullName, setStaffFormFullName] = useState('');
  const [staffFormGender, setStaffFormGender] = useState<'Nam' | 'Nữ'>('Nữ');
  const [staffFormBirthYear, setStaffFormBirthYear] = useState<number | ''>(1985);
  const [staffFormDept, setStaffFormDept] = useState<string>(STAFF_DEPARTMENTS[1]);
  const [staffFormPosition, setStaffFormPosition] = useState('Giáo viên');
  const [staffFormPhone, setStaffFormPhone] = useState('');
  const [staffFormBaselineBP, setStaffFormBaselineBP] = useState('120/80');
  const [staffFormAllergies, setStaffFormAllergies] = useState('Không');
  const [staffFormConditions, setStaffFormConditions] = useState('Không');
  const [staffFormNotes, setStaffFormNotes] = useState('');

  // Directory search & filter
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [directoryDeptFilter, setDirectoryDeptFilter] = useState('all');

  const resetStaffForm = () => {
    setStaffFormCode('');
    setStaffFormFullName('');
    setStaffFormGender('Nữ');
    setStaffFormBirthYear(1985);
    setStaffFormDept(STAFF_DEPARTMENTS[1]);
    setStaffFormPosition('Giáo viên');
    setStaffFormPhone('');
    setStaffFormBaselineBP('120/80');
    setStaffFormAllergies('Không');
    setStaffFormConditions('Không');
    setStaffFormNotes('');
  };

  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    resetStaffForm();
    setShowAddStaffModal(true);
  };

  const handleOpenEditStaff = (staff: SchoolStaff) => {
    setEditingStaff(staff);
    setStaffFormCode(staff.staffCode || '');
    setStaffFormFullName(staff.fullName || '');
    setStaffFormGender(staff.gender || 'Nữ');
    setStaffFormBirthYear(staff.birthYear || '');
    setStaffFormDept(staff.department || STAFF_DEPARTMENTS[1]);
    setStaffFormPosition(staff.position || 'Giáo viên');
    setStaffFormPhone(staff.phone || '');
    setStaffFormBaselineBP(staff.bloodPressureBaseline || '120/80');
    setStaffFormAllergies(staff.allergies || 'Không');
    setStaffFormConditions(staff.chronicConditions || 'Không');
    setStaffFormNotes(staff.notes || '');
    setShowAddStaffModal(true);
  };

  const handleSubmitStaffForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormFullName.trim()) {
      alert('Vui lòng nhập họ và tên cán bộ / giáo viên');
      return;
    }

    const isTeacher = staffFormPosition.toLowerCase().includes('giáo viên') || staffFormDept.toLowerCase().includes('tổ');
    const roleCategory: 'teacher' | 'staff' = isTeacher ? 'teacher' : 'staff';

    if (editingStaff) {
      db.updateStaffMember(editingStaff.id, {
        staffCode: staffFormCode.trim() || editingStaff.staffCode,
        fullName: staffFormFullName.trim(),
        gender: staffFormGender,
        birthYear: staffFormBirthYear !== '' ? Number(staffFormBirthYear) : undefined,
        department: staffFormDept,
        position: staffFormPosition.trim() || 'Giáo viên',
        roleCategory,
        roleType: roleCategory,
        phone: staffFormPhone.trim() || undefined,
        bloodPressureBaseline: staffFormBaselineBP.trim() || '120/80',
        allergies: staffFormAllergies.trim() || 'Không',
        chronicConditions: staffFormConditions.trim() || 'Không',
        notes: staffFormNotes.trim() || undefined,
      });
      setSuccessMessage(`Đã cập nhật thông tin ${staffFormFullName.trim()} thành công!`);
      setEditingStaff(null);
    } else {
      const generatedCode = staffFormCode.trim() || `${roleCategory === 'teacher' ? 'GV' : 'NV'}${Math.floor(10 + Math.random() * 90)}`;
      const created = db.addStaffMember({
        staffCode: generatedCode,
        fullName: staffFormFullName.trim(),
        gender: staffFormGender,
        birthYear: staffFormBirthYear !== '' ? Number(staffFormBirthYear) : undefined,
        department: staffFormDept,
        position: staffFormPosition.trim() || (roleCategory === 'teacher' ? 'Giáo viên' : 'Nhân viên'),
        roleCategory,
        roleType: roleCategory,
        phone: staffFormPhone.trim() || undefined,
        bloodPressureBaseline: staffFormBaselineBP.trim() || '120/80',
        allergies: staffFormAllergies.trim() || 'Không',
        chronicConditions: staffFormConditions.trim() || 'Không',
        notes: staffFormNotes.trim() || undefined,
      });
      setSuccessMessage(`Đã thêm mới ${created.fullName} (${created.staffCode}) vào danh bạ thành công!`);
      if (activeSubTab === 'dispense') {
        setSelectedStaff(created);
      }
    }

    setShowAddStaffModal(false);
    resetStaffForm();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleStaffImportSuccess = (count: { inserted: number; updated: number }) => {
    setSuccessMessage(`Đã nạp file Excel thành công! Thêm mới ${count.inserted} và cập nhật ${count.updated} nhân sự.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Filtered staff for dropdown/quick pick
  const filteredStaff = useMemo(() => {
    return allStaff.filter((s) => {
      if (departmentFilter !== 'all' && s.department !== departmentFilter) return false;
      if (staffSearchQuery.trim()) {
        const q = removeVietnameseTones(staffSearchQuery.toLowerCase());
        const haystack = removeVietnameseTones(
          `${s.fullName} ${s.staffCode} ${s.department} ${s.position || ''} ${s.phone || ''}`.toLowerCase()
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allStaff, departmentFilter, staffSearchQuery]);

  // Allergy warning check
  const allergyWarning = useMemo(() => {
    if (!selectedStaff || !selectedStaff.allergies || selectedStaff.allergies === 'Không') return null;
    const staffAllergyText = selectedStaff.allergies.toLowerCase();

    for (const item of medicinesToDispense) {
      const med = allMedicines.find((m) => m.id === item.medicineId);
      if (!med) continue;
      const medText = `${med.name} ${med.activeIngredient || ''}`.toLowerCase();
      if (
        staffAllergyText.includes('paracetamol') &&
        (medText.includes('paracetamol') || medText.includes('hapacol') || medText.includes('efferalgan'))
      ) {
        return `NGUY HIỂM: Cán bộ/GV có tiền sử dị ứng "${selectedStaff.allergies}". Thuốc "${med.name}" chứa hoạt chất có nguy cơ gây dị ứng/sốc!`;
      }
      if (
        staffAllergyText.includes('aspirin') &&
        (medText.includes('aspirin') || medText.includes('nsaid'))
      ) {
        return `NGUY HIỂM: Cán bộ/GV có tiền sử "${selectedStaff.allergies}". Cần thận trọng khi dùng "${med.name}"!`;
      }
      if (
        staffAllergyText.includes('penicillin') &&
        (medText.includes('penicillin') || medText.includes('amoxicillin'))
      ) {
        return `CẢNH BÁO DỊ ỨNG: Cán bộ/GV có tiền sử dị ứng "${selectedStaff.allergies}"!`;
      }
    }
    return null;
  }, [selectedStaff, medicinesToDispense, allMedicines]);

  // Blood pressure classification helper
  const bpAssessment = useMemo(() => {
    if (!bloodPressure || !bloodPressure.includes('/')) return null;
    const parts = bloodPressure.split('/');
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    if (isNaN(sys) || isNaN(dia)) return null;

    if (sys >= 160 || dia >= 100) {
      return {
        label: 'TĂNG HUYẾT ÁP ĐỘ 2 (Nguy hiểm)',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        note: 'Huyết áp rất cao! Đề nghị cho bệnh nhân nằm nghỉ ngơi tuyệt đối, đo lại sau 15 phút, cân nhắc chuyển viện nếu có đau đầu dữ dội, khó thở.',
      };
    }
    if (sys >= 140 || dia >= 90) {
      return {
        label: 'TĂNG HUYẾT ÁP ĐỘ 1',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        note: 'Huyết áp vượt ngưỡng bình thường. Cho nghỉ ngơi tĩnh, không làm việc nặng.',
      };
    }
    if (sys >= 120 || dia >= 80) {
      return {
        label: 'TIỀN TĂNG HUYẾT ÁP',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        note: 'Huyết áp bình thường cao.',
      };
    }
    if (sys < 90 || dia < 60) {
      return {
        label: 'HUYẾT ÁP THẤP',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        note: 'Huyết áp thấp, đề phòng choáng váng ngất xỉu. Có thể cho uống trà gừng ấm hoặc nước đường.',
      };
    }
    return {
      label: 'HUYẾT ÁP MỤC TIÊU TỐT (< 120/80)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      note: 'Chỉ số huyết áp người lớn bình thường.',
    };
  }, [bloodPressure]);

  // Quick Adult Medicine Presets
  const handleAddPresetMedicine = (presetName: string) => {
    let targetMed: Medicine | undefined;
    let defaultQty = 1;
    let defaultInstructions = '';

    if (presetName === 'paracetamol') {
      targetMed = allMedicines.find(
        (m) =>
          (m.totalStock ?? m.stock ?? 0) > 0 &&
          (m.name.toLowerCase().includes('hapacol blue') ||
            m.name.toLowerCase().includes('efferalgan') ||
            m.name.toLowerCase().includes('paracetamol'))
      );
      defaultQty = 1;
      defaultInstructions = 'Uống 1 viên sau khi ăn no, cách 4 - 6 giờ nếu còn sốt/đau đầu';
    } else if (presetName === 'eugica') {
      targetMed = allMedicines.find(
        (m) =>
          (m.totalStock ?? m.stock ?? 0) > 0 &&
          m.name.toLowerCase().includes('eugica')
      );
      defaultQty = 2;
      defaultInstructions = 'Ngậm tan từ từ 1 viên/lần khi đau rát họng, ngày ngậm 2-3 viên';
    } else if (presetName === 'alumina') {
      targetMed = allMedicines.find(
        (m) =>
          (m.totalStock ?? m.stock ?? 0) > 0 &&
          (m.name.toLowerCase().includes('alumina') || m.name.toLowerCase().includes('dạ dày'))
      );
      defaultQty = 1;
      defaultInstructions = 'Nhai kỹ 1-2 viên sau bữa ăn 30 phút hoặc ngay khi đau dạ dày / ợ chua';
    } else if (presetName === 'berberin') {
      targetMed = allMedicines.find(
        (m) =>
          (m.totalStock ?? m.stock ?? 0) > 0 &&
          m.name.toLowerCase().includes('berber')
      );
      defaultQty = 2;
      defaultInstructions = 'Uống 2 viên sau ăn khi đau bụng, rối loạn tiêu hóa';
    } else if (presetName === 'oresol') {
      targetMed = allMedicines.find(
        (m) =>
          (m.totalStock ?? m.stock ?? 0) > 0 &&
          m.name.toLowerCase().includes('oresol')
      );
      defaultQty = 1;
      defaultInstructions = 'Pha 1 gói vào đúng 1 lít nước lọc/đun sôi để nguội, uống rải rác trong ngày';
    } else if (presetName === 'salopas') {
      const sup = allSupplies.find(
        (s) =>
          s.quantity > 0 &&
          (s.name.toLowerCase().includes('urgo') || s.name.toLowerCase().includes('băng'))
      );
      if (sup) {
        setSuppliesToUse((prev) => [...prev, { supplyId: sup.id, quantity: 2 }]);
        return;
      }
    }

    if (!targetMed) {
      setErrorMessage(`Thuốc hoặc vật tư thuộc nhóm "${presetName}" hiện đã hết hàng trong kho tủ y tế!`);
      return;
    }

    // Check if already added
    if (medicinesToDispense.some((x) => x.medicineId === targetMed!.id)) {
      setErrorMessage(`Thuốc "${targetMed.name}" đã có trong đơn cấp phát.`);
      return;
    }

    setMedicinesToDispense((prev) => [
      ...prev,
      {
        medicineId: targetMed!.id,
        quantity: defaultQty,
        dosageInstructions: defaultInstructions,
      },
    ]);
  };

  const handleAddMedicineRow = () => {
    const available = allMedicines.find((m) => (m.totalStock ?? m.stock ?? 0) > 0) || allMedicines[0];
    if (!available) {
      setErrorMessage('Kho dược hiện chưa có thuốc nào khả dụng.');
      return;
    }
    setMedicinesToDispense((prev) => [
      ...prev,
      {
        medicineId: available.id,
        quantity: 1,
        dosageInstructions: 'Uống sau ăn theo hướng dẫn của cán bộ y tế',
      },
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setMedicinesToDispense((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSupplyRow = () => {
    const sup = allSupplies.find((s) => s.quantity > 0) || allSupplies[0];
    if (!sup) {
      setErrorMessage('Không có vật tư y tế khả dụng.');
      return;
    }
    setSuppliesToUse((prev) => [...prev, { supplyId: sup.id, quantity: 1 }]);
  };

  const handleRemoveSupplyRow = (index: number) => {
    setSuppliesToUse((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Visit
  const handleSaveVisit = () => {
    if (isSubmitting) return;

    if (!selectedStaff) {
      setErrorMessage('Vui lòng chọn Giáo viên hoặc Cán bộ nhân viên tiếp nhận.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Vui lòng chọn hoặc nhập lý do / triệu chứng.');
      return;
    }

    if (allergyWarning) {
      const confirmAllergy = window.confirm(
        `${allergyWarning}\n\nBạn có CHẮC CHẮN muốn tiếp tục cấp phát thuốc này không?`
      );
      if (!confirmAllergy) return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const finalReason = reason === 'Khác' && customReason ? customReason : reason;
      const isTransfer = outcome.includes('Chuyển viện') || outcome.includes('Chuyển cơ sở y tế');
      const normalizedTimeIn = normalizeManualTime24H(timeIn) || timeIn || '08:00';
      const normalizedTimeOut = timeOut ? normalizeManualTime24H(timeOut) : undefined;

      const newVisit = db.addClinicVisit({
        recipientType: selectedStaff.roleCategory || 'teacher',
        studentId: selectedStaff.id,
        studentCode: selectedStaff.staffCode,
        studentName: selectedStaff.fullName,
        className: selectedStaff.department,
        staffId: selectedStaff.id,
        staffCode: selectedStaff.staffCode,
        staffName: selectedStaff.fullName,
        department: selectedStaff.department,
        position: selectedStaff.position,
        gender: selectedStaff.gender,
        visitDate,
        timeIn: normalizedTimeIn,
        timeOut: normalizedTimeOut,
        dateTime: `${visitDate}T${normalizedTimeIn}:00`,
        broughtBy: broughtBy || 'Tự đến',
        reasons: [finalReason],
        customReason: reason === 'Khác' ? customReason : undefined,
        initialCondition: initialCondition || `Báo ${finalReason}, đến phòng y tế khám và xin thuốc`,
        vitals: {
          bloodPressure: bloodPressure || undefined,
          temperature: temperature !== '' ? Number(temperature) : undefined,
          pulse: pulse !== '' ? Number(pulse) : undefined,
          spO2: spO2 !== '' ? Number(spO2) : undefined,
          weight: weight !== '' ? Number(weight) : undefined,
        },
        treatmentType: treatment,
        treatmentDetails: treatment,
        medicinesUsed: medicinesToDispense.map((m) => {
          const medObj = allMedicines.find((x) => x.id === m.medicineId);
          return {
            medicineId: m.medicineId,
            medicineCode: medObj?.code || '',
            medicineName: medObj?.name || '',
            batchId: '',
            batchNumber: '',
            expDate: '',
            quantity: Number(m.quantity),
            unit: medObj?.unit || 'viên',
            unitPrice: medObj?.unitPrice || 0,
            dosageInstructions: m.dosageInstructions,
          };
        }),
        suppliesUsed: suppliesToUse.map((s) => {
          const supObj = allSupplies.find((x) => x.id === s.supplyId);
          return {
            supplyId: s.supplyId,
            supplyCode: supObj?.code || '',
            supplyName: supObj?.name || '',
            quantity: Number(s.quantity),
            unit: supObj?.unit || 'cái',
          };
        }),
        outcome,
        parentContacted: false,
        isTransferred: isTransfer,
        performer,
        notes: notes || undefined,
      });

      setSavedVisit(newVisit);
      setSuccessMessage(
        `ĐÃ LƯU THÀNH CÔNG! Ca khám & cấp thuốc ${newVisit.visitCode} cho ${selectedStaff.fullName} đã tự động trừ tồn kho theo FEFO và ghi vào sổ theo dõi.`
      );
      setShowReceiptModal(true);

      if (onSuccess) {
        onSuccess(newVisit);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu ca cấp thuốc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setSelectedStaff(null);
    setMedicinesToDispense([]);
    setSuppliesToUse([]);
    setInitialCondition('');
    setBloodPressure('');
    setTemperature(37.0);
    setPulse(76);
    setNotes('');
    setSavedVisit(null);
    setShowReceiptModal(false);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Quick staff creation
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      alert('Vui lòng nhập họ và tên nhân sự');
      return;
    }
    const created = db.addStaffMember({
      staffCode: `GV${Math.floor(100 + Math.random() * 900)}`,
      fullName: newStaffName.trim(),
      roleCategory: newStaffPosition.toLowerCase().includes('giáo viên') ? 'teacher' : 'staff',
      department: newStaffDept,
      position: newStaffPosition,
      gender: newStaffGender,
      phone: newStaffPhone.trim() || undefined,
      allergies: newStaffAllergies.trim() || 'Không',
      chronicConditions: newStaffConditions.trim() || 'Không',
      bloodPressureBaseline: newStaffBaselineBP.trim() || '120/80',
    });

    setSelectedStaff(created);
    setShowAddStaffModal(false);
    setNewStaffName('');
    setNewStaffPhone('');
  };

  // Print prescription / slip
  const handlePrintReceipt = () => {
    window.print();
  };

  // Export Excel
  const handleExportStaffExcel = () => {
    try {
      exportStaffClinicVisitsExcel(
        staffVisits,
        `Trường THCS Đông Thạnh • Tổng số ${staffVisits.length} lượt cấp thuốc cho Cán bộ - Giáo viên - Nhân viên`
      );
    } catch (e: any) {
      alert(`Lỗi xuất Excel: ${e?.message}`);
    }
  };

  // Delete staff visit
  const handleDeleteVisit = (id: string, code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ca cấp thuốc ${code}? Số lượng thuốc sẽ được hoàn trả lại kho dược.`)) {
      db.deleteClinicVisit(id);
    }
  };

  // Today stats
  const todayStaffVisits = useMemo(() => {
    const today = getCurrentDateISO();
    return staffVisits.filter((v) => v.visitDate === today || (v.dateTime && v.dateTime.startsWith(today)));
  }, [staffVisits]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Main Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-teal-200 text-xs font-bold uppercase tracking-wider mb-1">
              <BriefcaseMedical className="w-4 h-4 text-teal-300" />
              <span>Phòng Y Tế Học Đường • Trường THCS Đông Thạnh</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>CẤP THUỐC GIÁO VIÊN & CÔNG NHÂN VIÊN</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-300/40 font-bold">
                GV & CNV
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              Tiếp nhận khám sơ cứu, cấp phát thuốc người lớn theo nguyên tắc FEFO • Theo dõi huyết áp & bệnh nghề nghiệp nhà giáo • Ghi sổ & in phiếu lưu trữ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigateToStudentClinic && (
              <button
                type="button"
                onClick={onNavigateToStudentClinic}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Khám tiếp nhận Học sinh (2.135 HS)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportStaffExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Sổ Excel</span>
            </button>
          </div>
        </div>

        {/* Quick metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-teal-600/50">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-teal-200 font-semibold block">Hôm nay</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-white">{todayStaffVisits.length}</span>
              <span className="text-[10px] text-teal-200">lượt cấp thuốc</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-teal-200 font-semibold block">Tổng lượt GV-CNV</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-white">{staffVisits.length}</span>
              <span className="text-[10px] text-teal-200">ca đã lưu</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-teal-200 font-semibold block">Cán bộ / Giáo viên</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-white">{allStaff.length}</span>
              <span className="text-[10px] text-teal-200">nhân sự</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-teal-200 font-semibold block">Tủ thuốc sẵn sàng</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-emerald-300">{allMedicines.length}</span>
              <span className="text-[10px] text-teal-200">loại khả dụng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('dispense')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'dispense'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>+ Cho Thuốc & Tiếp Nhận Khám</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sổ Theo Dõi Cấp Thuốc GV-CNV ({staffVisits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Danh Bạ & Sức Khỏe GV ({allStaff.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: DISPENSING FORM */}
      {/* ======================================================== */}
      {activeSubTab === 'dispense' && (
        <div className="space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleResetForNext}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
              >
                Tiếp nhận ca tiếp theo
              </button>
            </div>
          )}

          {/* Section 1: Staff Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  I
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase">
                    1. Chọn Giáo Viên / Cán Bộ Công Nhân Viên Tiếp Nhận
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chọn nhanh từ danh sách tổ chuyên môn hoặc tìm kiếm theo họ tên, số điện thoại
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm nhân sự mới</span>
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Gõ tên giáo viên, số điện thoại hoặc mã GV..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium text-xs"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Tất cả tổ / bộ phận ({allStaff.length})</option>
                  {STAFF_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedStaff?.id || ''}
                  onChange={(e) => {
                    const found = allStaff.find((s) => s.id === e.target.value);
                    setSelectedStaff(found || null);
                  }}
                  className="w-full py-2 px-3 border-2 border-teal-500 rounded-xl bg-teal-50/40 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Chọn trực tiếp ({filteredStaff.length} người) --</option>
                  {filteredStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} • {s.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Staff Card */}
            {selectedStaff ? (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                    {selectedStaff.fullName.split(' ').pop()?.[0] || 'G'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{selectedStaff.fullName}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-teal-200/70 text-teal-900 text-[11px] font-bold">
                        {selectedStaff.position || 'Giáo viên'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-[11px] font-bold">
                        {selectedStaff.department}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                      <span>Mã: <strong className="font-mono text-slate-900">{selectedStaff.staffCode}</strong></span>
                      {selectedStaff.phone && (
                        <span>SĐT: <strong className="text-slate-900">{selectedStaff.phone}</strong></span>
                      )}
                      {selectedStaff.bloodPressureBaseline && (
                        <span>Huyết áp nền: <strong className="text-teal-800">{selectedStaff.bloodPressureBaseline} mmHg</strong></span>
                      )}
                      {selectedStaff.birthYear && (
                        <span>Năm sinh: <strong className="text-slate-900">{selectedStaff.birthYear}</strong></span>
                      )}
                    </div>

                    {/* Allergies & Chronic Conditions */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {selectedStaff.allergies && selectedStaff.allergies !== 'Không' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 text-xs font-black border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>DỊ ỨNG: {selectedStaff.allergies}</span>
                        </span>
                      )}
                      {selectedStaff.chronicConditions && selectedStaff.chronicConditions !== 'Không' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                          <HeartPulse className="w-3.5 h-3.5 text-amber-700" />
                          <span>Bệnh nền: {selectedStaff.chronicConditions}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer self-start"
                >
                  Đổi người khác
                </button>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-600">
                  Chưa chọn cán bộ / giáo viên. Vui lòng bấm vào danh sách bên trên để chọn người đến nhận thuốc.
                </p>
                {/* Fast chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                  {allStaff.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStaff(s)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-500 rounded-lg text-[11px] font-bold text-slate-800 transition-colors shadow-2xs"
                    >
                      {s.fullName} ({s.department.replace('Tổ ', '')})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Thời Gian Tiếp Nhận Y Tế (Tự do nhập tay) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  II
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase">
                    2. Thời Gian Tiếp Nhận Y Tế (Tự Do Nhập Tay)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cán bộ y tế có thể tự do gõ tay ngày và giờ theo đúng thời điểm ca tiếp nhận thực tế
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-200 self-start sm:self-auto">
                Tự nhập tay ngày & giờ 24h
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Ngày tiếp nhận */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ngày tiếp nhận (dd/mm/yyyy) <span className="text-rose-600">*</span>
                </label>
                <DateInputVN
                  required
                  value={visitDate}
                  onChange={(val) => setVisitDate(val || getCurrentDateISO())}
                  placeholder="dd/mm/yyyy"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium"
                />
              </div>

              {/* Giờ vào (24h) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Giờ vào (24h - tự gõ tay) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={timeIn}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isDeleting = val.length < timeIn.length;
                      let cleaned = val.replace(/[^0-9:]/g, '');
                      if (!isDeleting && !cleaned.includes(':') && cleaned.length === 4) {
                        cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
                      }
                      setTimeIn(cleaned.slice(0, 5));
                    }}
                    onBlur={() => {
                      if (timeIn.trim()) {
                        setTimeIn(normalizeManualTime24H(timeIn));
                      }
                    }}
                    placeholder="VD: 07:30"
                    maxLength={5}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const d = new Date();
                      setTimeIn(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                    }}
                    title="Điền giờ hiện tại"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Định dạng 24h (VD: 08:15)</span>
              </div>

              {/* Giờ ra / Hoàn thành */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Giờ ra (24h - tùy chọn)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={timeOut}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isDeleting = val.length < timeOut.length;
                      let cleaned = val.replace(/[^0-9:]/g, '');
                      if (!isDeleting && !cleaned.includes(':') && cleaned.length === 4) {
                        cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
                      }
                      setTimeOut(cleaned.slice(0, 5));
                    }}
                    onBlur={() => {
                      if (timeOut.trim()) {
                        setTimeOut(normalizeManualTime24H(timeOut));
                      }
                    }}
                    placeholder="VD: 08:30"
                    maxLength={5}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      const d = new Date();
                      setTimeOut(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                    }}
                    title="Điền giờ hiện tại"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Thời điểm đỡ / về tiếp tục làm việc</span>
              </div>

              {/* Hình thức đến */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hình thức đến
                </label>
                <select
                  value={broughtBy}
                  onChange={(e) => setBroughtBy(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Tự đến">Tự đến phòng y tế</option>
                  <option value="Đồng nghiệp đưa sang">Đồng nghiệp đưa sang</option>
                  <option value="Học sinh báo">Học sinh báo tin</option>
                  <option value="Ban Giám Hiệu điều phối">Ban Giám Hiệu điều phối</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Adult Symptoms & Vital Signs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                III
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  3. Khám Triệu Chứng Lâm Sàng & Chỉ Số Sinh Tồn Người Lớn
                </h2>
                <p className="text-xs text-slate-500">
                  Đo huyết áp, nhiệt độ và ghi nhận lý do giáo viên đến phòng y tế
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              {/* Reason / Symptom */}
              <div className="sm:col-span-12 space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Triệu chứng / Lý do đến phòng y tế <span className="text-rose-600">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 text-xs"
                >
                  {STAFF_CLINIC_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {reason === 'Khác' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Nhập lý do chi tiết..."
                    className="w-full p-2 border border-slate-200 rounded-xl font-medium text-xs mt-1"
                  />
                )}

                {/* Quick reason presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    'Viêm họng / Khản tiếng / Rát cổ',
                    'Đau đầu / Căng thẳng / Mệt mỏi',
                    'Sốt / Cảm cúm / Gai rét',
                    'Tăng huyết áp / Choáng váng / Hoa mắt',
                    'Đau dạ dày cấp / Trào ngược / Ợ nóng',
                    'Đau mỏi vai gáy / Thoái hóa cột sống / Đau lưng',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                        reason === preset
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.split('/')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial condition text */}
              <div className="sm:col-span-12">
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả tình trạng ban đầu của bệnh nhân
                </label>
                <input
                  type="text"
                  value={initialCondition}
                  onChange={(e) => setInitialCondition(e.target.value)}
                  placeholder="VD: Cán bộ mệt mỏi sau 3 tiết dạy, đau rát cổ họng, nói khó nghe, không sốt cao..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Adult Vital Signs Grid */}
              <div className="sm:col-span-12 pt-2 border-t border-slate-100">
                <span className="block font-bold text-slate-800 text-xs mb-2">
                  Chỉ số sinh tồn đo thực tế tại phòng y tế:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* Blood Pressure */}
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Huyết áp (mmHg) <span className="text-teal-700">*Quan trọng</span>
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                    />
                    {bpAssessment && (
                      <div className={`mt-1.5 p-1.5 rounded-lg border text-[11px] font-bold ${bpAssessment.badgeClass}`}>
                        <span>{bpAssessment.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nhiệt độ (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="37.0"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                    {typeof temperature === 'number' && temperature >= 37.5 && (
                      <span className="text-[10px] font-bold text-rose-600 block mt-1">⚠️ Sốt ({temperature}°C)</span>
                    )}
                  </div>

                  {/* Pulse */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mạch (nhịp/phút)</label>
                    <input
                      type="number"
                      placeholder="76"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* SpO2 */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      placeholder="98"
                      value={spO2}
                      onChange={(e) => setSpO2(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {bpAssessment && bpAssessment.note && (
                  <p className="text-[11px] text-slate-500 mt-2 font-medium italic">
                    💡 Khuyến cáo lâm sàng: {bpAssessment.note}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Medicine Selection (FEFO Stock Deduction) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  IV
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase">
                    4. Kê Đơn & Cấp Phát Thuốc Người Lớn (Tự Động Trừ Kho FEFO)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chọn nhanh các phác đồ thông dụng hoặc thêm thuốc tự chọn từ tủ y tế học đường
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Thuốc</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSupplyRow}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BriefcaseMedical className="w-3.5 h-3.5" />
                  <span>+ Vật tư y tế</span>
                </button>
              </div>
            </div>

            {/* Allergy interlock alert */}
            {allergyWarning && (
              <div className="p-4 bg-rose-100 border-2 border-rose-500 text-rose-900 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <span>{allergyWarning}</span>
              </div>
            )}

            {/* Quick 1-click adult medicine presets */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                ⚡ Chọn nhanh nhóm thuốc điều trị thường gặp cho Giáo viên & CNV:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddPresetMedicine('paracetamol')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Pill className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hạ sốt, giảm đau đầu (Paracetamol 500mg)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddPresetMedicine('eugica')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dịu ho, rát họng khản tiếng (Eugica ngậm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddPresetMedicine('alumina')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Pill className="w-3.5 h-3.5 text-purple-600" />
                  <span>Đau dạ dày / Ợ chua (Alumina nhai)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddPresetMedicine('berberin')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Pill className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rối loạn tiêu hóa (Berberin 100mg)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddPresetMedicine('oresol')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Pill className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Bù nước & điện giải (Oresol)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddPresetMedicine('salopas')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <BriefcaseMedical className="w-3.5 h-3.5 text-rose-600" />
                  <span>Băng cá nhân Urgo sơ cứu</span>
                </button>
              </div>
            </div>

            {/* Medicines List Table */}
            {medicinesToDispense.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Chưa chọn thuốc cấp phát cho ca này. Bấm vào các nút gợi ý nhanh ở trên hoặc nút <strong>"+ Thêm Thuốc"</strong>.
                </p>
                <p className="text-[11px] text-slate-400">
                  (Nếu ca này chỉ cần nghỉ ngơi hoặc sơ cứu không dùng thuốc, bạn có thể để trống danh sách thuốc)
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
                <div className="bg-slate-100 p-2.5 grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-700 uppercase">
                  <div className="col-span-4">Tên thuốc & Tồn kho</div>
                  <div className="col-span-2 text-center">Số lượng cấp</div>
                  <div className="col-span-5">Hướng dẫn liều dùng & Cách uống</div>
                  <div className="col-span-1 text-center">Xóa</div>
                </div>

                {medicinesToDispense.map((row, idx) => {
                  const currentMed = allMedicines.find((m) => m.id === row.medicineId);
                  const availableStock = currentMed?.totalStock ?? currentMed?.stock ?? 0;
                  const isStockShort = row.quantity > availableStock;

                  return (
                    <div key={idx} className="p-3 bg-white grid grid-cols-12 gap-2 items-center text-xs">
                      {/* Medicine picker */}
                      <div className="col-span-4">
                        <select
                          value={row.medicineId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setMedicinesToDispense((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, medicineId: newId } : item))
                            );
                          }}
                          className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                        >
                          {allMedicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Tồn: {m.totalStock ?? m.stock ?? 0} {m.unit})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                          Hàm lượng: {currentMed?.strength || '---'} • Tồn kho: {availableStock} {currentMed?.unit}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={availableStock || 99}
                            value={row.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setMedicinesToDispense((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                              );
                            }}
                            className={`w-full p-2 border rounded-xl font-black text-center text-sm ${
                              isStockShort ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200'
                            }`}
                          />
                          <span className="absolute right-2 top-2.5 text-[10px] text-slate-400 font-bold">
                            {currentMed?.unit || 'viên'}
                          </span>
                        </div>
                        {isStockShort && (
                          <span className="text-[10px] text-rose-600 font-bold block mt-0.5 text-center">
                            Vượt tồn kho!
                          </span>
                        )}
                      </div>

                      {/* Dosage instructions */}
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={row.dosageInstructions}
                          onChange={(e) => {
                            const txt = e.target.value;
                            setMedicinesToDispense((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, dosageInstructions: txt } : item))
                            );
                          }}
                          placeholder="VD: Uống 1 viên sau ăn, cách 4-6h nếu còn sốt..."
                          className="w-full p-2 border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {/* Delete row */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa thuốc này"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Medical Supplies Used */}
            {suppliesToUse.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="block font-bold text-slate-800 text-xs mb-2">
                  Vật tư tiêu hao sơ cứu đi kèm:
                </span>
                <div className="space-y-2">
                  {suppliesToUse.map((row, idx) => {
                    const sup = allSupplies.find((s) => s.id === row.supplyId);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <select
                          value={row.supplyId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setSuppliesToUse((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, supplyId: newId } : item))
                            );
                          }}
                          className="flex-1 p-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                        >
                          {allSupplies.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} (Tồn: {s.quantity} {s.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          max={sup?.quantity || 99}
                          value={row.quantity}
                          onChange={(e) => {
                            const q = Math.max(1, Number(e.target.value));
                            setSuppliesToUse((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, quantity: q } : item))
                            );
                          }}
                          className="w-20 p-1.5 border border-slate-200 rounded-lg font-bold text-center"
                        />
                        <span className="text-slate-500 font-medium text-xs">{sup?.unit || 'cái'}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplyRow(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Treatment Handling, Outcome & Sign-off */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                V
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase">
                  5. Hướng Xử Trí, Kết Quả & Ký Nhận
                </h2>
                <p className="text-xs text-slate-500">
                  Ghi nhận diễn biến sau dùng thuốc và người phụ trách ca tiếp nhận
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              <div className="sm:col-span-6 space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Biện pháp xử trí cụ thể <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="VD: Cho uống 1 viên Hapacol Blue sau ăn, nằm nghỉ 20 phút..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-6 space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Kết quả sau xử trí <span className="text-rose-600">*</span>
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  {STAFF_CLINIC_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6 space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Cán bộ Y tế thực hiện
                </label>
                <input
                  type="text"
                  value={performer}
                  onChange={(e) => setPerformer(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-6 space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Ghi chú bổ sung (nếu có)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Dặn dò uống nhiều nước ấm, nếu sốt lại đo huyết áp..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span>* Sau khi lưu, phiếu sẽ tự động trừ tồn kho theo FEFO và lưu vào Sổ cấp thuốc GV-CNV.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Làm mới biểu mẫu
                </button>

                <button
                  type="button"
                  onClick={handleSaveVisit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-teal-200" />
                  )}
                  <span>LƯU CA & XUẤT KHO FEFO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: HISTORY LOG OF STAFF CLINIC VISITS */}
      {/* ======================================================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Sổ Theo Dõi Khám & Cấp Thuốc Giáo Viên - Nhân Viên
              </h3>
              <p className="text-xs text-slate-500">
                Toàn bộ lịch sử các ca tiếp nhận y tế và cấp phát thuốc cho cán bộ giáo viên trường THCS Đông Thạnh
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportStaffExcel}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Xuất Excel Sổ Cấp Thuốc</span>
              </button>
            </div>
          </div>

          {/* Visits Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Mã ca</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Họ tên CB-GV</th>
                    <th className="p-3">Tổ bộ môn / Chức vụ</th>
                    <th className="p-3">Huyết áp / Thân nhiệt</th>
                    <th className="p-3">Lý do / Triệu chứng</th>
                    <th className="p-3">Thuốc đã cấp</th>
                    <th className="p-3">Kết quả</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {staffVisits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                        Chưa có ca cấp thuốc nào cho Giáo viên / Nhân viên trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    staffVisits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-lg">
                            {v.visitCode}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {v.dateTime
                            ? formatDateTimeVN(v.dateTime)
                            : v.visitDate
                            ? `${v.timeIn ? v.timeIn + ' ' : ''}${formatDateVN(v.visitDate)}`
                            : '---'}
                        </td>
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                          {v.staffName || v.studentName}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {v.department || v.className}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {v.vitals?.bloodPressure ? (
                            <span className="font-black text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mr-1.5">
                              {v.vitals.bloodPressure}
                            </span>
                          ) : null}
                          {v.vitals?.temperature ? (
                            <span className="font-bold text-slate-700">
                              {v.vitals.temperature}°C
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {v.reason || (v.reasons && v.reasons.length > 0 ? v.reasons.join(', ') : '---')}
                        </td>
                        <td className="p-3 max-w-xs">
                          {v.medicinesUsed && v.medicinesUsed.length > 0 ? (
                            <div className="space-y-0.5">
                              {v.medicinesUsed.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-[11px] font-bold text-teal-800">
                                  <Pill className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span>{m.medicineName} ({m.quantity} {m.unit})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chỉ sơ cứu / nghỉ ngơi</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {v.outcome}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSavedVisit(v);
                                setShowReceiptModal(true);
                              }}
                              className="p-1 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="In phiếu tiếp nhận cấp thuốc"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteVisit(v.id, v.visitCode)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa ca này và hoàn trả kho"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: STAFF DIRECTORY & HEALTH PROFILES */}
      {/* ======================================================== */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 uppercase">
                  Danh bạ nhân sự
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Cán Bộ - Giáo Viên & Hồ Sơ Theo Dõi Sức Khỏe
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Trường THCS Đông Thạnh • Quản lý {allStaff.length} cán bộ, giáo viên, nhân viên, huyết áp nền và bệnh nghề nghiệp
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Import Excel button matching screenshot */}
              <button
                id="btn-import-staff-excel"
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                title="Nhập danh sách Giáo viên & CNV từ tệp Excel (.xlsx)"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
              </button>

              {/* Export Excel button */}
              <button
                type="button"
                onClick={() => exportStaffMembersExcel(allStaff)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="Tải danh bạ ra tệp Excel (.xlsx)"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Excel</span>
              </button>

              {/* Add new staff button */}
              <button
                type="button"
                onClick={handleOpenAddStaff}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Nhân Sự Mới</span>
              </button>
            </div>
          </div>

          {/* Search & Department Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo họ tên, mã nhân sự, số điện thoại, bệnh nền, dị ứng..."
                value={directorySearchQuery}
                onChange={(e) => setDirectorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 whitespace-nowrap font-medium">Tổ / Bộ phận:</span>
              <select
                value={directoryDeptFilter}
                onChange={(e) => setDirectoryDeptFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Tất cả tổ / phòng ban ({allStaff.length})</option>
                {STAFF_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Grid */}
          {directoryFilteredStaff.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Không tìm thấy cán bộ, giáo viên nào phù hợp với bộ lọc.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDirectorySearchQuery('');
                  setDirectoryDeptFilter('all');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directoryFilteredStaff.map((staff) => {
                const staffPastVisits = staffVisits.filter((v) => v.staffId === staff.id || v.studentId === staff.id);

                return (
                  <div
                    key={staff.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 font-black text-sm flex items-center justify-center border border-teal-200">
                            {staff.fullName.split(' ').pop()?.[0] || 'G'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{staff.fullName}</h4>
                            <span className="text-[11px] text-slate-500 block">
                              {staff.position} • {staff.department}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {staff.staffCode}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Giới tính / Năm sinh:</span>
                          <span className="font-semibold text-slate-800">
                            {staff.gender || '---'} {staff.birthYear ? `• ${staff.birthYear}` : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Huyết áp nền:</span>
                          <strong className="text-teal-900 font-bold">{staff.bloodPressureBaseline || '120/80'} mmHg</strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tiền sử dị ứng:</span>
                          <span className={`font-bold ${staff.allergies && staff.allergies !== 'Không' ? 'text-rose-600' : 'text-slate-700'}`}>
                            {staff.allergies || 'Không'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Bệnh nền:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={staff.chronicConditions}>
                            {staff.chronicConditions || 'Không'}
                          </span>
                        </div>

                        {staff.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Điện thoại:</span>
                            <span className="font-mono text-slate-700">{staff.phone}</span>
                          </div>
                        )}

                        {staff.notes && (
                          <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                            Ghi chú: {staff.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Đã cấp thuốc: <strong className="text-teal-900">{staffPastVisits.length} lần</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStaff(staff)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin cán bộ / giáo viên"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmStaff(staff)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Xóa khỏi danh bạ trường"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setActiveSubTab('dispense');
                          }}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Tiếp nhận cấp phát thuốc cho nhân sự này"
                        >
                          <Pill className="w-3.5 h-3.5" />
                          <span>Cho thuốc</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK ADD STAFF */}
      {/* ======================================================== */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-base text-slate-900">Thêm Giáo Viên / Công Nhân Viên Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên nhân sự <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cô Hoàng Thị Lan hoặc Thầy Trần Văn Nam..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ bộ môn / Phòng ban</label>
                  <select
                    value={newStaffDept}
                    onChange={(e) => setNewStaffDept(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs bg-white"
                  >
                    {STAFF_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chức vụ / Vị trí</label>
                  <input
                    type="text"
                    placeholder="VD: Giáo viên Toán, Kế toán..."
                    value={newStaffPosition}
                    onChange={(e) => setNewStaffPosition(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={newStaffGender}
                    onChange={(e) => setNewStaffGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs bg-white"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0908xxxxxx"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Huyết áp nền</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={newStaffBaselineBP}
                    onChange={(e) => setNewStaffBaselineBP(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiền sử dị ứng thuốc / thực phẩm
                </label>
                <input
                  type="text"
                  placeholder="VD: Dị ứng Penicillin, dị ứng Aspirin, hoặc ghi 'Không'..."
                  value={newStaffAllergies}
                  onChange={(e) => setNewStaffAllergies(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bệnh nền / Vấn đề sức khỏe cần lưu ý
                </label>
                <input
                  type="text"
                  placeholder="VD: Đau dạ dày, Tăng huyết áp, Đau cột sống..."
                  value={newStaffConditions}
                  onChange={(e) => setNewStaffConditions(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Lưu Nhân Sự & Tiếp Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRINT RECEIPT A4/A5 */}
      {/* ======================================================== */}
      {showReceiptModal && savedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-700" />
                <h3 className="font-black text-slate-900 text-base">
                  Phiếu Chỉ Định & Cấp Phát Thuốc Cán Bộ - Giáo Viên ({savedVisit.visitCode})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-4 py-1.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu A4/A5</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Container */}
            <div id="print-staff-visit-slip" className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 text-xs font-serif">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <p className="font-bold uppercase text-[11px]">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH</p>
                  <p className="font-black text-sm uppercase">TRƯỜNG THCS ĐÔNG THẠNH</p>
                  <p className="text-[11px] italic">Bộ phận Y tế học đường</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-sm text-slate-900">{savedVisit.visitCode}</p>
                  <p className="text-[10px] text-slate-500">Mã phiếu y tế</p>
                  <p className="text-[11px]">Ngày: {formatDateVN(savedVisit.visitDate)}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  PHIẾU KHÁM & CHỈ ĐỊNH DÙNG THUỐC CÁN BỘ - GIÁO VIÊN
                </h2>
                <p className="text-[11px] text-slate-600 italic">
                  (Dành cho Giáo viên, Công nhân viên trường THCS Đông Thạnh)
                </p>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 gap-2 text-xs border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                <p>Họ và tên: <strong className="text-slate-900 text-sm font-sans">{savedVisit.staffName || savedVisit.studentName}</strong></p>
                <p>Tổ chuyên môn: <strong className="text-slate-900">{savedVisit.department || savedVisit.className}</strong></p>
                <p>Thời gian tiếp nhận: <strong>{savedVisit.timeIn || '08:00'} - {formatDateVN(savedVisit.visitDate)}</strong></p>
                <p>Chức vụ: <strong>{savedVisit.position || 'Giáo viên'}</strong></p>
                <p>Huyết áp đo: <strong>{savedVisit.vitals?.bloodPressure || '120/80 mmHg'}</strong></p>
                <p>Thân nhiệt: <strong>{savedVisit.vitals?.temperature ? `${savedVisit.vitals.temperature}°C` : '37.0°C'}</strong></p>
                <p className="col-span-2">Lý do khám / Triệu chứng: <strong>{savedVisit.reason || (savedVisit.reasons || []).join(', ')}</strong></p>
              </div>

              {/* Prescribed Medicines */}
              <div>
                <p className="font-bold uppercase text-[11px] text-slate-900 mb-1.5">
                  I. THUỐC VÀ VẬT TƯ ĐÃ CẤP PHÁT (TRỪ KHO DƯỢC FEFO):
                </p>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2 text-center w-10">STT</th>
                      <th className="border border-slate-300 p-2 text-left">Tên thuốc / Nồng độ</th>
                      <th className="border border-slate-300 p-2 text-center w-20">Số lượng</th>
                      <th className="border border-slate-300 p-2 text-left">Hướng dẫn sử dụng & Liều uống</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(savedVisit.medicinesUsed || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border border-slate-300 p-2 text-center text-slate-400 italic">
                          Không cấp thuốc uống, chỉ nghỉ ngơi và sơ cứu
                        </td>
                      </tr>
                    ) : (
                      (savedVisit.medicinesUsed || []).map((m, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-bold font-sans">{m.medicineName}</td>
                          <td className="border border-slate-300 p-2 text-center font-bold font-sans">
                            {m.quantity} {m.unit}
                          </td>
                          <td className="border border-slate-300 p-2 italic">{m.dosageInstructions || 'Uống sau ăn'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Outcome & Handling */}
              <div className="border border-slate-200 p-3 rounded-xl space-y-1">
                <p>Xử trí y tế: <strong>{savedVisit.treatment || savedVisit.treatmentDetails}</strong></p>
                <p>Kết quả theo dõi: <strong>{savedVisit.outcome}</strong></p>
                {savedVisit.notes && <p>Dặn dò bổ sung: <em>{savedVisit.notes}</em></p>}
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="font-bold uppercase">NGƯỜI NHẬN THUỐC</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-14" />
                  <p className="font-bold text-slate-900 font-sans">{savedVisit.staffName || savedVisit.studentName}</p>
                </div>

                <div>
                  <p className="text-[11px] italic">Đông Thạnh, ngày {formatDateVN(savedVisit.visitDate)}</p>
                  <p className="font-bold uppercase">CÁN BỘ Y TẾ PHỤ TRÁCH</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-14" />
                  <p className="font-bold text-slate-900 font-sans">{savedVisit.performer || 'Nhân viên Y tế'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
