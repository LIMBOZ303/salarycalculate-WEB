import { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut, MapPin, RefreshCw } from 'lucide-react';
import {
  EmployeeCard,
  EmployeeSectionTitle,
  EmployeeStatusBadge,
} from '../../components/employee/EmployeeUI';
import Button from '../../components/Button';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatLiveClock } from '../../utils/formatDate';
import { getEmployeeBranchName } from '../../utils/employeeDisplay';
import { getApiMessage } from '../../utils/parseApiData';

const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [branchName, setBranchName] = useState('--');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    employeeService
      .getMe()
      .then((profile) => setBranchName(getEmployeeBranchName(profile, user)))
      .catch(() => setBranchName(getEmployeeBranchName(null, user)));
  }, [user]);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('unsupported');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('permission_denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('unavailable');
        } else {
          setLocationError('timeout');
        }
      },
      GPS_OPTIONS
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const buildPayload = () => {
    if (!location) throw new Error('Chưa có vị trí GPS. Vui lòng bật quyền vị trí.');
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    };
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceService.checkIn(buildPayload());
      showToast('Chấm vào thành công!');
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await attendanceService.checkOut(buildPayload());
      showToast('Chấm ra thành công!');
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const gpsReady = Boolean(location) && !locating;
  const gpsLabel = locationError === 'permission_denied'
    ? 'Chưa cấp quyền'
    : locationError
      ? 'Không xác định được'
      : locating
        ? 'Đang lấy vị trí...'
        : 'Sẵn sàng';

  const gpsVariant = gpsReady ? 'success' : locationError ? 'warning' : 'default';

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <p className="text-xs text-[#64748B]">Giờ hiện tại</p>
        <p className="text-4xl font-semibold text-[#0F172A] tabular-nums tracking-tight mt-1">
          {formatLiveClock(now)}
        </p>
      </div>

      <EmployeeCard>
        <EmployeeSectionTitle
          action={<EmployeeStatusBadge variant={gpsVariant}>{gpsLabel}</EmployeeStatusBadge>}
        >
          Trạng thái GPS
        </EmployeeSectionTitle>

        {locationError === 'permission_denied' ? (
          <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E] space-y-2">
            <p className="font-medium">Cần bật quyền vị trí</p>
            <p className="text-xs leading-relaxed">
              Trên iPhone: Cài đặt → Safari → Vị trí → Cho phép. Sau đó tải lại trang.
              GPS hoạt động tốt nhất trên HTTPS.
            </p>
          </div>
        ) : location ? (
          <div className="flex items-start gap-2 text-sm text-[#64748B]">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]" />
            <div>
              <p className="font-mono text-xs text-[#0F172A]">
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </p>
              {location.accuracy != null && (
                <p className="text-xs mt-1">Độ chính xác ±{Math.round(location.accuracy)}m</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#64748B]">Đang xác định vị trí...</p>
        )}

        <button
          type="button"
          onClick={fetchLocation}
          disabled={locating}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          Cập nhật vị trí
        </button>
      </EmployeeCard>

      <EmployeeCard>
        <EmployeeSectionTitle>Chi nhánh</EmployeeSectionTitle>
        <p className="text-sm font-medium text-[#0F172A]">{branchName}</p>
      </EmployeeCard>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={!gpsReady || checkingIn}
          className="rounded-2xl bg-[#16A34A] text-white py-5 px-3 flex flex-col items-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          <LogIn className="w-6 h-6" />
          <span className="text-sm font-semibold">{checkingIn ? 'Đang xử lý...' : 'Chấm vào'}</span>
        </button>
        <button
          type="button"
          onClick={handleCheckOut}
          disabled={!gpsReady || checkingOut}
          className="rounded-2xl bg-[#2563EB] text-white py-5 px-3 flex flex-col items-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-sm font-semibold">{checkingOut ? 'Đang xử lý...' : 'Chấm ra'}</span>
        </button>
      </div>

      <p className="text-center text-xs text-[#94A3B8] px-2">
        Vui lòng chấm công tại đúng chi nhánh làm việc
      </p>
    </div>
  );
}
