import { BarChart3, Table2 } from 'lucide-react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export interface ChartFrameProps {
  title: string;
  description?: string;
  summary: string;
  chart: React.ReactNode;
  tableFallback: React.ReactNode;
  headerAction?: React.ReactNode;
}

/**
 * Wraps data visualizations with an aria-label text summary and an accessible data-table toggle.
 */
export function ChartFrame({
  title,
  description,
  summary,
  chart,
  tableFallback,
  headerAction,
}: ChartFrameProps): React.ReactElement {
  const [viewMode, setViewMode] = React.useState<'chart' | 'table'>('chart');

  return (
    <Card>
      <Tabs
        value={viewMode}
        onValueChange={(next) => {
          if (next === 'chart' || next === 'table') {
            setViewMode(next);
          }
        }}
      >
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <TabsList aria-label={`${title} view mode`}>
              <TabsTrigger value="chart">
                <BarChart3 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                <span>Chart</span>
              </TabsTrigger>
              <TabsTrigger value="table">
                <Table2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                <span>Table</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="chart" className="mt-1">
            <div role="img" aria-label={summary} className="w-full">
              {chart}
            </div>
          </TabsContent>
          <TabsContent value="table" className="mt-1">
            <div className="max-h-72 overflow-y-auto rounded-md border border-[var(--border-default)]">
              {tableFallback}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
