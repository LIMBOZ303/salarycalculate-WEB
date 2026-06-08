import { useCallback, useEffect, useState } from 'react';
import { MapPin, LogIn, LogOut, AlertCircle, Navigation } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../contexts/ToastContext';
import { getApiMessage } from '../../utils/parseApiData';

const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

export default function EmployeeAttendance() {
  const { showToast } = useToast();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS.');
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
          setLocationError('Không thể xác định vị trí. Vui lòng thử lại.');
        } else {
          setLocationError('Hết thời gian chờ GPS. Vui lòng thử lại.');
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
      const payload = buildPayload();
      await attendanceService.checkIn(payload);
      showToast('Chấm vào thành công!');
      fetchLocation();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const payload = buildPayload();
      await attendanceService.checkOut(payload);
      showToast('Chấm ra thành công!');
      fetchLocation();
    } catch (err) {
      showToast(getApiMessage(err), 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Vị trí GPS" subtitle="Cần bật GPS để chấm công chính xác">
        {locationError === 'permission_denied' ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-2">
                <p className="font-semibold">Chưa có quyền truy cập vị trí</p>
                <p className="text-xs text-amber-700">
                  Trên iPhone, mở <strong>Cài đặt</strong> → <strong>Safari</strong> →{' '}
                  <strong>Vị trí</strong> → chọn <strong>Cho phép</strong>, sau đó tải lại trang.
                </p>
                <p className="text-xs text-amber-600">
                  Lưu ý: GPS chỉ hoạt động tốt trên HTTPS.
                </p>
              </div>
            </div>
          </div>
        ) : locationError ? (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-700">
            {locationError}
          </div>
        ) : location ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-brand-50 rounded-xl p-4">
              <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-slate-800">Đã xác định vị trí</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
                {location.accuracy != null && (
                  <p className="text-xs text-brand-600 mt-1 font-medium">
                    Độ chính xác: ±{Math.round(location.accuracy)}m
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <Navigation className="w-4 h-4 animate-pulse" />
            Đang lấy vị trí GPS...
          </div>
        )}

        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={fetchLocation}
          loading={locating}
        >
          <Navigation className="w-4 h-4" />
          Cập nhật vị trí
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="success"
          size="lg"
          className="flex-col h-auto py-5 gap-2"
          onClick={handleCheckIn}
          loading={checkingIn}
          disabled={!location || locating}
        >
          <LogIn className="w-6 h-6" />
          Chấm vào
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-col h-auto py-5 gap-2"
          onClick={handleCheckOut}
          loading={checkingOut}
          disabled={!location || locating}
        >
          <LogOut className="w-6 h-6" />
          Chấm ra
        </Button>
      </div>

      <p className="text-center text-xs text-slate-400 px-4">
        Đảm bảo bạn đang ở đúng chi nhánh khi chấm công
      </p>
    </div>
  );
}
