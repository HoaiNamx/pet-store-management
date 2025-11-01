import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import reportService from '../../services/reportService';
import { formatCurrency, formatDate, getDateRange } from '../../utils/formatters';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import PageHeader from '../../components/common/PageHeader';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState('month');
  const [customDates, setCustomDates] = useState(getDateRange('month'));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, [reportType, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    try {
      let data;

      // Build params based on report type requirements
      let params = {};

      switch (reportType) {
        case 'revenue':
          // Backend expects: fromDate, toDate, groupBy
          params = {
            fromDate: customDates.startDate,
            toDate: customDates.endDate,
          };
          data = await reportService.getRevenueByPeriod(params);
          break;
        case 'revenue-customer':
          // Backend expects: fromDate, toDate, limit
          params = {
            fromDate: customDates.startDate,
            toDate: customDates.endDate,
          };
          data = await reportService.getRevenueByCustomer(params);
          break;
        case 'revenue-product':
          // Backend expects: fromDate, toDate, itemTypeId, limit
          params = {
            fromDate: customDates.startDate,
            toDate: customDates.endDate,
          };
          data = await reportService.getRevenueByProduct(params);
          break;
        case 'top-selling':
          // Backend expects: fromDate, toDate, limit, itemTypeId
          params = {
            fromDate: customDates.startDate,
            toDate: customDates.endDate,
          };
          data = await reportService.getTopSellingProducts(params);
          break;
        case 'slow-moving':
          // Backend expects: days, limit (NOT date range!)
          // Calculate days between dates if custom range is selected
          const start = new Date(customDates.startDate);
          const end = new Date(customDates.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          params = {
            days: diffDays || 30,
          };
          data = await reportService.getSlowMovingProducts(params);
          break;
        case 'profitability':
          // Backend expects: fromDate, toDate, limit
          params = {
            fromDate: customDates.startDate,
            toDate: customDates.endDate,
          };
          data = await reportService.getProductProfitability(params);
          break;
        case 'low-stock':
          // No params needed
          data = await reportService.getLowStockReport();
          break;
        case 'inventory-value':
          // No params needed
          data = await reportService.getInventoryValue();
          break;
        case 'stock-movement':
          // Backend expects: fromDate, toDate, itemId, limit
          params = {
            fromDate: customDates.startDate,
            toDate: customDates.endDate,
          };
          data = await reportService.getStockMovementReport(params);
          break;
        default:
          data = [];
      }

      setReportData(data);
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (range !== 'custom') {
      setCustomDates(getDateRange(range));
    }
  };

  const renderRevenueChart = () => {
    if (!reportData || reportData.length === 0) {
      return <Typography>Không có dữ liệu</Typography>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={reportData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Doanh thu" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = (dataKey, name) => {
    if (!reportData || reportData.length === 0) {
      return <Typography>Không có dữ liệu</Typography>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={reportData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => (typeof value === 'number' && value > 1000 ? formatCurrency(value) : value)} />
          <Legend />
          <Bar dataKey={dataKey} fill="#82ca9d" name={name} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTable = (columns) => {
    if (!reportData || reportData.length === 0) {
      return <Typography>Không có dữ liệu</Typography>;
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field} align={col.align || 'left'}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell key={col.field} align={col.align || 'left'}>
                    {col.format ? col.format(row[col.field]) : row[col.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case 'revenue':
        return renderRevenueChart();
      case 'revenue-customer':
        return renderTable([
          { field: 'customerName', label: 'Khách hàng' },
          { field: 'totalRevenue', label: 'Doanh thu', align: 'right', format: formatCurrency },
          { field: 'orderCount', label: 'Số đơn', align: 'right' },
        ]);
      case 'revenue-product':
        return renderTable([
          { field: 'productName', label: 'Sản phẩm' },
          { field: 'totalRevenue', label: 'Doanh thu', align: 'right', format: formatCurrency },
          { field: 'quantitySold', label: 'Số lượng bán', align: 'right' },
        ]);
      case 'top-selling':
        return renderBarChart('quantity', 'Số lượng');
      case 'slow-moving':
        return renderTable([
          { field: 'name', label: 'Sản phẩm' },
          { field: 'currentStock', label: 'Tồn kho', align: 'right' },
          { field: 'lastSaleDate', label: 'Bán lần cuối', format: (date) => date ? formatDate(date) : 'Chưa bán' },
        ]);
      case 'profitability':
        return renderTable([
          { field: 'name', label: 'Sản phẩm' },
          { field: 'revenue', label: 'Doanh thu', align: 'right', format: formatCurrency },
          { field: 'cost', label: 'Chi phí', align: 'right', format: formatCurrency },
          { field: 'profit', label: 'Lợi nhuận', align: 'right', format: formatCurrency },
          { field: 'margin', label: 'Tỷ suất (%)', align: 'right', format: (val) => `${val?.toFixed(2)}%` },
        ]);
      case 'low-stock':
        return renderTable([
          { field: 'name', label: 'Sản phẩm' },
          { field: 'currentStock', label: 'Tồn kho', align: 'right' },
          { field: 'minStock', label: 'Tồn tối thiểu', align: 'right' },
        ]);
      case 'inventory-value':
        return renderTable([
          { field: 'itemType', label: 'Loại sản phẩm' },
          { field: 'totalItems', label: 'Số loại', align: 'right' },
          { field: 'totalQuantity', label: 'Tồn kho', align: 'right' },
          { field: 'avgCostPrice', label: 'Giá nhập TB', align: 'right', format: formatCurrency },
          { field: 'totalValue', label: 'Giá trị', align: 'right', format: formatCurrency },
        ]);
      case 'stock-movement':
        return renderTable([
          { field: 'date', label: 'Ngày', format: formatDate },
          { field: 'item', label: 'Sản phẩm' },
          { field: 'type', label: 'Loại' },
          { field: 'quantity', label: 'Số lượng', align: 'right' },
        ]);
      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader title="Báo cáo" subtitle="Phân tích và báo cáo hệ thống" />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Loại báo cáo"
              >
                <MenuItem value="revenue">Doanh thu theo thời gian</MenuItem>
                <MenuItem value="revenue-customer">Doanh thu theo khách hàng</MenuItem>
                <MenuItem value="revenue-product">Doanh thu theo sản phẩm</MenuItem>
                <MenuItem value="top-selling">Sản phẩm bán chạy</MenuItem>
                <MenuItem value="slow-moving">Sản phẩm bán chậm</MenuItem>
                <MenuItem value="profitability">Lợi nhuận sản phẩm</MenuItem>
                <MenuItem value="low-stock">Sắp hết hàng</MenuItem>
                <MenuItem value="inventory-value">Giá trị tồn kho</MenuItem>
                <MenuItem value="stock-movement">Biến động kho</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                label="Khoảng thời gian"
              >
                <MenuItem value="today">Hôm nay</MenuItem>
                <MenuItem value="week">7 ngày qua</MenuItem>
                <MenuItem value="month">30 ngày qua</MenuItem>
                <MenuItem value="year">1 năm qua</MenuItem>
                <MenuItem value="custom">Tùy chỉnh</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {dateRange === 'custom' && (
            <>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Từ ngày"
                  value={customDates.startDate}
                  onChange={(e) =>
                    setCustomDates({ ...customDates, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Đến ngày"
                  value={customDates.endDate}
                  onChange={(e) =>
                    setCustomDates({ ...customDates, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} md={1}>
            <Button variant="contained" fullWidth onClick={loadReport}>
              Xem
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {loading ? <Loading /> : renderReport()}
      </Paper>
    </Box>
  );
}

export default ReportsPage;
