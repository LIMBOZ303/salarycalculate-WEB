import { useEffect, useState } from 'react';
import { Calendar, LogIn, LogOut, Clock } from 'lucide-react';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge, { getStatusBadgeVariant } from '../../components/Badge';
import attendanceService from '../../services/attendanceService';
import { formatDate, formatTime, getCurrentMonthYear } from '../../utils/formatDate';
import { formatNumber } from '../../utils/formatCurrency';
import { getApiMessage } from '../../utils/parseApiData';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: String(y), label: String(y) };
});

const STATUS_LABELS = {
  on_time: 'Đúng giờ',
  late: 'Đi muộn',
  absent: 'Vắng',
  early_leave: 'Về sớm',
  overtime: 'Tăng ca',
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || '—';
}

export default function EmployeeHistory() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { month: Number(month), year: Number(year) };
      const [historyData, summaryData] = await Promise.all([
        attendanceService.getMyHistory(params),
        attendanceService.getMySummary(params),
      ]);
      setHistory(historyData);
      setSummary(summaryData);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const totalHours = summary?.totalHours ?? summary?.workHours ?? summary?.totalWorkedHours ?? 0;
  const workDays = summary?.workDays ?? summary?.totalDays ?? history.length;

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tháng"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={MONTHS}
            placeholder={false}
          />
          <Select
            label="Năm"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS}
            placeholder={false}
          />
        </div>
      </Card>

      {loading ? (
        <Loading message="Đang tải lịch sử..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold">Tổng giờ</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{formatNumber(totalHours)}h</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold">Ngày công</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{formatNumber(workDays)}</p>
            </div>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu"
              description={`Không có lịch sử chấm công tháng ${month}/${year}.`}
            />
          ) : (
            <div className="space-y-3">
              {history.map((row, index) => {
                const id = row.id || row._id || `${row.date}-${index}`;
                const hours = row.totalHours ?? row.workedHours ?? row.hours ?? 0;
                return (
                  <div
                    key={id}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-800">
                        {formatDate(row.date || row.workDate || row.checkInTime)}
                      </span>
                      {row.status && (
                        <Badge variant={getStatusBadgeVariant(row.status)}>
                          {getStatusLabel(row.status)}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 rounded-xl py-2 px-1">
                        <LogIn className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
                        <p className="text-[10px] text-slate-400">Vào</p>
                        <p className="text-xs font-bold text-slate-700">
                          {formatTime(row.checkInTime)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl py-2 px-1">
                        <LogOut className="w-3.5 h-3.5 text-brand-500 mx-auto mb-0.5" />
                        <p className="text-[10px] text-slate-400">Ra</p>
                        <p className="text-xs font-bold text-slate-700">
                          {formatTime(row.checkOutTime)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl py-2 px-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" />
                        <p className="text-[10px] text-slate-400">Giờ</p>
                        <p className="text-xs font-bold text-slate-700">{formatNumber(hours)}h</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
