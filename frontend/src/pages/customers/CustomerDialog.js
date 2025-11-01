import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
} from '@mui/material';
import customerService from '../../services/customerService';

function CustomerDialog({ open, customer, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên khách hàng là bắt buộc';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (customer) {
        await customerService.update(customer.id, formData);
      } else {
        await customerService.create(formData);
      }
      onClose(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxWidth: 700, borderRadius: 2, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {customer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          {/* Hàng 1: Tên khách hàng & Số điện thoại */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên khách hàng *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số điện thoại *"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              required
            />
          </Grid>

          {/* Hàng 2: Email */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email khách hàng"
            />
          </Grid>

          {/* Hàng 3: Địa chỉ */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ"
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Nhập địa chỉ khách hàng"
            />
          </Grid>

          {errors.submit && (
            <Grid item xs={12}>
              <Box sx={{ color: 'error.main' }}>{errors.submit}</Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} color="inherit">
          HỦY
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'ĐANG XỬ LÝ...' : customer ? 'CẬP NHẬT' : 'THÊM MỚI'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CustomerDialog;
