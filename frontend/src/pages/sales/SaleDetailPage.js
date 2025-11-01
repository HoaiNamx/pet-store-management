import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import salesService from '../../services/salesService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';

function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaleDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await salesService.getById(id);
      setSale(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSaleDetail();
  }, [fetchSaleDetail]);

  const getStatusChip = (status) => {
    const statusConfig = {
      completed: { label: 'Hoàn thành', color: 'success' },
      cancelled: { label: 'Đã hủy', color: 'error' },
      pending: { label: 'Chờ xử lý', color: 'warning' },
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} />;
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
  if (error) return <ErrorAlert error={error} onClose={() => navigate('/sales')} />;
  if (!sale) return null;

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/sales')}
        sx={{ mb: 2 }}
      >
        Quay lại
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Chi tiết đơn hàng #{sale.id}
          </Typography>
          {getStatusChip(sale.status)}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Khách hàng
            </Typography>
            <Typography variant="body1" gutterBottom>
              {sale.customer ? (
                <>
                  <strong>{sale.customer.name}</strong>
                  <br />
                  {sale.customer.phone}
                  {sale.customer.email && <><br />{sale.customer.email}</>}
                  {sale.customer.address && <><br />{sale.customer.address}</>}
                </>
              ) : (
                'Khách lẻ'
              )}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Thông tin đơn hàng
            </Typography>
            <Typography variant="body2">
              <strong>Ngày bán:</strong> {formatDateTime(sale.saleDate)}
            </Typography>
            <Typography variant="body2">
              <strong>Thanh toán:</strong> {getPaymentMethodLabel(sale.paymentMethod)}
            </Typography>
            {sale.notes && (
              <Typography variant="body2">
                <strong>Ghi chú:</strong> {sale.notes}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sản phẩm đã bán
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell align="right">Đơn giá</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell align="right">Thành tiền</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.details && sale.details.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell>{detail.item?.name || `Sản phẩm #${detail.itemId}`}</TableCell>
                  <TableCell align="right">{formatCurrency(detail.unitPrice)}</TableCell>
                  <TableCell align="right">{detail.quantity}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(detail.quantity * detail.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
              {(!sale.details || sale.details.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Không có chi tiết sản phẩm
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: { xs: '100%', sm: '300px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tổng cộng:</Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(sale.totalAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default SaleDetailPage;
