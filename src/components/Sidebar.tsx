import React, { useMemo, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Pill,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ClockAlert,
  AlertTriangle,
  BriefcaseMedical,
  Truck,
  BarChart3,
  Settings,
  X,
  ShieldCheck,
  ClipboardCheck,
  Stethoscope,
  Users,
  Activity,
  Printer,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  HeartPulse,
  LogOut,
} from 'lucide-react';
import { db, getRoleLabel } from '../services/db';

export type NavTab =
  | 'dashboard'
  | 'clinic_reception'
  | 'staff_dispense'
  | 'clinic_visits'
  | 'students'
  | 'school_health'
  | 'medicines'
  | 'import'
  | 'import_medicine'
  | 'export'
  | 'export_medicine'
  | 'stock_balance'
  | 'inventory_check'
  | 'usage_book'
  | 'stock'
  | 'stock_report'
  | 'expiry_tracking'
  | 'low_stock'
  | 'supplies'
  | 'suppliers'
  | 'reports'
  | 'comprehensive_reports'
  | 'medication_usage'
  | 'supply_usage'
  | 'print_templates'
  | 'audit_logs'
  | 'settings';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  onSelectTab: (tab: any) => void;
  isOpen?: boolean;
  isOpenMobile?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  metrics?: {
    expiredCount: number;
    expiringSoonCount: number;
    lowStockCount: number;
    totalMedicineTypes: number;
  };
}

