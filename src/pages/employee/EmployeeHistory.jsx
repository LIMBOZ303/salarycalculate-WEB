import { useEffect, useState } from 'react';
import Select from '../../components/Select';
import Loading from '../../components/Loading';
import {
  EmployeeCard,
  EmployeeStat,
  EmployeeStatusBadge,
  EmployeeEmpty,
  EmployeeError,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
} from '../../components/employee/EmployeeUI';
import attendanceService from '../../services/attendanceService';
import { formatDate, formatClockTime, getCurrentMonthYear } from '../../utils/formatDate';
import { formatNumber } from '../../utils/formatCurrency';
import { getApiMessage } from '../../utils/parseApiData';

const STATUS_LABELS = {
  on_time: 'Đúng giờ',
  late: 'Đi muộn',
  absent: 'Vắng',
  early_leave: 'Về sớm',
  overtime: 'Tăng ca',
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || '--';
}

function getStatusVariant(status) {
  if (status === 'on_time') return 'success';
  if (status === 'late' || status === 'early_leave') return 'warning';
  if (status === 'absent') return 'danger';
  return 'default';
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
  const workDays = summary?.workDays ?? summary?.totalDays ?? summary?.presentDays ?? history.length;
  const lateDays =
    summary?.lateDays ??
    summary?.lateCount ??
    summary?.totalLate ??
    history.filter((row) => row.status === 'late').length;

  return (
    <div className="space-y-4">
      <EmployeeCard>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tháng"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={MONTH_OPTIONS}
            placeholder={false}
          />
          <Select
            label="Năm"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEAR_OPTIONS}
            placeholder={false}
          />
        </div>
      </EmployeeCard>

      {loading ? (
        <Loading message="Đang tải lịch sử..." />
      ) : error ? (
        <EmployeeError message={error} onRetry={fetchData} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <EmployeeStat label="Tổng giờ" value={`${formatNumber(totalHours)}h`} />
            <EmployeeStat label="Ngày làm" value={formatNumber(workDays)} />
            <EmployeeStat label="Đi trễ" value={formatNumber(lateDays)} />
          </div>

          {history.length === 0 ? (
            <EmployeeEmpty
              title="Chưa có dữ liệu"
              description={`Không có lịch sử chấm công tháng ${month}/${year}.`}
            />
          ) : (
            <div className="space-y-3">
              {history.map((row, index) => {
                const id = row.id || row._id || `${row.date}-${index}`;
                const hours = row.totalHours ?? row.workedHours ?? row.hours ?? 0;
                return (
                  <EmployeeCard key={id}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {formatDate(row.date || row.workDate || row.checkInTime)}
                      </p>
                      {row.status && (
                        <EmployeeStatusBadge variant={getStatusVariant(row.status)}>
                          {getStatusLabel(row.status)}
                        </EmployeeStatusBadge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-[#64748B]">Vào</p>
                        <p className="text-sm font-semibold text-[#0F172A] tabular-nums mt-0.5">
                          {formatClockTime(row.checkInTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B]">Ra</p>
                        <p className="text-sm font-semibold text-[#0F172A] tabular-nums mt-0.5">
                          {formatClockTime(row.checkOutTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748B]">Giờ</p>
                        <p className="text-sm font-semibold text-[#0F172A] tabular-nums mt-0.5">
                          {formatNumber(hours)}h
                        </p>
                      </div>
                    </div>
                  </EmployeeCard>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
