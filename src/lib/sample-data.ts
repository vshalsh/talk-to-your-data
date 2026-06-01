// Built-in sample datasets so visitors can try without uploading their own CSV.

export interface SampleDataset {
  key: string;
  label: string;
  description: string;
  csv: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    key: 'regional_sales',
    label: 'Regional sales',
    description: 'Quarterly sales by region, product category, and channel.',
    csv: `region,quarter,category,channel,units,revenue
North,Q1,Hardware,Online,120,30000
North,Q1,Software,Direct,80,40000
North,Q2,Hardware,Online,150,37500
North,Q2,Software,Direct,95,47500
South,Q1,Hardware,Direct,60,15000
South,Q1,Software,Online,140,70000
South,Q2,Hardware,Direct,75,18750
South,Q2,Software,Online,160,80000
East,Q1,Hardware,Online,90,22500
East,Q1,Software,Direct,110,55000
East,Q2,Hardware,Online,130,32500
East,Q2,Software,Direct,125,62500
West,Q1,Hardware,Direct,200,50000
West,Q1,Software,Online,75,37500
West,Q2,Hardware,Direct,210,52500
West,Q2,Software,Online,88,44000`,
  },
  {
    key: 'employees',
    label: 'Employees',
    description: 'A small HR table: department, role, tenure, and salary.',
    csv: `name,department,role,location,years,salary
Aisha Khan,Engineering,Senior Engineer,Bangalore,6,2200000
Liam Murphy,Engineering,Engineer,Dublin,3,75000
Sofia Rossi,Data,Data Scientist,Milan,4,68000
Chen Wei,Data,Analytics Lead,Singapore,8,135000
Maria Garcia,Sales,Account Executive,Madrid,5,62000
James Smith,Sales,Sales Director,London,12,140000
Ananya Rao,Engineering,Staff Engineer,Bangalore,9,3200000
Tom Becker,Operations,Ops Manager,Berlin,7,88000
Yuki Tanaka,Data,Data Engineer,Tokyo,3,9500000
Olivia Brown,Operations,Analyst,Toronto,2,61000
Noah Wilson,Sales,Account Executive,New York,4,95000
Priya Nair,Engineering,Engineering Manager,Bangalore,11,4100000`,
  },
];

export function getSample(key: unknown): SampleDataset | null {
  const k = typeof key === 'string' ? key : '';
  return SAMPLE_DATASETS.find((s) => s.key === k) || null;
}
