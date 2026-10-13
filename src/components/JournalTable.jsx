import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

export default function JournalTable() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJournalData = useCallback(async () => {
    setLoading(true);

    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('name, group_name')
      .order('name', { ascending: true });

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false });

    if (studentsError) console.error(studentsError);
    if (attendanceError) console.error(attendanceError);

    if (studentsData && studentsData.length > 0) {
      const studentNames = Array.from(new Set(studentsData.map((s) => s.name || 'Без имени')));
      setStudents(studentNames);
    } else if (attendanceData && attendanceData.length > 0) {
      const visitedNames = Array.from(new Set(attendanceData.map((a) => a.student_name)));
      setStudents(visitedNames);
    } else {
      setStudents([]);
    }

    setAttendance(attendanceData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJournalData();
  }, [fetchJournalData]);

  const exportToExcel = () => {
    const dataForExcel = students.map((studentName, idx) => {
      const studentRecords = attendance.filter((a) => a.student_name === studentName);
      const visitsCount = studentRecords.length;
      const lastVisit = studentRecords[0]?.created_at
        ? new Date(studentRecords[0].created_at).toLocaleString('ru-RU')
        : 'Нет данных';

      return {
        '№': idx + 1,
        'Имя ученика': studentName,
        'Всего посещений': visitsCount,
        'Последняя активность': lastVisit,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Журнал');

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Журнал_посещаемости_${date}.xlsx`);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0, color: '#FFF', fontSize: '18px' }}>📊 Журнал посещаемости</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportToExcel} style={styles.excelBtn} disabled={students.length === 0}>
            📥 Скачать Excel
          </button>
          <button onClick={fetchJournalData} style={styles.refreshBtn}>
            🔄 Обновить
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>Загрузка журнала...</p>
      ) : students.length === 0 ? (
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>
          В базе пока нет учеников. Как только они войдут по PIN-коду, они появятся здесь!
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Имя ученика</th>
                <th style={styles.th}>Всего посещений</th>
                <th style={styles.th}>Последняя активность</th>
              </tr>
            </thead>
            <tbody>
              {students.map((studentName, idx) => {
                const studentRecords = attendance.filter((a) => a.student_name === studentName);
                const visitsCount = studentRecords.length;
                const lastVisit = studentRecords[0]?.created_at
                  ? new Date(studentRecords[0].created_at).toLocaleString('ru-RU')
                  : 'Нет данных';

                return (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.tdName}>{studentName}</td>
                    <td style={styles.tdCount}>
                      <span style={styles.badge}>{visitsCount} ур.</span>
                    </td>
                    <td style={styles.tdDate}>{lastVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  excelBtn: {
    backgroundColor: '#10B981',
    color: '#FFF',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  refreshBtn: {
    backgroundColor: '#334155',
    color: '#38BDF8',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#38BDF8',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: {
    padding: '10px',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#334155',
    color: '#94A3B8',
    fontSize: '13px',
  },
  tr: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#334155',
  },
  tdName: { padding: '10px', fontSize: '14px', fontWeight: 'bold', color: '#FFF' },
  tdCount: { padding: '10px' },
  tdDate: { padding: '10px', fontSize: '13px', color: '#94A3B8' },
  badge: {
    backgroundColor: '#0284C7',
    color: '#FFF',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};