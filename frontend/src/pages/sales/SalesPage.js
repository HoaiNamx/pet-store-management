import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import { Visibility, Cancel, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import salesService from '../../services/salesService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [cancelDialog, setCancelDialog] = useState({ open: false, sale: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, [page, rowsPerPage]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await salesService.getAll({ page: page + 1, limit: rowsPerPage });
      setSales(data.sales || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (sale) => {
    navigate(`/sales/${sale.id}`);
  };

  const handleCancelClick = (sale) => {
    if (sale.status === 'cancelled') {
      setError('Đơn hàng này đã bị hủy');
      return;
    }
    setCancelDialog({ open: true, sale });
  };

  const handleCancelConfirm = async () => {
    try {
      await salesService.cancel(cancelDialog.sale.id);
      fetchSales();
      setCancelDialog({ open: false, sale: null });
    } catch (err) {
      setError(err.message || 'Không thể hủy đơn hàng');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      completed: { label: 'Hoàn thành', color: 'success' },
      cancelled: { label: 'Đã hủy', color: 'error' },
      pending: { label: 'Chờ xử lý', color: 'warning' },
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Tiền mặt',
      card: 'Thẻ',
      transfer: 'Chuyển khoản',
    };
    return methods[method] || method;
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader
        title="Quản lý Bán hàng"
        subtitle="Danh sách đơn hàng"
        actionLabel="Tạo đơn mới"
        onAction={() => navigate('/sales/new')}
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Ngày bán</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>#{sale.id}</TableCell>
                  <TableCell>
                    {(sale.customer || sale.Customer) ? (
                      <>
                        {(sale.customer?.name || sale.Customer?.name)}
                        <br />
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          {(sale.customer?.phone || sale.Customer?.phone)}
                        </span>
                      </>
                    ) : (
                      'Khách lẻ'
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(sale.totalAmount)}
                  </TableCell>
                  <TableCell>{getPaymentMethodLabel(sale.paymentMethod)}</TableCell>
                  <TableCell>{getStatusChip(sale.status)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleView(sale)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    {sale.status !== 'cancelled' && (
                      <IconButton
                        size="small"
                        onClick={() => handleCancelClick(sale)}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Chưa có đơn hàng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số dòng mỗi trang:"
        />
      </TableContainer>

      <ConfirmDialog
        open={cancelDialog.open}
        title="Xác nhận hủy đơn"
        message={`Bạn có chắc chắn muốn hủy đơn hàng #${cancelDialog.sale?.id}?`}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelDialog({ open: false, sale: null })}
      />
    </Box>
  );
}

export default SalesPage;
