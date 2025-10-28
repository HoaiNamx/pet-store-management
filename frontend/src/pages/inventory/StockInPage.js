import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';
import itemService from '../../services/itemService';
import { formatCurrency, formatDateForInput } from '../../utils/formatters';
import ErrorAlert from '../../components/common/ErrorAlert';
import PageHeader from '../../components/common/PageHeader';

function StockInPage() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    importDate: formatDateForInput(new Date()),
    notes: '',
  });
  const [details, setDetails] = useState([
    {
      itemId: null,
      item: null,
      quantity: '',
      costPrice: '',
      expiryDate: '',
    },
  ]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await itemService.getAll();
      setItems(data);
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
        costPrice: '',
        expiryDate: '',
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
      newDetails[index].currentStock = value?.Inventory?.quantity || 0;
    } else {
      newDetails[index][field] = value;
    }
    setDetails(newDetails);
  };

  const calculateTotal = () => {
    return details.reduce((sum, detail) => {
      const qty = parseFloat(detail.quantity) || 0;
      const price = parseFloat(detail.costPrice) || 0;
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
      .filter((d) => d.itemId && d.quantity > 0 && d.costPrice > 0)
      .map((d) => ({
        itemId: d.itemId,
        quantity: parseFloat(d.quantity),
        costPrice: parseFloat(d.costPrice),
        expiryDate: d.expiryDate || null,
      }));

    if (validDetails.length === 0) {
      setError('Vui lòng nhập đầy đủ thông tin cho các sản phẩm');
      return;
    }

    setLoading(true);
    try {
      await inventoryService.stockIn({
        importDate: formData.importDate,
        notes: formData.notes,
        details: validDetails,
      });
      setSuccess(true);
      // Reset form
      setFormData({
        importDate: formatDateForInput(new Date()),
        notes: '',
      });
      setDetails([
        {
          itemId: null,
          item: null,
          quantity: '',
          costPrice: '',
          expiryDate: '',
        },
      ]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Không thể nhập hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Nhập hàng"
        subtitle="Tạo phiếu nhập hàng mới"
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
      {success && (
        <Box sx={{ mb: 2 }}>
          <Typography color="success.main">Nhập hàng thành công!</Typography>
        </Box>
      )}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Ngày nhập"
              type="date"
              value={formData.importDate}
              onChange={(e) =>
                setFormData({ ...formData, importDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
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
          <Typography variant="h6">Chi tiết nhập hàng</Typography>
          <Button startIcon={<Add />} onClick={handleAddRow}>
            Thêm sản phẩm
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="25%">Sản phẩm</TableCell>
                <TableCell width="10%">Tồn kho</TableCell>
                <TableCell width="12%">Số lượng</TableCell>
                <TableCell width="18%">Giá nhập</TableCell>
                <TableCell width="15%">Hạn sử dụng</TableCell>
                <TableCell width="15%" align="right">Thành tiền</TableCell>
                <TableCell width="5%" align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Autocomplete
                      options={items}
                      getOptionLabel={(option) => option.name || ''}
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
                    <Typography variant="body2" color="text.secondary">
                      {detail.currentStock !== undefined ? detail.currentStock : '-'}
                    </Typography>
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
                      value={detail.costPrice}
                      onChange={(e) =>
                        handleDetailChange(index, 'costPrice', e.target.value)
                      }
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      value={detail.expiryDate}
                      onChange={(e) =>
                        handleDetailChange(index, 'expiryDate', e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(
                      (parseFloat(detail.quantity) || 0) *
                        (parseFloat(detail.costPrice) || 0)
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
          <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tạo phiếu nhập'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default StockInPage;