const SidebarComponent: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  isOpen,
  isOpenMobile,
  onClose,
  onCloseMobile,
  onLogout,
  metrics: propsMetrics,
}) => {
  const current = activeTab || currentTab || 'dashboard';
  const open = isOpenMobile ?? isOpen ?? false;
  const handleClose = onCloseMobile || onClose || (() => {});

  const [dbTick, setDbTick] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDbTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  const metrics = useMemo(() => propsMetrics || db.getDashboardMetrics(), [propsMetrics, dbTick]);
  const pendingChecks = useMemo(() => db.getInventoryChecks().filter((c) => c.status === 'draft').length, [dbTick]);
  const studentsCount = useMemo(() => db.getStudents().length, [dbTick]);
  const visitsToday = useMemo(() => {
    return db.getTodayClinicVisits().length;
  }, [dbTick]);

  const currentUser = useMemo(() => db.getCurrentUser(), [dbTick]);
  const rolePermissions = useMemo(() => db.getCurrentRolePermissions(), [dbTick]);

  const rawSections = [
    {
      title: 'KHÁM & SỨC KHỎE HỌC SINH',
      items: [
        {
          id: 'dashboard',
          label: 'Trang chủ tổng quan',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'clinic_reception',
          label: 'Tiếp nhận khám sơ cứu',
          icon: Stethoscope,
          badge: 'Sơ cứu & FEFO',
          badgeColor: 'bg-rose-100 text-rose-800',
        },
        {
          id: 'staff_dispense',
          label: 'Cho thuốc Giáo viên & CNV',
          icon: BriefcaseMedical,
          badge: 'GV & NV',
          badgeColor: 'bg-teal-100 text-teal-800 font-bold',
        },
        {
          id: 'clinic_visits',
          label: 'Sổ theo dõi phòng y tế',
          icon: BookOpen,
          badge: visitsToday > 0 ? `${visitsToday} ca hôm nay` : null,
          badgeColor: 'bg-purple-100 text-purple-800',
        },
        {
          id: 'students',
          label: 'Hồ sơ sức khỏe học sinh',
          icon: Users,
          badge: `${studentsCount} HS`,
          badgeColor: 'bg-blue-100 text-blue-800',
        },
        {
          id: 'school_health',
          label: 'Tai nạn & Khám định kỳ',
          icon: Activity,
          badge: null,
        },
      ],
    },
    {
      title: 'QUẢN LÝ THUỐC & KHO DƯỢC',
      items: [
        {
          id: 'medicines',
          label: 'Quản lý thuốc',
          icon: Pill,
          badge: `${metrics.totalMedicineTypes} loại`,
          badgeColor: 'bg-slate-100 text-slate-700',
        },
        {
          id: 'import_medicine',
          label: 'Nhập thuốc vào tủ y tế',
          icon: ArrowDownLeft,
          badge: null,
        },
        {
          id: 'export_medicine',
          label: 'Xuất cấp phát (Hạn gần)',
          icon: ArrowUpRight,
          badge: 'FEFO',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'stock_balance',
          label: 'Sổ nhập - xuất - tồn kho',
          icon: BookOpen,
          badge: 'Mẫu A4',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'inventory_check',
          label: 'Kiểm kê kho định kỳ',
          icon: ClipboardCheck,
          badge: pendingChecks > 0 ? `${pendingChecks} chờ duyệt` : 'Chuẩn',
          badgeColor: pendingChecks > 0 ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800',
        },
        {
          id: 'stock_report',
          label: 'Tồn kho theo hạn dùng',
          icon: Boxes,
          badge: null,
        },
        {
          id: 'expiry_tracking',
          label: 'Theo dõi thuốc hết hạn',
          icon: ClockAlert,
          badge: metrics.expiredCount > 0 ? `${metrics.expiredCount} hết hạn` : null,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
        {
          id: 'low_stock',
          label: 'Thuốc dưới mức dự trữ',
          icon: AlertTriangle,
          badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} loại` : null,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
        {
          id: 'supply_usage',
          label: 'Vật tư tiêu hao sơ cứu',
          icon: BriefcaseMedical,
          badge: null,
        },
      ],
    },
    {
      title: 'BÁO CÁO, MẪU IN & HỆ THỐNG',
      items: [
        {
          id: 'comprehensive_reports',
          label: 'Báo cáo công tác y tế',
          icon: BarChart3,
          badge: null,
        },
        {
          id: 'medication_usage',
          label: 'Truy xuất thuốc - Học sinh',
          icon: FileSpreadsheet,
          badge: 'FEFO',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'print_templates',
          label: 'Mẫu in sổ A4 chuẩn Bộ',
          icon: Printer,
          badge: 'A4',
          badgeColor: 'bg-slate-100 text-slate-700',
        },
        {
          id: 'audit_logs',
          label: 'Bảo mật & Phân quyền',
          icon: ShieldCheck,
          badge: 'Quản trị',
          badgeColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        },
        {
          id: 'settings',
          label: 'Cài đặt & Sao lưu dữ liệu',
          icon: Settings,
          badge: 'Quản trị',
          badgeColor: 'bg-indigo-100 text-indigo-800',
        },
      ],
    },
  ];

  // Chỉ hiển thị các phần được cấp quyền trên ứng dụng
  const sections = useMemo(() => {
    void rolePermissions;
    return rawSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => db.canAccessTab(item.id)),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [dbTick, rolePermissions, metrics, pendingChecks, studentsCount, visitsToday]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* School branding header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-emerald-200/60">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                Y Tế Học Đường
              </p>
              <p className="text-[11px] text-slate-500 font-medium">THCS Đông Thạnh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            title="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Health Summary Pill */}
        <div className="mx-3 my-2.5 px-3 py-2 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-900 text-[11px]">Phòng Y Tế Sẵn Sàng</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
            Hôm nay: {visitsToday} ca
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {sec.title}
              </p>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  current === item.id ||
                  (item.id === 'import_medicine' && current === 'import') ||
                  (item.id === 'export_medicine' && current === 'export') ||
                  (item.id === 'stock_report' && current === 'stock') ||
                  (item.id === 'comprehensive_reports' && current === 'reports');

                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      handleClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 whitespace-nowrap ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User profile & safety advice footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-300">
                {currentUser?.fullName?.charAt(0) || 'Y'}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                  {currentUser?.fullName?.split('(')[0]?.trim() || 'Cán bộ Y tế'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {getRoleLabel(currentUser?.role || 'medic')}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Online
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 truncate">
              KT dị ứng trước khi cấp thuốc.
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);
