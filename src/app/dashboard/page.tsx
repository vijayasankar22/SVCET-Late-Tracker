"use client";

import { useState } from 'react';
import { EntryForm } from './_components/entry-form';
import { RecordsTable } from './_components/records-table';
import type { LateRecord } from '@/lib/types';

export default function DashboardPage() {
  const [records, setRecords] = useState<LateRecord[]>([]);

  const handleAddRecord = (newRecord: LateRecord) => {
    setRecords((prevRecords) => [newRecord, ...prevRecords]);
  };

  return (
    <div className="space-y-8">
      <EntryForm onAddRecord={handleAddRecord} />
      <RecordsTable records={records} />
    </div>
  );
}
