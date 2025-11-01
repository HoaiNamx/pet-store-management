import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  InputAdornment,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import itemService from '../../services/itemService';
import itemTypeService from '../../services/itemTypeService';

function ProductDialog({ open, product, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    itemTypeId: '',
    sellingPrice: '',
    unit: 'pcs',
    description: '',
    imageUrl: '',
    status: 'active',
  });
  const [itemTypes, setItemTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItemTypes();
    if (product) {
      setFormData({
        name: product.name || '',
        itemTypeId: product.itemTypeId || '',
        sellingPrice: product.sellingPrice || '',
        unit: product.unit || 'pcs',
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        status: product.status || 'active',
      });
    }
  }, [product]);

  const fetchItemTypes = async () => {
    try {
      const data = await itemTypeService.getAll({ page: 1, limit: 1000 });
      setItemTypes(data.itemTypes || []);
    } catch (err) {
      console.error('Error fetching item types:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.checked ? 'active' : 'inactive'
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc';
    if (!formData.itemTypeId) newErrors.itemTypeId = 'Loại sản phẩm là bắt buộc';
    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Giá bán phải lớn hơn 0';
    }
    if (!formData.unit.trim()) newErrors.unit = 'Đơn vị là bắt buộc';
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
      if (product) {
        await itemService.update(product.id, formData);
      } else {
        await itemService.create(formData);
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
        {product ? 'Cập nhật sản phẩm' : 'Thêm Sản Phẩm'}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          {/* Hàng 1: Tên sản phẩm & Loại sản phẩm */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên sản phẩm *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.itemTypeId}>
              <InputLabel>Loại sản phẩm *</InputLabel>
              <Select
                name="itemTypeId"
                value={formData.itemTypeId}
                onChange={handleChange}
                label="Loại sản phẩm *"
              >
                {itemTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Hàng 2: Giá bán & Đơn vị tính */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Giá bán *"
              name="sellingPrice"
              type="number"
              value={formData.sellingPrice}
              onChange={handleChange}
              error={!!errors.sellingPrice}
              helperText={errors.sellingPrice}
              InputProps={{
                endAdornment: <InputAdornment position="end">VND</InputAdornment>,
              }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Đơn vị tính"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={!!errors.unit}
              helperText={errors.unit}
            />
          </Grid>

          {/* Hàng 3: Mô tả */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Nhập mô tả sản phẩm"
            />
          </Grid>

          {/* Hàng 4: Đường dẫn hình ảnh */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Đường dẫn hình ảnh"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Nhập URL hình ảnh"
            />
          </Grid>

          {/* Hàng 5: Công tắc Hoạt động */}
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.status === 'active'}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label="Hoạt động"
            />
          </Grid>

          {errors.submit && (
            <Grid item xs={12}>
              <Typography color="error" sx={{ mt: 1 }}>
                {errors.submit}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} color="inherit">
          HỦY
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'ĐANG XỬ LÝ...' : product ? 'CẬP NHẬT' : 'THÊM MỚI'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default ProductDialog;
