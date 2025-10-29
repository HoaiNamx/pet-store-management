import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import salesService from '../../services/salesService';
import itemService from '../../services/itemService';
import customerService from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import ErrorAlert from '../../components/common/ErrorAlert';
import PageHeader from '../../components/common/PageHeader';

function NewSalePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: null,
    customer: null,
    paymentMethod: 'cash',
    notes: '',
  });
  const [details, setDetails] = useState([
    {
      itemId: null,
      item: null,
      quantity: '',
      unitPrice: '',
    },
  ]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsData, customersData] = await Promise.all([
        itemService.getAll({ page: 1, limit: 1000 }),
        customerService.getAll({ page: 1, limit: 1000 }),
      ]);
      // Backend now returns { items: [...], pagination: {...} } and { customers: [...], pagination: {...} }
      setItems(itemsData.items || []);
      setCustomers(customersData.customers || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddRow = () => {
    setDetails([
      ...details,
      {
        itemId: null,
        item: null,
        quantity: '',
        unitPrice: '',
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    if (field === 'item') {
      newDetails[index].item = value;
      newDetails[index].itemId = value?.id || null;
      newDetails[index].unitPrice = value?.sellingPrice || '';
    } else {
      newDetails[index][field] = value;
    }
    setDetails(newDetails);
  };

  const calculateTotal = () => {
    return details.reduce((sum, detail) => {
      const qty = parseFloat(detail.quantity) || 0;
      const price = parseFloat(detail.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSubmit = async () => {
    // Validate
    if (details.length === 0 || !details.some((d) => d.itemId)) {
      setError('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    const validDetails = details
      .filter((d) => d.itemId && d.quantity > 0 && d.unitPrice > 0)
      .map((d) => ({
        itemId: d.itemId,
        quantity: parseFloat(d.quantity),
        unitPrice: parseFloat(d.unitPrice),
      }));

    if (validDetails.length === 0) {
      setError('Vui lòng nhập đầy đủ thông tin cho các sản phẩm');
      return;
    }

    setLoading(true);
    try {
      await salesService.create({
        customerId: formData.customerId,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        details: validDetails,
      });
      navigate('/sales');
    } catch (err) {
      setError(err.message || 'Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Tạo đơn hàng mới"
        subtitle="Tạo đơn bán hàng"
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name} - ${option.phone}`}
              value={formData.customer}
              onChange={(e, value) =>
                setFormData({ ...formData, customer: value, customerId: value?.id || null })
              }
              renderInput={(params) => (
                <TextField {...params} label="Khách hàng" placeholder="Chọn khách hàng (không bắt buộc)" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Phương thức thanh toán</InputLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                label="Phương thức thanh toán"
              >
                <MenuItem value="cash">Tiền mặt</MenuItem>
                <MenuItem value="card">Thẻ</MenuItem>
                <MenuItem value="transfer">Chuyển khoản</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Ghi chú"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Chi tiết đơn hàng</Typography>
          <Button startIcon={<Add />} onClick={handleAddRow}>
            Thêm sản phẩm
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40%">Sản phẩm</TableCell>
                <TableCell width="15%">Số lượng</TableCell>
                <TableCell width="20%">Đơn giá</TableCell>
                <TableCell width="20%" align="right">Thành tiền</TableCell>
                <TableCell width="5%" align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Autocomplete
                      options={items.filter((item) => item.isActive)}
                      getOptionLabel={(option) =>
                        `${option.name} (${formatCurrency(option.sellingPrice)})`
                      }
                      value={detail.item}
                      onChange={(e, value) =>
                        handleDetailChange(index, 'item', value)
                      }
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Chọn sản phẩm" size="small" />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={detail.quantity}
                      onChange={(e) =>
                        handleDetailChange(index, 'quantity', e.target.value)
                      }
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={detail.unitPrice}
                      onChange={(e) =>
                        handleDetailChange(index, 'unitPrice', e.target.value)
                      }
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(
                      (parseFloat(detail.quantity) || 0) *
                        (parseFloat(detail.unitPrice) || 0)
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {details.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRow(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Tổng cộng: {formatCurrency(calculateTotal())}
          </Typography>
          <Box>
            <Button onClick={() => navigate('/sales')} sx={{ mr: 1 }}>
              Hủy
            </Button>
            <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo đơn hàng'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default NewSalePage;
