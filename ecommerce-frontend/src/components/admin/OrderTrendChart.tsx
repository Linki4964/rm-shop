import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import apiClient from '../../api/client';

const OrderTrendChart = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await apiClient.get('/admin/stats/orders/trend');
      const { dates, amounts } = res.data;
      if (chartRef.current) {
        const chart = echarts.init(chartRef.current);
        chart.setOption({
          title: { text: '近7天订单金额趋势' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: dates },
          yAxis: { type: 'value', name: '金额 (元)' },
          series: [{ type: 'line', data: amounts, smooth: true }]
        });
      }
    };
    fetchData();
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
};

export default OrderTrendChart;