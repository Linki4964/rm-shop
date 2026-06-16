import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import apiClient from "../../api/client";

const OrderTrendChart = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await apiClient.get("/admin/stats/products/top-selling");
      const { quantities, products } = res.data;
      if (chartRef.current) {
        const chart = echarts.init(chartRef.current);
        chart.setOption({
          title: { text: "销量TOP5商品" },
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          xAxis: {
            type: "category",
            data: products,
            axisLabel: { rotate: 30 },
          },
          yAxis: { type: "value", name: "销量" },
          series: [{ type: "bar", data: quantities }],
        });
      }
    };
    fetchData();
  }, []);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default OrderTrendChart;