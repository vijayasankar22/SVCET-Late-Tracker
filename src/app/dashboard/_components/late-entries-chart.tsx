
"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"
import type { LateRecord } from "@/lib/types"

type LateEntriesChartProps = {
  records: LateRecord[]
}

export function LateEntriesChart({ records }: LateEntriesChartProps) {
  const departmentCounts = useMemo(() => {
    const counts: { [key: string]: number } = {}
    for (const record of records) {
      counts[record.departmentName] = (counts[record.departmentName] || 0) + 1
    }
    return Object.entries(counts).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
  }, [records])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    departmentCounts.forEach((dept, index) => {
        const chartColor = `var(--chart-${(index % 5) + 1})`
        config[dept.name] = {
            label: dept.name,
            color: chartColor,
        }
    })
    config.total = {
      label: "Total Late Entries",
      color: "hsl(var(--chart-1))",
    }
    return config
  }, [departmentCounts])
  
  const chartData = departmentCounts.map(item => ({
    department: item.name,
    total: item.total,
  }));


  return (
    <Card>
      <CardHeader>
        <CardTitle>Late Entries by Department</CardTitle>
        <CardDescription>A summary of late entries across all departments for the selected date range.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="department"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
